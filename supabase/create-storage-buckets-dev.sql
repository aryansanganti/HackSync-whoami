-- =====================================================
-- Create required Storage buckets + permissive dev policies
-- Safe to run multiple times (skips if exists)
-- =====================================================

-- Helper to create bucket if missing (ignore errors)
DO $$ BEGIN
  PERFORM 1 FROM storage.buckets WHERE id = 'issue-images';
  IF NOT FOUND THEN
    PERFORM storage.create_bucket(id => 'issue-images', name => 'issue-images', public => true);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  PERFORM 1 FROM storage.buckets WHERE id = 'user-avatars';
  IF NOT FOUND THEN
    PERFORM storage.create_bucket(id => 'user-avatars', name => 'user-avatars', public => true);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  PERFORM 1 FROM storage.buckets WHERE id = 'community-images';
  IF NOT FOUND THEN
    PERFORM storage.create_bucket(id => 'community-images', name => 'community-images', public => true);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  PERFORM 1 FROM storage.buckets WHERE id = 'issue-audio';
  IF NOT FOUND THEN
    PERFORM storage.create_bucket(id => 'issue-audio', name => 'issue-audio', public => false);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  PERFORM 1 FROM storage.buckets WHERE id = 'issue-videos';
  IF NOT FOUND THEN
    PERFORM storage.create_bucket(id => 'issue-videos', name => 'issue-videos', public => false);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- =====================================================
-- Permissive policies for development on storage.objects
-- Note: bucket_id must match; allows anon & authenticated for ALL
-- =====================================================

-- Enable RLS (idempotent)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Issue images
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='dev_allow_all_issue_images'
  ) THEN
    EXECUTE 'CREATE POLICY dev_allow_all_issue_images ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = ''issue-images'') WITH CHECK (bucket_id = ''issue-images'')';
  END IF;
END $$;

-- User avatars
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='dev_allow_all_user_avatars'
  ) THEN
    EXECUTE 'CREATE POLICY dev_allow_all_user_avatars ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = ''user-avatars'') WITH CHECK (bucket_id = ''user-avatars'')';
  END IF;
END $$;

-- Community images
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='dev_allow_all_community_images'
  ) THEN
    EXECUTE 'CREATE POLICY dev_allow_all_community_images ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = ''community-images'') WITH CHECK (bucket_id = ''community-images'')';
  END IF;
END $$;

-- Issue audio
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='dev_allow_all_issue_audio'
  ) THEN
    EXECUTE 'CREATE POLICY dev_allow_all_issue_audio ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = ''issue-audio'') WITH CHECK (bucket_id = ''issue-audio'')';
  END IF;
END $$;

-- Issue videos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='dev_allow_all_issue_videos'
  ) THEN
    EXECUTE 'CREATE POLICY dev_allow_all_issue_videos ON storage.objects FOR ALL TO anon, authenticated USING (bucket_id = ''issue-videos'') WITH CHECK (bucket_id = ''issue-videos'')';
  END IF;
END $$;

-- Smoke check
SELECT 'STORAGE DEV SETUP COMPLETE' AS status,
       (SELECT COUNT(*) FROM storage.buckets WHERE id IN ('issue-images','user-avatars','community-images','issue-audio','issue-videos')) AS buckets_created;
