/*
  # Fix Security — Revoke EXECUTE from PUBLIC role

  In PostgreSQL, EXECUTE is granted to PUBLIC by default for all functions.
  Revoking from anon/authenticated individually is not sufficient because
  both roles inherit from PUBLIC. Must revoke from PUBLIC first, then
  re-grant selectively.
*/

-- ============================================================
-- Revoke EXECUTE from PUBLIC for all sensitive functions
-- Then re-grant only what is needed to specific roles
-- ============================================================

-- Trigger / internal functions — no external role should call these
REVOKE EXECUTE ON FUNCTION public.content_rules_set_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_new_quote_request() FROM PUBLIC;

-- Admin-only: PIN-protected, authenticated only
REVOKE EXECUTE ON FUNCTION public.get_quote_requests_admin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_quote_requests_admin(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_quote_status_admin(text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_quote_status_admin(text, uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_resend_api_key() FROM PUBLIC;
-- get_resend_api_key is called only from edge function (service_role), not from client

REVOKE EXECUTE ON FUNCTION public.get_content_rules(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_content_rules(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.delete_content_rule(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_content_rule(text, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.upsert_content_rule(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_content_rule(text, jsonb) TO authenticated;

-- Analytics admin: PIN-protected, authenticated only
REVOKE EXECUTE ON FUNCTION public.get_analytics_summary(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_analytics_summary(timestamptz) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_daily_sessions(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_daily_sessions(timestamptz) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_heatmap_clicks(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_heatmap_clicks(timestamptz) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_section_stats(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_section_stats(timestamptz) TO authenticated;

-- ============================================================
-- Legitimately public (anon + authenticated)
-- ============================================================

-- get_active_content_rules: frontend page-load, read-only config
REVOKE EXECUTE ON FUNCTION public.get_active_content_rules() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_content_rules() TO anon, authenticated;

-- get_active_ab_variants: frontend A/B config
REVOKE EXECUTE ON FUNCTION public.get_active_ab_variants(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_ab_variants(text) TO anon, authenticated;

-- increment_ab_variant: anonymous impression/conversion counting
REVOKE EXECUTE ON FUNCTION public.increment_ab_variant(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_ab_variant(uuid, text) TO anon, authenticated;
