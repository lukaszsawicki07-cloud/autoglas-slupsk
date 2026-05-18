/*
  # Fix Security Permissions

  Addresses Supabase security advisor warnings:

  1. Revoke EXECUTE on trigger/internal functions from anon and authenticated
  2. Revoke EXECUTE on admin-only functions from anon
  3. Keep only legitimately public anon-callable functions:
     - get_active_content_rules() — read-only public config
     - get_active_ab_variants()   — read-only public config
     - increment_ab_variant()     — anonymous A/B tracking
  4. Add minimal RLS policies for tables with RLS but no policies
     (ab_tests, ab_variants, content_rules — all access is via SECURITY DEFINER RPCs)

  Note: pg_net extension cannot be moved via SET SCHEMA (not supported by this version).
  It remains in public but poses no risk as its functions require superuser to use.
*/

-- ============================================================
-- Trigger / internal functions — never callable via REST RPC
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.content_rules_set_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_quote_request() FROM anon, authenticated;

-- ============================================================
-- Admin-only functions — revoke from anon
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.get_quote_requests_admin(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_quote_status_admin(text, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_resend_api_key() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_content_rules(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_content_rule(text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.upsert_content_rule(text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_analytics_summary(timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_daily_sessions(timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_heatmap_clicks(timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_section_stats(timestamptz) FROM anon;

-- ============================================================
-- Confirm legitimate anon grants
-- ============================================================
GRANT EXECUTE ON FUNCTION public.get_active_content_rules() TO anon;
GRANT EXECUTE ON FUNCTION public.get_active_ab_variants(text) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_ab_variant(uuid, text) TO anon;

-- ============================================================
-- RLS policies: tables have RLS but no policies — add deny-all
-- selects to satisfy the advisor while keeping all access via RPC
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ab_tests' AND policyname = 'No direct access to ab_tests'
  ) THEN
    EXECUTE 'CREATE POLICY "No direct access to ab_tests" ON public.ab_tests FOR SELECT TO authenticated USING (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ab_variants' AND policyname = 'No direct access to ab_variants'
  ) THEN
    EXECUTE 'CREATE POLICY "No direct access to ab_variants" ON public.ab_variants FOR SELECT TO authenticated USING (false)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'content_rules' AND policyname = 'No direct access to content_rules'
  ) THEN
    EXECUTE 'CREATE POLICY "No direct access to content_rules" ON public.content_rules FOR SELECT TO authenticated USING (false)';
  END IF;
END $$;
