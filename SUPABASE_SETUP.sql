-- ============================================
-- SUPABASE SETUP SCRIPT
-- Run this in the Supabase SQL Editor
-- ============================================

-- ============================================
-- TABLE 1: site_content
-- Stores all editable text content on the site
-- ============================================
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ============================================
-- TABLE 2: calendar_photos
-- Stores photos linked to specific dates
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT NOT NULL UNIQUE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_photos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR site_content
-- ============================================

-- Allow public read access
CREATE POLICY "Allow public read on site_content"
  ON site_content
  FOR SELECT
  TO anon
  USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert on site_content"
  ON site_content
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow public update access
CREATE POLICY "Allow public update on site_content"
  ON site_content
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- RLS POLICIES FOR calendar_photos
-- ============================================

-- Allow public read access
CREATE POLICY "Allow public read on calendar_photos"
  ON calendar_photos
  FOR SELECT
  TO anon
  USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert on calendar_photos"
  ON calendar_photos
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow public update access
CREATE POLICY "Allow public update on calendar_photos"
  ON calendar_photos
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- STORAGE: Create the 'memories' bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICY: Allow public uploads
-- ============================================
CREATE POLICY "Allow public uploads to memories"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'memories');

-- Allow public read from memories bucket
CREATE POLICY "Allow public read from memories"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'memories');

-- Allow public update in memories bucket
CREATE POLICY "Allow public update in memories"
  ON storage.objects
  FOR UPDATE
  TO anon
  USING (bucket_id = 'memories')
  WITH CHECK (bucket_id = 'memories');

-- ============================================
-- SEED DATA (Optional defaults)
-- ============================================
INSERT INTO site_content (key, value) VALUES
  ('name1', 'Albert'),
  ('name2', 'Babe'),
  ('tagline', 'Two hearts, one story 💕'),
  ('hisPov', 'From the moment I saw her, I knew my life was about to change forever. Her smile lit up the room and my heart has been racing ever since.'),
  ('herPov', 'He walked in and everything just clicked. Like the universe finally made sense. Every day with him feels like a beautiful dream I never want to wake up from.'),
  ('song1Title', 'Perfect'),
  ('song1Artist', 'Ed Sheeran'),
  ('song2Title', 'All of Me'),
  ('song2Artist', 'John Legend'),
  ('song3Title', 'Thinking Out Loud'),
  ('song3Artist', 'Ed Sheeran'),
  ('games', '["Valorant","Minecraft","Genshin Impact","League of Legends","Mobile Legends"]'),
  ('startDate', '2025-05-23')
ON CONFLICT (key) DO NOTHING;
