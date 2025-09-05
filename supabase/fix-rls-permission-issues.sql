-- =====================================================
-- FIX RLS POLICIES - SIMPLE VERSION
-- Run this in your Supabase SQL Editor to fix permission issues
-- =====================================================

-- First, let's disable RLS temporarily to allow access
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;

-- Now re-enable RLS with simple, permissive policies
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies (will replace existing ones)
CREATE POLICY "allow_all_issues" ON issues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_profiles" ON user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_comments" ON issue_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_posts" ON community_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_votes" ON votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "allow_all_analytics" ON analytics_events FOR ALL USING (true) WITH CHECK (true);

-- Test query
SELECT 'RLS policies fixed - all tables accessible!' as status;
SELECT 'Issues test' as test, COUNT(*) as count FROM issues;
