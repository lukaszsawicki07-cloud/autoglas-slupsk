/*
  # Fix trigger to use correct pg_net namespace
  
  ## Problem
  The trigger uses `net.http_post` but pg_net extension requires `pg_net.http_post`
  
  ## Solution
  Update the trigger function to use the correct namespace for pg_net functions
  
  ## Changes
  - Change net.http_post to pg_net.http_post in trigger function
  - Add VIN field to notification payload (was missing)
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
  request_id bigint;
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
      RAISE WARNING 'Vault not configured: %', SQLERRM;
      RETURN NEW;
  END;
  
  -- If URL is missing, skip notification
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RAISE WARNING 'Missing configuration: URL=%, KEY=%', 
      (supabase_url IS NOT NULL), (service_role_key IS NOT NULL);
    RETURN NEW;
  END IF;
  
  -- Send notification using pg_net
  BEGIN
    SELECT INTO request_id pg_net.http_post(
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
        'vin', NEW.vin,
        'description', NEW.description
      )
    );
    
    RAISE NOTICE 'Notification request queued with ID: %', request_id;
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