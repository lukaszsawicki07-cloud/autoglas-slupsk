/*
  # Fix Security Issues

  ## Changes Made
  
  1. **Drop Unused Index**
     - Remove `quote_requests_status_idx` (not being used)
  
  2. **Fix Function Search Paths**
     - Set explicit search_path for all functions to prevent manipulation
     - Functions: update_quote_status_admin, get_quote_requests_admin, notify_new_quote_request, update_updated_at_column
  
  3. **Fix Overly Permissive RLS Policies**
     - Remove UPDATE policy for authenticated users (should only use admin RPC)
     - Keep INSERT policies for anon (intentionally public for contact/quote forms)
  
  ## Security Notes
  - INSERT policies with `true` for anon users are intentional (public forms)
  - UPDATE operations now restricted to admin RPC function only
  - All functions now have fixed search_path to prevent injection
*/

-- Drop unused index
DROP INDEX IF EXISTS quote_requests_status_idx;

-- Fix search_path for all functions
-- This prevents search path manipulation attacks

-- Fix update_quote_status_admin
DROP FUNCTION IF EXISTS update_quote_status_admin(text, uuid, text) CASCADE;
CREATE OR REPLACE FUNCTION update_quote_status_admin(admin_pin text, request_id uuid, new_status text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  correct_pin text;
BEGIN
  SELECT decrypted_secret INTO correct_pin
  FROM vault.decrypted_secrets
  WHERE name = 'ADMIN_PIN'
  LIMIT 1;

  IF admin_pin != correct_pin THEN
    RAISE EXCEPTION 'Invalid admin PIN';
  END IF;

  UPDATE quote_requests
  SET 
    status = new_status,
    updated_at = now()
  WHERE id = request_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Status updated successfully'
  );
END;
$$;

-- Fix get_quote_requests_admin
DROP FUNCTION IF EXISTS get_quote_requests_admin(text) CASCADE;
CREATE OR REPLACE FUNCTION get_quote_requests_admin(admin_pin text)
RETURNS SETOF quote_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  correct_pin text;
BEGIN
  SELECT decrypted_secret INTO correct_pin
  FROM vault.decrypted_secrets
  WHERE name = 'ADMIN_PIN'
  LIMIT 1;

  IF admin_pin != correct_pin THEN
    RAISE EXCEPTION 'Invalid admin PIN';
  END IF;

  RETURN QUERY
  SELECT * FROM quote_requests
  ORDER BY created_at DESC;
END;
$$;

-- Drop trigger before updating function
DROP TRIGGER IF EXISTS on_quote_request_created ON quote_requests;

-- Fix notify_new_quote_request
DROP FUNCTION IF EXISTS notify_new_quote_request() CASCADE;
CREATE OR REPLACE FUNCTION notify_new_quote_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1) || '/functions/v1/send-quote-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
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
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_quote_request_created
  AFTER INSERT ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_quote_request();

-- Drop trigger for update_updated_at before updating function
DROP TRIGGER IF EXISTS update_quote_requests_updated_at ON quote_requests;

-- Fix update_updated_at_column
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
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

-- Recreate trigger
CREATE TRIGGER update_quote_requests_updated_at
  BEFORE UPDATE ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Remove overly permissive UPDATE policy
-- Updates should only happen through admin RPC function
DROP POLICY IF EXISTS "Authenticated users can update requests" ON quote_requests;

-- Keep INSERT policies - they are intentionally public for contact forms
-- This is NOT a security issue - we want anonymous users to submit requests