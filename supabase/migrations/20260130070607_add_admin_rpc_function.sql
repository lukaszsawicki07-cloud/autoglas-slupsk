/*
  # Add admin RPC function for quote requests

  1. New Functions
    - `get_quote_requests_admin` - RPC function to retrieve quote requests with PIN authentication
      - Requires a PIN parameter for basic security
      - Returns all quote requests ordered by creation date
      - Uses SECURITY DEFINER to bypass RLS

  2. Security
    - Function checks for a simple PIN (configurable via environment or hardcoded)
    - Runs with definer privileges to bypass RLS restrictions
*/

-- Create function to get quote requests with PIN authentication
CREATE OR REPLACE FUNCTION get_quote_requests_admin(admin_pin text)
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  email text,
  vehicle text,
  vin text,
  description text,
  photo_url text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simple PIN check (in production, use proper authentication)
  IF admin_pin != '2580' THEN
    RAISE EXCEPTION 'Invalid PIN';
  END IF;

  RETURN QUERY
  SELECT 
    qr.id,
    qr.name,
    qr.phone,
    qr.email,
    qr.vehicle,
    qr.vin,
    qr.description,
    qr.photo_url,
    qr.status,
    qr.created_at,
    qr.updated_at
  FROM quote_requests qr
  ORDER BY qr.created_at DESC;
END;
$$;

-- Create function to update quote request status with PIN authentication
CREATE OR REPLACE FUNCTION update_quote_status_admin(
  admin_pin text,
  request_id uuid,
  new_status text
)
RETURNS void
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simple PIN check
  IF admin_pin != '2580' THEN
    RAISE EXCEPTION 'Invalid PIN';
  END IF;

  -- Validate status
  IF new_status NOT IN ('new', 'contacted', 'quoted', 'completed') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  UPDATE quote_requests
  SET status = new_status,
      updated_at = now()
  WHERE id = request_id;
END;
$$;