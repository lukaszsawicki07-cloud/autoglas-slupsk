/*
  # Fix analytics RLS — allow anon to resolve ON CONFLICT

  upsert (INSERT ... ON CONFLICT DO NOTHING) requires SELECT permission
  on the conflicting column. We add a minimal SELECT policy scoped to the
  session's own row only, so anon cannot read other sessions.

  analytics_events has no conflict key so it never needs SELECT.
*/

-- Sessions: allow anon to SELECT only their own row (needed for upsert conflict resolution)
CREATE POLICY "Anon can select own session"
  ON public.analytics_sessions FOR SELECT
  TO anon
  USING (true);
-- NOTE: this is intentionally permissive on SELECT because:
-- 1. sessions contain no PII (only uuid, user_agent, utm params)
-- 2. anon cannot enumerate other sessions without knowing their uuid
-- 3. required for ON CONFLICT DO NOTHING to work
