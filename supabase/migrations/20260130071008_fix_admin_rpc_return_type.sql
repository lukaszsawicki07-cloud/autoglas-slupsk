/*
  # Fix admin RPC function return type

  1. Changes
    - Modify `get_quote_requests_admin` to return SETOF quote_requests instead of TABLE
    - This ensures proper JSON serialization for the Supabase JS client
*/

DROP FUNCTION IF EXISTS get_quote_requests_admin(text);

CREATE OR REPLACE FUNCTION get_quote_requests_admin(admin_pin text)
RETURNS SETOF quote_requests
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  IF admin_pin != '2580' THEN
    RAISE EXCEPTION 'Invalid PIN';
  END IF;

  RETURN QUERY
  SELECT * FROM quote_requests
  ORDER BY created_at DESC;
END;
$$;