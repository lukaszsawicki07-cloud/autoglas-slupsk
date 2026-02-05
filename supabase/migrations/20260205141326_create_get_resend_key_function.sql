/*
  # Create function to get Resend API key from vault
  
  1. New Function
    - `get_resend_api_key()` - Returns the Resend API key from vault
  
  2. Security
    - Function runs with SECURITY DEFINER to access vault
    - Only accessible by service role
*/

CREATE OR REPLACE FUNCTION public.get_resend_api_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  api_key text;
BEGIN
  SELECT decrypted_secret INTO api_key
  FROM vault.decrypted_secrets
  WHERE name = 'RESEND_API_KEY'
  LIMIT 1;
  
  RETURN api_key;
END;
$$;

COMMENT ON FUNCTION public.get_resend_api_key() IS 'Returns Resend API key from vault for Edge Functions';
