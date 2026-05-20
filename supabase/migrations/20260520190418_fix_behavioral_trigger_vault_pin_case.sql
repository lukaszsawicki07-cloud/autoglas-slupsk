/*
  # Fix upsert_behavioral_trigger vault secret name case

  The function was looking for 'admin_pin' (lowercase) in vault.secrets,
  but the secret is stored as 'ADMIN_PIN' (uppercase). Changed to match
  the actual vault secret name.
*/

CREATE OR REPLACE FUNCTION public.upsert_behavioral_trigger(p_pin text, p_trigger jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_stored_pin text;
BEGIN
SELECT decrypted_secret INTO v_stored_pin
FROM vault.decrypted_secrets WHERE name = 'ADMIN_PIN' LIMIT 1;
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

CREATE OR REPLACE FUNCTION public.delete_behavioral_trigger(p_pin text, p_trigger_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_stored_pin text;
BEGIN
SELECT decrypted_secret INTO v_stored_pin
FROM vault.decrypted_secrets WHERE name = 'ADMIN_PIN' LIMIT 1;
IF v_stored_pin IS NULL OR p_pin <> v_stored_pin THEN
RAISE EXCEPTION 'permission denied';
END IF;
DELETE FROM public.behavioral_triggers WHERE id = p_trigger_id;
END;
$$;
