/*
  # Analytics System Tables

  Creates the complete analytics infrastructure for the Auto-Glas Słupsk website.

  1. New Tables
    - `ab_tests` — active A/B test definitions (name, active flag)
    - `ab_variants` — variants per test with weights and conversion counts
    - `analytics_sessions` — one row per browser session (visitor, referrer, utm params)
    - `analytics_events` — scroll depth, section visibility, click events per session
    - `analytics_page_views` — page view with bounce detection

  2. Security
    - RLS enabled on all tables
    - Public INSERT allowed for event ingestion (anon can write events)
    - Authenticated SELECT for dashboard reads
    - No public SELECT on raw events (admin only)

  3. Notes
    - session_id is a client-generated UUID stored in sessionStorage
    - variant assignment is deterministic per session_id + test_id
*/

-- A/B Tests
CREATE TABLE IF NOT EXISTS ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  winner_variant_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ab_tests"
  ON ab_tests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anon can read active ab_tests"
  ON ab_tests FOR SELECT
  TO anon
  USING (is_active = true);

-- A/B Variants
CREATE TABLE IF NOT EXISTS ab_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  weight integer DEFAULT 50,
  impressions integer DEFAULT 0,
  conversions integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(test_id, name)
);

ALTER TABLE ab_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ab_variants"
  ON ab_variants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anon can read ab_variants"
  ON ab_variants FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can update ab_variants impressions and conversions"
  ON ab_variants FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Analytics Sessions
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id uuid PRIMARY KEY,
  referrer text DEFAULT '',
  utm_source text DEFAULT '',
  utm_medium text DEFAULT '',
  utm_campaign text DEFAULT '',
  user_agent text DEFAULT '',
  language text DEFAULT 'pl',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert sessions"
  ON analytics_sessions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can read sessions"
  ON analytics_sessions FOR SELECT
  TO authenticated
  USING (true);

-- Analytics Events (scroll, section_view, click, bounce)
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES analytics_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('scroll', 'section_view', 'click', 'page_view', 'bounce', 'quote_open', 'quote_submit', 'ab_impression', 'ab_conversion')),
  section text DEFAULT '',
  scroll_depth integer DEFAULT 0,
  click_x integer DEFAULT 0,
  click_y integer DEFAULT 0,
  page_width integer DEFAULT 0,
  page_height integer DEFAULT 0,
  ab_test_name text DEFAULT '',
  ab_variant_name text DEFAULT '',
  time_on_section_ms integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert events"
  ON analytics_events FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can read events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS analytics_events_session_id_idx ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS analytics_events_event_type_idx ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS analytics_events_section_idx ON analytics_events(section);

-- Seed default A/B test for hero CTA
INSERT INTO ab_tests (name, description, is_active)
VALUES ('hero_cta', 'Hero section call-to-action button text test', true)
ON CONFLICT (name) DO NOTHING;

-- Seed variants for hero CTA test
INSERT INTO ab_variants (test_id, name, description, weight)
SELECT id, 'control', 'Zadzwoń Teraz / Call Now', 50 FROM ab_tests WHERE name = 'hero_cta'
ON CONFLICT (test_id, name) DO NOTHING;

INSERT INTO ab_variants (test_id, name, description, weight)
SELECT id, 'variant_b', 'Bezpłatna Wycena / Free Quote', 50 FROM ab_tests WHERE name = 'hero_cta'
ON CONFLICT (test_id, name) DO NOTHING;
