/*
  # Content Rules Table

  Enables UTM-based and source-based dynamic content personalization without an LLM.

  1. New Table: `content_rules`
     - Condition columns: match_utm_source, match_utm_medium, match_utm_campaign, match_referrer_contains
       (NULL = wildcard, matches any value)
     - Content override columns for hero section (title, subtitle, description, CTAs, badges)
       in both Polish and English (NULL = keep default)
     - priority: higher number wins when multiple rules match

  2. Security
     - RLS enabled, anon/authenticated have no direct table access
     - All access via SECURITY DEFINER RPC functions
     - Admin functions PIN-protected (same PIN as quote admin)
     - get_active_content_rules() is callable by anon (read-only public config)

  3. Admin RPCs
     - get_content_rules(pin) — all rules for admin panel
     - upsert_content_rule(pin, rule_jsonb) — create or update
     - delete_content_rule(pin, rule_id) — hard delete
*/

CREATE TABLE IF NOT EXISTS public.content_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,

  match_utm_source text,
  match_utm_medium text,
  match_utm_campaign text,
  match_referrer_contains text,

  hero_title_pl text,
  hero_title_en text,
  hero_subtitle_pl text,
  hero_subtitle_en text,
  hero_description_pl text,
  hero_description_en text,
  hero_cta_primary_pl text,
  hero_cta_primary_en text,
  hero_cta_secondary_pl text,
  hero_cta_secondary_en text,
  hero_badge_1_pl text,
  hero_badge_2_pl text,
  hero_badge_3_pl text,
  hero_badge_1_en text,
  hero_badge_2_en text,
  hero_badge_3_en text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.content_rules ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.content_rules FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.content_rules_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.content_rules_set_updated_at() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_content_rules_updated_at ON public.content_rules;
CREATE TRIGGER trg_content_rules_updated_at
  BEFORE UPDATE ON public.content_rules
  FOR EACH ROW EXECUTE FUNCTION public.content_rules_set_updated_at();

-- ============================================================
-- Shared PIN check (inlined — no private schema)
-- ============================================================

-- get_active_content_rules — frontend page load, anon-callable
CREATE OR REPLACE FUNCTION public.get_active_content_rules()
RETURNS SETOF public.content_rules
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
    SELECT * FROM public.content_rules
    WHERE is_active = true
    ORDER BY priority DESC, created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_content_rules() TO anon, authenticated;

-- get_content_rules — admin panel, PIN-protected
CREATE OR REPLACE FUNCTION public.get_content_rules(p_pin text)
RETURNS SETOF public.content_rules
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_pin <> '2580' THEN RAISE EXCEPTION 'Nieprawidłowy PIN'; END IF;
  RETURN QUERY SELECT * FROM public.content_rules ORDER BY priority DESC, created_at ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_content_rules(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_content_rules(text) TO authenticated;

-- upsert_content_rule — create or update
CREATE OR REPLACE FUNCTION public.upsert_content_rule(p_pin text, p_rule jsonb)
RETURNS public.content_rules
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_result public.content_rules;
BEGIN
  IF p_pin <> '2580' THEN RAISE EXCEPTION 'Nieprawidłowy PIN'; END IF;

  v_id := (p_rule->>'id')::uuid;

  IF v_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.content_rules WHERE id = v_id) THEN
    UPDATE public.content_rules SET
      name                    = COALESCE(p_rule->>'name', name),
      is_active               = COALESCE((p_rule->>'is_active')::boolean, is_active),
      priority                = COALESCE((p_rule->>'priority')::integer, priority),
      match_utm_source        = NULLIF(p_rule->>'match_utm_source', ''),
      match_utm_medium        = NULLIF(p_rule->>'match_utm_medium', ''),
      match_utm_campaign      = NULLIF(p_rule->>'match_utm_campaign', ''),
      match_referrer_contains = NULLIF(p_rule->>'match_referrer_contains', ''),
      hero_title_pl           = NULLIF(p_rule->>'hero_title_pl', ''),
      hero_title_en           = NULLIF(p_rule->>'hero_title_en', ''),
      hero_subtitle_pl        = NULLIF(p_rule->>'hero_subtitle_pl', ''),
      hero_subtitle_en        = NULLIF(p_rule->>'hero_subtitle_en', ''),
      hero_description_pl     = NULLIF(p_rule->>'hero_description_pl', ''),
      hero_description_en     = NULLIF(p_rule->>'hero_description_en', ''),
      hero_cta_primary_pl     = NULLIF(p_rule->>'hero_cta_primary_pl', ''),
      hero_cta_primary_en     = NULLIF(p_rule->>'hero_cta_primary_en', ''),
      hero_cta_secondary_pl   = NULLIF(p_rule->>'hero_cta_secondary_pl', ''),
      hero_cta_secondary_en   = NULLIF(p_rule->>'hero_cta_secondary_en', ''),
      hero_badge_1_pl         = NULLIF(p_rule->>'hero_badge_1_pl', ''),
      hero_badge_2_pl         = NULLIF(p_rule->>'hero_badge_2_pl', ''),
      hero_badge_3_pl         = NULLIF(p_rule->>'hero_badge_3_pl', ''),
      hero_badge_1_en         = NULLIF(p_rule->>'hero_badge_1_en', ''),
      hero_badge_2_en         = NULLIF(p_rule->>'hero_badge_2_en', ''),
      hero_badge_3_en         = NULLIF(p_rule->>'hero_badge_3_en', '')
    WHERE id = v_id
    RETURNING * INTO v_result;
  ELSE
    INSERT INTO public.content_rules (
      name, is_active, priority,
      match_utm_source, match_utm_medium, match_utm_campaign, match_referrer_contains,
      hero_title_pl, hero_title_en, hero_subtitle_pl, hero_subtitle_en,
      hero_description_pl, hero_description_en,
      hero_cta_primary_pl, hero_cta_primary_en,
      hero_cta_secondary_pl, hero_cta_secondary_en,
      hero_badge_1_pl, hero_badge_2_pl, hero_badge_3_pl,
      hero_badge_1_en, hero_badge_2_en, hero_badge_3_en
    ) VALUES (
      COALESCE(p_rule->>'name', ''),
      COALESCE((p_rule->>'is_active')::boolean, true),
      COALESCE((p_rule->>'priority')::integer, 0),
      NULLIF(p_rule->>'match_utm_source', ''),   NULLIF(p_rule->>'match_utm_medium', ''),
      NULLIF(p_rule->>'match_utm_campaign', ''), NULLIF(p_rule->>'match_referrer_contains', ''),
      NULLIF(p_rule->>'hero_title_pl', ''),      NULLIF(p_rule->>'hero_title_en', ''),
      NULLIF(p_rule->>'hero_subtitle_pl', ''),   NULLIF(p_rule->>'hero_subtitle_en', ''),
      NULLIF(p_rule->>'hero_description_pl', ''),NULLIF(p_rule->>'hero_description_en', ''),
      NULLIF(p_rule->>'hero_cta_primary_pl', ''),NULLIF(p_rule->>'hero_cta_primary_en', ''),
      NULLIF(p_rule->>'hero_cta_secondary_pl', ''),NULLIF(p_rule->>'hero_cta_secondary_en', ''),
      NULLIF(p_rule->>'hero_badge_1_pl', ''),    NULLIF(p_rule->>'hero_badge_2_pl', ''),
      NULLIF(p_rule->>'hero_badge_3_pl', ''),    NULLIF(p_rule->>'hero_badge_1_en', ''),
      NULLIF(p_rule->>'hero_badge_2_en', ''),    NULLIF(p_rule->>'hero_badge_3_en', '')
    )
    RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_content_rule(text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.upsert_content_rule(text, jsonb) TO authenticated;

-- delete_content_rule
CREATE OR REPLACE FUNCTION public.delete_content_rule(p_pin text, p_rule_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_pin <> '2580' THEN RAISE EXCEPTION 'Nieprawidłowy PIN'; END IF;
  DELETE FROM public.content_rules WHERE id = p_rule_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_content_rule(text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_content_rule(text, uuid) TO authenticated;

-- Seed inactive example rule
INSERT INTO public.content_rules (
  name, is_active, priority,
  match_utm_source, match_utm_medium,
  hero_title_pl, hero_title_en,
  hero_subtitle_pl, hero_subtitle_en,
  hero_cta_primary_pl, hero_cta_primary_en
) VALUES (
  'Facebook - kampania ciężarówki',
  false, 10,
  'facebook', 'cpc',
  'Naprawa Szyb do Ciężarówek i TIR-ów',
  'Windshield Repair for Trucks and HGVs',
  'Ekspresowa wymiana — bez przestoju floty',
  'Express replacement — no fleet downtime',
  'Zadzwoń Teraz', 'Call Now'
);
