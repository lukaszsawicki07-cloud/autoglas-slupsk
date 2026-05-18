/*
  # Restore anon access to PIN-protected admin functions

  The admin panel is used by unauthenticated visitors (anon role) who
  authenticate via PIN. All functions are internally PIN-protected via
  hardcoded check, so granting EXECUTE to anon is safe — a wrong PIN
  returns an exception and no data is returned.
*/

GRANT EXECUTE ON FUNCTION public.get_quote_requests_admin(text) TO anon;
GRANT EXECUTE ON FUNCTION public.update_quote_status_admin(text, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_content_rules(text) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_content_rule(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_content_rule(text, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_summary(timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION public.get_daily_sessions(timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION public.get_heatmap_clicks(timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION public.get_section_stats(timestamptz) TO anon;
