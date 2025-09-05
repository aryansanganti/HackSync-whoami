-- =====================================================
-- DEV UNLOCK: Fix trigger + make RLS permissive (idempotent)
-- Safe to run multiple times. Use for unblocking development only.
-- Revert to strict policies before production.
-- =====================================================

-- 1) Fix the last_active trigger functions safely
DO $$
BEGIN
  -- Drop old generic function if it exists
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_user_last_active'
  ) THEN
    EXECUTE 'DROP FUNCTION IF EXISTS update_user_last_active() CASCADE';
  END IF;
END $$;

-- Drop triggers if present
DROP TRIGGER IF EXISTS update_last_active_on_issue_create ON public.issues;
DROP TRIGGER IF EXISTS update_last_active_on_comment_create ON public.issue_comments;

-- Create correct functions
CREATE OR REPLACE FUNCTION public.update_user_last_active_on_issue() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reporter_id IS NOT NULL THEN
    UPDATE public.user_profiles SET last_active = NOW() WHERE user_id = NEW.reporter_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_user_last_active_on_comment() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_profiles SET last_active = NOW() WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers pointing to the right functions
CREATE TRIGGER update_last_active_on_issue_create
  AFTER INSERT ON public.issues
  FOR EACH ROW EXECUTE PROCEDURE public.update_user_last_active_on_issue();

CREATE TRIGGER update_last_active_on_comment_create
  AFTER INSERT ON public.issue_comments
  FOR EACH ROW EXECUTE PROCEDURE public.update_user_last_active_on_comment();

-- 2) Ensure RLS is enabled and add permissive policies if missing
-- Tables to unlock
DO $$
DECLARE
  tbl TEXT;
  rec RECORD;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'issues',
    'user_profiles',
    'issue_comments',
    'community_posts',
    'votes',
    'notifications',
    'analytics_events'
  ]) LOOP
    -- Enable RLS (idempotent)
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- Helper: create policy if not exists
-- Issues: allow everything
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='issues' AND policyname='allow_all_issues'
  ) THEN
    EXECUTE 'CREATE POLICY "allow_all_issues" ON public.issues FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- User profiles: allow everything
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_profiles' AND policyname='allow_all_profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "allow_all_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Issue comments: allow everything
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='issue_comments' AND policyname='allow_all_comments'
  ) THEN
    EXECUTE 'CREATE POLICY "allow_all_comments" ON public.issue_comments FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Community posts: allow everything
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='community_posts' AND policyname='allow_all_posts'
  ) THEN
    EXECUTE 'CREATE POLICY "allow_all_posts" ON public.community_posts FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Votes: allow everything
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='votes' AND policyname='allow_all_votes'
  ) THEN
    EXECUTE 'CREATE POLICY "allow_all_votes" ON public.votes FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Notifications: allow everything (dev). Change to owner-only before prod.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='allow_all_notifications'
  ) THEN
    EXECUTE 'CREATE POLICY "allow_all_notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- Analytics events: allow everything
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analytics_events' AND policyname='allow_all_analytics'
  ) THEN
    EXECUTE 'CREATE POLICY "allow_all_analytics" ON public.analytics_events FOR ALL USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- 3) Smoke checks
SELECT 'DEV UNLOCK COMPLETE' AS status,
       (SELECT count(*) FROM public.issues) AS issues_count,
       (SELECT count(*) FROM public.user_profiles) AS profiles_count;
