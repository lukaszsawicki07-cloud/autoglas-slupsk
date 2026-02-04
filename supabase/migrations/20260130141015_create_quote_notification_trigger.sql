/*
  # Create automatic email notification trigger
  
  1. Overview
    - Automatically sends email notifications when new quote requests are submitted
    - Calls the send-quote-notification edge function via database trigger
    - Sends notifications to two email addresses
  
  2. Changes
    - Creates trigger function `notify_new_quote_request()` that:
      - Extracts quote request data from the new row
      - Invokes the send-quote-notification edge function
      - Handles the HTTP request asynchronously
    - Creates trigger `on_quote_request_created` that:
      - Fires after each INSERT on quote_requests table
      - Calls the notification function
  
  3. Security
    - Uses pg_net extension for secure HTTP requests
    - Runs with proper credentials and headers
    - Error handling built into the function
  
  4. Notes
    - Emails sent to: autoglasslupsk@gmail.com and lukasz.sawicki07@gmail.com
    - Uses Resend API for email delivery
    - Trigger executes asynchronously to not block the insert operation
*/

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION notify_new_quote_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  function_url text;
  service_role_key text;
BEGIN
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-quote-notification';
  service_role_key := current_setting('app.settings.supabase_service_role_key', true);
  
  SELECT net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'name', NEW.name,
      'phone', NEW.phone,
      'email', NEW.email,
      'vehicle', NEW.vehicle,
      'vin', NEW.vin,
      'description', NEW.description
    )
  ) INTO request_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_quote_request_created ON quote_requests;

CREATE TRIGGER on_quote_request_created
  AFTER INSERT ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_quote_request();