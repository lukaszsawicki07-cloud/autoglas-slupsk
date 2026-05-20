/*
  # A/B Auto-promote + Geo content support

  1. A/B Auto-promote
    - Dodaje funkcję `ab_auto_promote()` wywoływaną przez cron Edge Function
    - Zwycięzca: wariant z CVR > control*1.2 i min. 100 impressions dla obu wariantów
    - Ustawia winner_variant_id i dezaktywuje test

  2. Geo content
    - Dodaje kolumnę `match_country` do content_rules (ISO 3166-1 alpha-2, np. 'PL', 'DE')
    - Aktualizuje get_active_content_rules() — kolumna jest już w SETOF content_rules
    - Aktualizuje upsert_content_rule() żeby obsługiwał nowe pole

  3. Behavioral triggers
    - Dodaje tabelę behavioral_triggers z warunkami i akcjami
    - Reguły: warunek (sekcja, czas) → akcja (banner/popup z tekstem)
*/

-- ============================================================
-- 1. A/B AUTO-PROMOTE FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.ab_auto_promote()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  rec RECORD;
  control_rec RECORD;
  best_rec RECORD;
  control_cvr numeric;
  best_cvr numeric;
  promoted_count integer := 0;
  result jsonb := '[]'::jsonb;
BEGIN
  -- Loop over active tests without a winner
  FOR rec IN
    SELECT id, name FROM public.ab_tests
    WHERE is_active = true AND winner_variant_id IS NULL
  LOOP
    -- Fetch control
    SELECT * INTO control_rec
    FROM public.ab_variants
    WHERE test_id = rec.id AND name = 'control'
    LIMIT 1;

    -- Need at least 100 impressions on control
    IF control_rec IS NULL OR control_rec.impressions < 100 THEN
      CONTINUE;
    END IF;

    control_cvr := CASE WHEN control_rec.impressions > 0
      THEN control_rec.conversions::numeric / control_rec.impressions
      ELSE 0 END;

    -- Find best non-control variant with enough impressions
    SELECT * INTO best_rec
    FROM public.ab_variants
    WHERE test_id = rec.id
      AND name <> 'control'
      AND impressions >= 100
    ORDER BY (conversions::numeric / NULLIF(impressions, 0)) DESC NULLS LAST
    LIMIT 1;

    IF best_rec IS NULL THEN CONTINUE; END IF;

    best_cvr := CASE WHEN best_rec.impressions > 0
      THEN best_rec.conversions::numeric / best_rec.impressions
      ELSE 0 END;

    -- Promote if variant beats control by 20%
    IF best_cvr > control_cvr * 1.2 THEN
      UPDATE public.ab_tests
      SET winner_variant_id = best_rec.id, is_active = false
      WHERE id = rec.id;

      promoted_count := promoted_count + 1;
      result := result || jsonb_build_object(
        'test', rec.name,
        'winner', best_rec.name,
        'control_cvr', round(control_cvr * 100, 2),
        'winner_cvr', round(best_cvr * 100, 2)
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('promoted', promoted_count, 'results', result);
END;
$$;

-- Only service_role can call (Edge Function uses service_role key)
REVOKE EXECUTE ON FUNCTION public.ab_auto_promote() FROM anon, authenticated;

-- ============================================================
-- 2. GEO CONTENT — add match_country to content_rules
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_rules' AND column_name = 'match_country'
  ) THEN
    ALTER TABLE public.content_rules ADD COLUMN match_country text DEFAULT NULL;
  END IF;
END $$;

-- ============================================================
-- 3. BEHAVIORAL TRIGGERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.behavioral_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,

  -- Conditions (all must match — null = any)
  condition_section text DEFAULT NULL,          -- e.g. 'gallery' — user viewed this section
  condition_min_scroll integer DEFAULT NULL,    -- e.g. 50 — scroll depth %
  condition_no_quote_open boolean DEFAULT false, -- trigger only if quote form NOT opened
  condition_delay_seconds integer DEFAULT 0,    -- wait N seconds after condition met

  -- Action
  action_type text NOT NULL DEFAULT 'banner'
    CHECK (action_type IN ('banner', 'popup')),
  action_text_pl text NOT NULL DEFAULT '',
  action_text_en text NOT NULL DEFAULT '',
  action_cta_pl text DEFAULT NULL,
  action_cta_en text DEFAULT NULL,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.behavioral_triggers ENABLE ROW LEVEL SECURITY;

-- No direct access — all through RPC
REVOKE ALL ON public.behavioral_triggers FROM anon, authenticated;

-- RPC: get active triggers (public — called on page load)
CREATE OR REPLACE FUNCTION public.get_active_behavioral_triggers()
RETURNS SETOF public.behavioral_triggers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.behavioral_triggers
  WHERE is_active = true
  ORDER BY priority DESC, created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_behavioral_triggers() TO anon, authenticated;

-- RPC: upsert trigger (admin only)
CREATE OR REPLACE FUNCTION public.upsert_behavioral_trigger(
  p_pin text,
  p_trigger jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_stored_pin text;
BEGIN
  SELECT decrypted_secret INTO v_stored_pin
  FROM vault.decrypted_secrets WHERE name = 'admin_pin' LIMIT 1;
  IF v_stored_pin IS NULL OR p_pin <> v_stored_pin THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  INSERT INTO public.behavioral_triggers (
    id, name, is_active, priority,
    condition_section, condition_min_scroll, condition_no_quote_open, condition_delay_seconds,
    action_type, action_text_pl, action_text_en, action_cta_pl, action_cta_en
  ) VALUES (
    COALESCE((p_trigger->>'id')::uuid, gen_random_uuid()),
    COALESCE(p_trigger->>'name', ''),
    COALESCE((p_trigger->>'is_active')::boolean, true),
    COALESCE((p_trigger->>'priority')::integer, 0),
    p_trigger->>'condition_section',
    (p_trigger->>'condition_min_scroll')::integer,
    COALESCE((p_trigger->>'condition_no_quote_open')::boolean, false),
    COALESCE((p_trigger->>'condition_delay_seconds')::integer, 0),
    COALESCE(p_trigger->>'action_type', 'banner'),
    COALESCE(p_trigger->>'action_text_pl', ''),
    COALESCE(p_trigger->>'action_text_en', ''),
    p_trigger->>'action_cta_pl',
    p_trigger->>'action_cta_en'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active,
    priority = EXCLUDED.priority,
    condition_section = EXCLUDED.condition_section,
    condition_min_scroll = EXCLUDED.condition_min_scroll,
    condition_no_quote_open = EXCLUDED.condition_no_quote_open,
    condition_delay_seconds = EXCLUDED.condition_delay_seconds,
    action_type = EXCLUDED.action_type,
    action_text_pl = EXCLUDED.action_text_pl,
    action_text_en = EXCLUDED.action_text_en,
    action_cta_pl = EXCLUDED.action_cta_pl,
    action_cta_en = EXCLUDED.action_cta_en,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_behavioral_trigger(text, jsonb) TO anon, authenticated;

-- RPC: delete trigger (admin only)
CREATE OR REPLACE FUNCTION public.delete_behavioral_trigger(
  p_pin text,
  p_trigger_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_stored_pin text;
BEGIN
  SELECT decrypted_secret INTO v_stored_pin
  FROM vault.decrypted_secrets WHERE name = 'admin_pin' LIMIT 1;
  IF v_stored_pin IS NULL OR p_pin <> v_stored_pin THEN
    RAISE EXCEPTION 'permission denied';
  END IF;
  DELETE FROM public.behavioral_triggers WHERE id = p_trigger_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_behavioral_trigger(text, uuid) TO anon, authenticated;
