/*
  # Fix notification trigger

  ## Problem
  The notification trigger fails because vault secrets are not configured,
  causing form submissions to fail with NULL constraint violation.

  ## Solution
  Update the trigger function to gracefully handle missing configuration
  and return NEW without attempting to send notification if config is missing.

  ## Changes
  - Modify notify_new_quote_request() to check if URL exists before sending
  - If URL is NULL, skip notification and just return NEW
  - This allows form submissions to work even without notification setup
*/

DROP TRIGGER IF EXISTS on_quote_request_created ON quote_requests;

DROP FUNCTION IF EXISTS notify_new_quote_request() CASCADE;

CREATE OR REPLACE FUNCTION notify_new_quote_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
BEGIN
  -- Try to get configuration from vault
  BEGIN
    SELECT decrypted_secret INTO supabase_url
    FROM vault.decrypted_secrets
    WHERE name = 'SUPABASE_URL'
    LIMIT 1;
    
    SELECT decrypted_secret INTO service_role_key
    FROM vault.decrypted_secrets
    WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
    LIMIT 1;
  EXCEPTION
    WHEN OTHERS THEN
      -- Vault not configured, skip notification
      RETURN NEW;
  END;
  
  -- If URL is missing, skip notification
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Send notification
  BEGIN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-quote-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'quote_id', NEW.id,
        'name', NEW.name,
        'phone', NEW.phone,
        'email', NEW.email,
        'vehicle', NEW.vehicle,
        'description', NEW.description
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Notification failed, but don't block the insert
      RAISE WARNING 'Failed to send notification: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_quote_request_created
  AFTER INSERT ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_quote_request();