/*
  # Create quote requests table

  1. New Tables
    - `quote_requests`
      - `id` (uuid, primary key) - Unique identifier for each request
      - `name` (text) - Customer's full name
      - `phone` (text) - Customer's phone number
      - `email` (text, nullable) - Customer's email address (optional)
      - `vehicle` (text) - Vehicle make and model
      - `vin` (text, nullable) - Vehicle Identification Number (optional)
      - `description` (text) - Description of the damage
      - `photo_url` (text, nullable) - URL to uploaded photo (optional)
      - `status` (text) - Request status (new, contacted, quoted, completed)
      - `created_at` (timestamptz) - Timestamp when request was created
      - `updated_at` (timestamptz) - Timestamp when request was last updated

  2. Security
    - Enable RLS on `quote_requests` table
    - Add policy for anonymous users to insert their own requests
    - Add policy for authenticated admin users to read all requests
    - Add policy for authenticated admin users to update request status

  3. Indexes
    - Add index on created_at for efficient sorting
    - Add index on status for filtering
*/

-- Create quote_requests table
CREATE TABLE IF NOT EXISTS quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  vehicle text NOT NULL,
  vin text,
  description text NOT NULL,
  photo_url text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert quote requests (for form submissions)
CREATE POLICY "Anyone can submit quote requests"
  ON quote_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Authenticated users can read all quote requests (for admin panel)
CREATE POLICY "Authenticated users can read all requests"
  ON quote_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can update quote request status
CREATE POLICY "Authenticated users can update requests"
  ON quote_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS quote_requests_created_at_idx ON quote_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS quote_requests_status_idx ON quote_requests(status);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_quote_requests_updated_at ON quote_requests;
CREATE TRIGGER update_quote_requests_updated_at
  BEFORE UPDATE ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();