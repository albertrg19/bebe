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
  date TEXT NOT NULL,
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

-- Allow public delete access
CREATE POLICY "Allow public delete on calendar_photos"
  ON calendar_photos
  FOR DELETE
  TO anon
  USING (true);

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
-- ============================================
-- TABLE 3: love_letters
-- Stores sticky notes/love letters
-- ============================================
CREATE TABLE IF NOT EXISTS love_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  theme_color TEXT DEFAULT 'pink',
  position_x REAL,
  position_y REAL,
  rotation REAL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLE 4: bucket_list
-- Stores dreams and goals
-- ============================================
CREATE TABLE IF NOT EXISTS bucket_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ENABLE RLS FOR NEW TABLES
-- ============================================
ALTER TABLE love_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE bucket_list ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR love_letters
-- ============================================
CREATE POLICY "Allow public read on love_letters" ON love_letters FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert on love_letters" ON love_letters FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public delete on love_letters" ON love_letters FOR DELETE TO anon USING (true);

-- ============================================
-- RLS POLICIES FOR bucket_list
-- ============================================
CREATE POLICY "Allow public read on bucket_list" ON bucket_list FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert on bucket_list" ON bucket_list FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update on bucket_list" ON bucket_list FOR UPDATE TO anon USING (true);
CREATE POLICY "Allow public delete on bucket_list" ON bucket_list FOR DELETE TO anon USING (true);
