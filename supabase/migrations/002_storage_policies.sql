-- =====================================================
-- CIVIC AI - STORAGE POLICIES MIGRATION
-- =====================================================
-- Migration: 002_storage_policies
-- Description: Set up storage buckets and policies
-- Created: 2025-01-05

-- =====================================================
-- STORAGE BUCKETS CONFIGURATION
-- =====================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('issue-images', 'issue-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('user-avatars', 'user-avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('community-images', 'community-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('issue-audio', 'issue-audio', true, 104857600, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a']),
  ('issue-videos', 'issue-videos', true, 524288000, ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo'])
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Issue images bucket policies
CREATE POLICY "Anyone can view issue images" ON storage.objects FOR SELECT USING (bucket_id = 'issue-images');
CREATE POLICY "Authenticated users can upload issue images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'issue-images' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update their issue images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'issue-images' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can delete their issue images" ON storage.objects FOR DELETE USING (
  bucket_id = 'issue-images' AND auth.role() = 'authenticated'
);

-- User avatars bucket policies  
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'user-avatars');
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update avatars" ON storage.objects FOR UPDATE USING (
  bucket_id = 'user-avatars' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can delete avatars" ON storage.objects FOR DELETE USING (
  bucket_id = 'user-avatars' AND auth.role() = 'authenticated'
);

-- Community images policies
CREATE POLICY "Anyone can view community images" ON storage.objects FOR SELECT USING (bucket_id = 'community-images');
CREATE POLICY "Authenticated users can upload community images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'community-images' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update community images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'community-images' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can delete community images" ON storage.objects FOR DELETE USING (
  bucket_id = 'community-images' AND auth.role() = 'authenticated'
);

-- Audio files policies
CREATE POLICY "Anyone can view audio files" ON storage.objects FOR SELECT USING (bucket_id = 'issue-audio');
CREATE POLICY "Authenticated users can upload audio files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'issue-audio' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update audio files" ON storage.objects FOR UPDATE USING (
  bucket_id = 'issue-audio' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can delete audio files" ON storage.objects FOR DELETE USING (
  bucket_id = 'issue-audio' AND auth.role() = 'authenticated'
);

-- Video files policies
CREATE POLICY "Anyone can view video files" ON storage.objects FOR SELECT USING (bucket_id = 'issue-videos');
CREATE POLICY "Authenticated users can upload video files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'issue-videos' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update video files" ON storage.objects FOR UPDATE USING (
  bucket_id = 'issue-videos' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can delete video files" ON storage.objects FOR DELETE USING (
  bucket_id = 'issue-videos' AND auth.role() = 'authenticated'
);
