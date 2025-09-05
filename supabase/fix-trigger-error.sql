-- =====================================================
-- FIX FOR TRIGGER ERROR
-- Run this in your Supabase SQL Editor to fix the trigger error
-- =====================================================

-- Drop the existing triggers and function
DROP TRIGGER IF EXISTS update_last_active_on_issue_create ON issues;
DROP TRIGGER IF EXISTS update_last_active_on_comment_create ON issue_comments;
DROP FUNCTION IF EXISTS update_user_last_active();

-- Create corrected functions with proper column names
CREATE OR REPLACE FUNCTION update_user_last_active_on_issue() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reporter_id IS NOT NULL THEN
    UPDATE user_profiles SET last_active = NOW() WHERE user_id = NEW.reporter_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_last_active_on_comment() RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles SET last_active = NOW() WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers with correct functions
CREATE TRIGGER update_last_active_on_issue_create
  AFTER INSERT ON issues
  FOR EACH ROW EXECUTE PROCEDURE update_user_last_active_on_issue();

CREATE TRIGGER update_last_active_on_comment_create
  AFTER INSERT ON issue_comments
  FOR EACH ROW EXECUTE PROCEDURE update_user_last_active_on_comment();

-- Verification query
SELECT 'Triggers fixed successfully!' as status;
