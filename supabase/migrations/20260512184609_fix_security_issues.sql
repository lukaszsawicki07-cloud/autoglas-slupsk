/*
  # Fix Security Issues

  Addresses all security warnings from the Supabase security advisor:

  1. RLS Policies — Replace "always true" INSERT/UPDATE policies with restrictive ones
  2. GraphQL Schema Visibility — Revoke SELECT from anon and authenticated on sensitive tables
  3. SECURITY DEFINER Functions — Revoke EXECUTE from anon and authenticated roles
  4. Storage — Drop the broad SELECT policy that allows bucket listing
  5. ab_variants — Replace direct UPDATE with a secure RPC function

  Notes:
  - pg_net cannot be moved via ALTER EXTENSION SET SCHEMA (not supported), skipped.
  - The analytics client writes events/sessions using the anon key; INSERT is kept
    open for anon but WITH CHECK constraints are tightened.
  - ab_variants impressions/conversions are now incremented via increment_ab_variant()
    RPC callable only by the analytics lib (anon) but via a controlled function.
*/

-- ============================================================
-- 1. ab_variants — remove unrestricted UPDATE policy
-- ============================================================
DROP POLICY IF EXISTS "Anon can update ab_variants impressions and conversions" ON public.ab_variants;
DROP POLICY IF EXISTS "Anon can read ab_variants" ON public.ab_variants;
DROP POLICY IF EXISTS "Authenticated users can read ab_variants" ON public.ab_variants;

-- ============================================================
-- 2. ab_tests — drop overly broad policies
-- ============================================================
DROP POLICY IF EXISTS "Anon can read active ab_tests" ON public.ab_tests;
DROP POLICY IF EXISTS "Authenticated users can read ab_tests" ON public.ab_tests;

-- ============================================================
-- 3. analytics_sessions — restrict INSERT
-- ============================================================
DROP POLICY IF EXISTS "Anon can insert sessions" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Authenticated can read sessions" ON public.analytics_sessions;

CREATE POLICY "Anon can insert own session"
  ON public.analytics_sessions FOR INSERT
  TO anon
  WITH CHECK (
    id IS NOT NULL
    AND length(coalesce(user_agent, '')) <= 512
    AND length(coalesce(referrer, '')) <= 512
  );

-- ============================================================
-- 4. analytics_events — restrict INSERT
-- ============================================================
DROP POLICY IF EXISTS "Anon can insert events" ON public.analytics_events;
DROP POLICY IF EXISTS "Authenticated can read events" ON public.analytics_events;

CREATE POLICY "Anon can insert valid events"
  ON public.analytics_events FOR INSERT
  TO anon
  WITH CHECK (
    session_id IS NOT NULL
    AND event_type IN ('scroll','section_view','click','page_view','bounce','quote_open','quote_submit','ab_impression','ab_conversion')
    AND coalesce(scroll_depth, 0) BETWEEN 0 AND 100
    AND length(coalesce(section, '')) <= 64
  );

-- ============================================================
-- 5. quote_requests — tighten INSERT policy
-- ============================================================
DROP POLICY IF EXISTS "Anyone can submit quote requests" ON public.quote_requests;

CREATE POLICY "Anon can submit quote request with required fields"
  ON public.quote_requests FOR INSERT
  TO anon
  WITH CHECK (
    name IS NOT NULL AND length(name) BETWEEN 2 AND 120
    AND phone IS NOT NULL AND length(phone) BETWEEN 7 AND 20
    AND vehicle IS NOT NULL AND length(vehicle) BETWEEN 2 AND 200
    AND description IS NOT NULL AND length(description) >= 5
  );

-- ============================================================
-- 6. contact_requests — tighten INSERT policy (if table exists)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_requests' AND table_schema = 'public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can submit contact requests" ON public.contact_requests';
    EXECUTE $policy$
      CREATE POLICY "Anon can submit contact request with required fields"
        ON public.contact_requests FOR INSERT
        TO anon
        WITH CHECK (
          name IS NOT NULL AND length(name) BETWEEN 2 AND 120
          AND (email IS NULL OR length(email) BETWEEN 5 AND 200)
        )
    $policy$;
  END IF;
END $$;

-- ============================================================
-- 7. Revoke SELECT visibility (GraphQL schema exposure)
-- ============================================================
REVOKE SELECT ON public.ab_tests FROM anon, authenticated;
REVOKE SELECT ON public.ab_variants FROM anon, authenticated;
REVOKE SELECT ON public.analytics_events FROM anon, authenticated;
REVOKE SELECT ON public.analytics_sessions FROM anon, authenticated;
REVOKE SELECT ON public.quote_requests FROM anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_requests' AND table_schema = 'public') THEN
    EXECUTE 'REVOKE SELECT ON public.contact_requests FROM anon, authenticated';
  END IF;
END $$;

-- ============================================================
-- 8. Revoke EXECUTE on SECURITY DEFINER functions
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.get_quote_requests_admin(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_quote_status_admin(text, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_resend_api_key() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_quote_request() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

-- ============================================================
-- 9. Storage — drop bucket-listing policy on quote-photos
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view quote photos" ON storage.objects;

-- ============================================================
-- 10. Secure RPC for ab_variant stat updates (replaces direct UPDATE)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_ab_variant(
  p_variant_id uuid,
  p_field text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_field NOT IN ('impressions', 'conversions') THEN
    RAISE EXCEPTION 'Invalid field: %', p_field;
  END IF;
  IF p_field = 'impressions' THEN
    UPDATE public.ab_variants SET impressions = impressions + 1 WHERE id = p_variant_id;
  ELSE
    UPDATE public.ab_variants SET conversions = conversions + 1 WHERE id = p_variant_id;
  END IF;
END;
$$;

-- Callable by anon (page load increments impressions) but via controlled function only
GRANT EXECUTE ON FUNCTION public.increment_ab_variant(uuid, text) TO anon, authenticated;

-- ============================================================
-- 11. Secure RPC for reading ab_variants (replaces direct SELECT)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_active_ab_variants(p_test_name text)
RETURNS TABLE(
  variant_id uuid,
  variant_name text,
  variant_description text,
  variant_weight integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
    SELECT v.id, v.name, v.description, v.weight
    FROM public.ab_variants v
    JOIN public.ab_tests t ON t.id = v.test_id
    WHERE t.name = p_test_name AND t.is_active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_ab_variants(text) TO anon, authenticated;

-- ============================================================
-- 12. RLS SELECT policies for analytics dashboard (authenticated admin)
--     These use SECURITY DEFINER functions so direct table SELECT
--     is not needed from the client role.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_analytics_summary(p_since timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_sessions', (SELECT count(*) FROM public.analytics_sessions WHERE created_at >= p_since),
    'total_clicks',   (SELECT count(*) FROM public.analytics_events WHERE event_type = 'click' AND created_at >= p_since),
    'quote_opens',    (SELECT count(*) FROM public.analytics_events WHERE event_type = 'quote_open' AND created_at >= p_since),
    'quote_submits',  (SELECT count(*) FROM public.analytics_events WHERE event_type = 'quote_submit' AND created_at >= p_since),
    'avg_scroll',     (SELECT round(avg(scroll_depth)) FROM public.analytics_events WHERE event_type = 'scroll' AND created_at >= p_since)
  ) INTO result;
  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_analytics_summary(timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_summary(timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_section_stats(p_since timestamptz)
RETURNS TABLE(section text, views bigint, avg_time_ms numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
    SELECT e.section, count(*) AS views, round(avg(e.time_on_section_ms)) AS avg_time_ms
    FROM public.analytics_events e
    WHERE e.event_type = 'section_view' AND e.created_at >= p_since AND e.section <> ''
    GROUP BY e.section
    ORDER BY views DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_section_stats(timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_section_stats(timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_daily_sessions(p_since timestamptz)
RETURNS TABLE(day text, cnt bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
    SELECT to_char(created_at, 'YYYY-MM-DD') AS day, count(*) AS cnt
    FROM public.analytics_sessions
    WHERE created_at >= p_since
    GROUP BY 1
    ORDER BY 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_daily_sessions(timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_daily_sessions(timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_heatmap_clicks(p_since timestamptz)
RETURNS TABLE(click_x integer, click_y integer, page_width integer, page_height integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
    SELECT e.click_x, e.click_y, e.page_width, e.page_height
    FROM public.analytics_events e
    WHERE e.event_type = 'click' AND e.created_at >= p_since;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_heatmap_clicks(timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_heatmap_clicks(timestamptz) TO authenticated;
