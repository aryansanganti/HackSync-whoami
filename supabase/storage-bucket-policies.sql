-- =====================================================
-- SUPABASE STORAGE BUCKET POLICIES
-- Apply these after creating the buckets in Supabase Dashboard
-- =====================================================

-- First, create these buckets in Supabase Dashboard -> Storage:
-- 1. issue-images (public: false)
-- 2. user-avatars (public: true)
-- 3. community-images (public: false)
-- 4. issue-audio (public: false)
-- 5. issue-videos (public: false)

-- Then apply these policies in the SQL Editor:

-- =====================================================
-- ISSUE IMAGES BUCKET POLICIES
-- =====================================================

-- Anyone can view issue images
CREATE POLICY "Anyone can view issue images" ON storage.objects FOR SELECT USING (bucket_id = 'issue-images');

-- Authenticated users can upload issue images
CREATE POLICY "Authenticated users can upload issue images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'issue-images' AND auth.role() = 'authenticated'
);

-- Users can update their own uploaded images (first 24 hours)
CREATE POLICY "Users can update own issue images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'issue-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND created_at > NOW() - INTERVAL '24 hours'
);

-- Users can delete their own images (first 24 hours)
CREATE POLICY "Users can delete own issue images" ON storage.objects FOR DELETE USING (
  bucket_id = 'issue-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND created_at > NOW() - INTERVAL '24 hours'
);

-- =====================================================
-- USER AVATARS BUCKET POLICIES (Public bucket)
-- =====================================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'user-avatars');

-- Authenticated users can upload avatars
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- COMMUNITY IMAGES BUCKET POLICIES
-- =====================================================

-- Anyone can view community images
CREATE POLICY "Anyone can view community images" ON storage.objects FOR SELECT USING (bucket_id = 'community-images');

-- Authenticated users can upload community images
CREATE POLICY "Authenticated users can upload community images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'community-images' AND auth.role() = 'authenticated'
);

-- Users can update their own community images
CREATE POLICY "Users can update own community images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'community-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own community images
CREATE POLICY "Users can delete own community images" ON storage.objects FOR DELETE USING (
  bucket_id = 'community-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- ISSUE AUDIO BUCKET POLICIES
-- =====================================================

-- Anyone can view issue audio files
CREATE POLICY "Anyone can view issue audio" ON storage.objects FOR SELECT USING (bucket_id = 'issue-audio');

-- Authenticated users can upload audio
CREATE POLICY "Authenticated users can upload audio" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'issue-audio' 
  AND auth.role() = 'authenticated'
  AND (storage.extension(name) = 'mp3' OR storage.extension(name) = 'wav' OR storage.extension(name) = 'm4a')
);

-- Users can update their own audio files (first 24 hours)
CREATE POLICY "Users can update own audio" ON storage.objects FOR UPDATE USING (
  bucket_id = 'issue-audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND created_at > NOW() - INTERVAL '24 hours'
);

-- Users can delete their own audio files (first 24 hours)
CREATE POLICY "Users can delete own audio" ON storage.objects FOR DELETE USING (
  bucket_id = 'issue-audio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND created_at > NOW() - INTERVAL '24 hours'
);

-- =====================================================
-- ISSUE VIDEOS BUCKET POLICIES
-- =====================================================

-- Anyone can view issue videos
CREATE POLICY "Anyone can view issue videos" ON storage.objects FOR SELECT USING (bucket_id = 'issue-videos');

-- Authenticated users can upload videos
CREATE POLICY "Authenticated users can upload videos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'issue-videos' 
  AND auth.role() = 'authenticated'
  AND (storage.extension(name) = 'mp4' OR storage.extension(name) = 'mov' OR storage.extension(name) = 'avi')
);

-- Users can update their own videos (first 24 hours)
CREATE POLICY "Users can update own videos" ON storage.objects FOR UPDATE USING (
  bucket_id = 'issue-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND created_at > NOW() - INTERVAL '24 hours'
);

-- Users can delete their own videos (first 24 hours)
CREATE POLICY "Users can delete own videos" ON storage.objects FOR DELETE USING (
  bucket_id = 'issue-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND created_at > NOW() - INTERVAL '24 hours'
);

-- =====================================================
-- HELPER QUERIES FOR TESTING
-- =====================================================

-- Test if your buckets exist
SELECT * FROM storage.buckets;

-- Test if storage policies are applied (check RLS policies on storage.objects)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- Alternative way to check policies
SELECT * FROM pg_policies WHERE schemaname = 'storage';

-- Check bucket sizes and usage
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  COALESCE(SUM((metadata->>'size')::bigint), 0) as total_size_bytes,
  ROUND(COALESCE(SUM((metadata->>'size')::bigint), 0) / 1024.0 / 1024.0, 2) as total_size_mb
FROM storage.objects 
GROUP BY bucket_id
ORDER BY bucket_id;

-- =====================================================
-- NOTES
-- =====================================================

-- File naming convention:
-- - issue-images: {user_id}/{issue_id}/{filename}
-- - user-avatars: {user_id}/avatar.jpg
-- - community-images: {user_id}/{post_id}/{filename}
-- - issue-audio: {user_id}/{issue_id}/{filename}
-- - issue-videos: {user_id}/{issue_id}/{filename}

-- File size limits (set in bucket configuration):
-- - Images: 10MB per file
-- - Audio: 25MB per file
-- - Videos: 100MB per file
-- - Avatars: 2MB per file
