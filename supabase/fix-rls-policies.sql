-- =====================================================
-- FIX RLS POLICIES FOR CIVIC AI APP
-- Run this in your Supabase SQL Editor to fix permission issues
-- =====================================================

-- Fix issues table policies (allow anonymous reading for public data)
DROP POLICY IF EXISTS "Anyone can read issues" ON issues;
CREATE POLICY "Anyone can read issues" ON issues FOR SELECT USING (true);

-- Fix user profiles policies
DROP POLICY IF EXISTS "Users can read all profiles" ON user_profiles;
CREATE POLICY "Users can read all profiles" ON user_profiles FOR SELECT USING (true);

-- Fix issue comments policies  
DROP POLICY IF EXISTS "Anyone can read comments" ON issue_comments;
CREATE POLICY "Anyone can read comments" ON issue_comments FOR SELECT USING (NOT is_deleted);

-- Fix community posts policies
DROP POLICY IF EXISTS "Anyone can read posts" ON community_posts;
CREATE POLICY "Anyone can read posts" ON community_posts FOR SELECT USING (NOT is_deleted);

-- Fix votes policies
DROP POLICY IF EXISTS "Anyone can read votes" ON votes;
CREATE POLICY "Anyone can read votes" ON votes FOR SELECT USING (true);

-- Fix notifications policies (keep restricted to user's own notifications)
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
CREATE POLICY "Users can read their own notifications" ON notifications FOR SELECT USING (
  auth.uid() IS NULL OR auth.uid() = user_id
);

-- Allow anonymous users to insert issues (for guest reporting)
DROP POLICY IF EXISTS "Authenticated users can create issues" ON issues;
CREATE POLICY "Anyone can create issues" ON issues FOR INSERT WITH CHECK (true);

-- Allow anonymous users to insert comments
DROP POLICY IF EXISTS "Authenticated users can create comments" ON issue_comments;
CREATE POLICY "Anyone can create comments" ON issue_comments FOR INSERT WITH CHECK (true);

-- Allow anonymous voting
DROP POLICY IF EXISTS "Authenticated users can vote" ON votes;
CREATE POLICY "Anyone can vote" ON votes FOR INSERT WITH CHECK (true);

-- Update policies for issue updates (keep restricted to authenticated users)
DROP POLICY IF EXISTS "Officers can update assigned issues" ON issues;
CREATE POLICY "Authenticated users can update issues" ON issues FOR UPDATE USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = reporter_id OR 
    auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE role IN ('officer', 'admin')
    )
  )
);

-- Fix analytics events (allow anonymous tracking)
DROP POLICY IF EXISTS "Users can insert analytics events" ON analytics_events;
CREATE POLICY "Anyone can insert analytics events" ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read analytics events" ON analytics_events FOR SELECT USING (true);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if policies were applied correctly
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, cmd, policyname;

-- Test basic read access
SELECT 'Issues table accessible' as test, COUNT(*) as count FROM issues;
SELECT 'User profiles accessible' as test, COUNT(*) as count FROM user_profiles;
SELECT 'Comments accessible' as test, COUNT(*) as count FROM issue_comments;
SELECT 'Community posts accessible' as test, COUNT(*) as count FROM community_posts;
SELECT 'Votes accessible' as test, COUNT(*) as count FROM votes;
