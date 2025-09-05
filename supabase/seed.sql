-- =====================================================
-- CIVIC AI - SEED DATA
-- =====================================================
-- File: seed.sql
-- Description: Initial seed data for development and testing
-- Created: 2025-01-05

-- =====================================================
-- NOTIFICATION TEMPLATES (Multilingual)
-- =====================================================

-- English templates
INSERT INTO notification_templates (type, language, title_template, body_template) VALUES
('issue_update', 'en', 'Issue Update', 'Your issue "{{issue_title}}" has been updated to {{status}}'),
('issue_resolved', 'en', 'Issue Resolved', 'Your issue "{{issue_title}}" has been resolved!'),
('comment_reply', 'en', 'New Reply', '{{user_name}} replied to your comment'),
('upvote', 'en', 'New Upvote', 'Someone upvoted your {{target_type}}'),
('mention', 'en', 'You were mentioned', '{{user_name}} mentioned you in a {{target_type}}'),
('assignment', 'en', 'Issue Assigned', 'Issue "{{issue_title}}" has been assigned to you'),
('community_post', 'en', 'New Community Post', '{{user_name}} posted in the community'),
('general', 'en', 'Notification', '{{message}}');

-- Hindi templates
INSERT INTO notification_templates (type, language, title_template, body_template) VALUES
('issue_update', 'hi', 'समस्या अपडेट', 'आपकी समस्या "{{issue_title}}" को {{status}} में अपडेट किया गया है'),
('issue_resolved', 'hi', 'समस्या हल हो गई', 'आपकी समस्या "{{issue_title}}" हल हो गई है!'),
('comment_reply', 'hi', 'नया उत्तर', '{{user_name}} ने आपकी टिप्पणी का उत्तर दिया'),
('upvote', 'hi', 'नया अपवोट', 'किसी ने आपके {{target_type}} को अपवोट किया'),
('mention', 'hi', 'आपका उल्लेख किया गया', '{{user_name}} ने {{target_type}} में आपका उल्लेख किया'),
('assignment', 'hi', 'समस्या सौंपी गई', 'समस्या "{{issue_title}}" आपको सौंपी गई है'),
('community_post', 'hi', 'नई कम्युनिटी पोस्ट', '{{user_name}} ने कम्युनिटी में पोस्ट किया'),
('general', 'hi', 'सूचना', '{{message}}');

-- Bengali templates
INSERT INTO notification_templates (type, language, title_template, body_template) VALUES
('issue_update', 'bn', 'সমস্যার আপডেট', 'আপনার সমস্যা "{{issue_title}}" {{status}} এ আপডেট হয়েছে'),
('issue_resolved', 'bn', 'সমস্যা সমাধান', 'আপনার সমস্যা "{{issue_title}}" সমাধান হয়েছে!'),
('comment_reply', 'bn', 'নতুন জবাব', '{{user_name}} আপনার মন্তব্যের জবাব দিয়েছেন'),
('upvote', 'bn', 'নতুন আপভোট', 'কেউ আপনার {{target_type}} আপভোট দিয়েছে'),
('mention', 'bn', 'আপনাকে উল্লেখ করা হয়েছে', '{{user_name}} {{target_type}} এ আপনাকে উল্লেখ করেছেন'),
('assignment', 'bn', 'সমস্যা বরাদ্দ', 'সমস্যা "{{issue_title}}" আপনাকে বরাদ্দ করা হয়েছে'),
('community_post', 'bn', 'নতুন কমিউনিটি পোস্ট', '{{user_name}} কমিউনিটিতে পোস্ট করেছেন'),
('general', 'bn', 'বিজ্ঞপ্তি', '{{message}}');

-- =====================================================
-- SAMPLE DATA FOR DEVELOPMENT (Optional)
-- =====================================================

-- Sample hashtags
INSERT INTO hashtags (name, usage_count, is_trending) VALUES
('CivicIssues', 25, true),
('RoadSafety', 15, true),
('CleanCity', 12, false),
('WaterProblem', 8, false),
('StreetLights', 6, false),
('Garbage', 10, false),
('Traffic', 18, true);

-- =====================================================
-- SAMPLE ISSUES FOR DEMO (Uncomment if needed)
-- =====================================================

/*
-- Note: Uncomment this section only for demo/development purposes
-- These create sample issues with Mumbai coordinates

INSERT INTO issues (
  title, 
  description, 
  category, 
  priority, 
  status, 
  latitude, 
  longitude, 
  location,
  address, 
  is_anonymous,
  image_urls,
  tags
) VALUES
(
  'Pothole on Main Road',
  'Large pothole causing traffic issues and vehicle damage',
  'Roads',
  'High',
  'Pending',
  19.0760,
  72.8777,
  ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326),
  'Andheri West, Mumbai, Maharashtra 400058',
  true,
  ARRAY['https://example.com/pothole1.jpg'],
  ARRAY['road', 'pothole', 'traffic']
),
(
  'Street Light Not Working',
  'Street light has been out for 3 days, causing safety concerns',
  'Electricity',
  'Medium',
  'Pending',
  19.0826,
  72.8811,
  ST_SetSRID(ST_MakePoint(72.8811, 19.0826), 4326),
  'Juhu Beach Road, Mumbai, Maharashtra 400049',
  true,
  ARRAY['https://example.com/streetlight1.jpg'],
  ARRAY['streetlight', 'safety', 'electricity']
),
(
  'Overflowing Garbage Bin',
  'Garbage bin has been overflowing for days, creating unsanitary conditions',
  'Sanitation',
  'Medium',
  'In Progress',
  19.0544,
  72.8342,
  ST_SetSRID(ST_MakePoint(72.8342, 19.0544), 4326),
  'Marine Drive, Mumbai, Maharashtra 400020',
  false,
  ARRAY['https://example.com/garbage1.jpg'],
  ARRAY['garbage', 'sanitation', 'hygiene']
);
*/

-- =====================================================
-- PERFORMANCE OPTIMIZATIONS
-- =====================================================

-- Create materialized views for statistics (will be refreshed by scheduled job)
CREATE MATERIALIZED VIEW IF NOT EXISTS issue_stats AS
SELECT 
  DATE(created_at) as date,
  category,
  status,
  priority,
  COUNT(*) as count,
  AVG(CASE WHEN resolved_at IS NOT NULL THEN 
    EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 
  END) as avg_resolution_hours
FROM issues 
GROUP BY DATE(created_at), category, status, priority;

-- User engagement statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS user_engagement_stats AS
SELECT 
  user_id,
  COUNT(DISTINCT i.id) as issues_reported,
  COUNT(DISTINCT c.id) as comments_made,
  COUNT(DISTINCT p.id) as posts_made,
  COUNT(DISTINCT v.id) as votes_cast,
  MAX(GREATEST(i.created_at, c.created_at, p.created_at, v.created_at)) as last_engagement
FROM user_profiles up
LEFT JOIN issues i ON up.user_id = i.reporter_id
LEFT JOIN issue_comments c ON up.user_id = c.user_id
LEFT JOIN community_posts p ON up.user_id = p.user_id  
LEFT JOIN votes v ON up.user_id = v.user_id
GROUP BY user_id;

-- Create indexes for better performance on common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_issues_active ON issues(created_at DESC) WHERE status != 'Resolved';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_issues_unassigned ON issues(created_at DESC) WHERE assigned_to IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread ON notifications(created_at DESC) WHERE is_read = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_issues_status_category ON issues(status, category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_issues_reporter_status ON issues(reporter_id, status) WHERE reporter_id IS NOT NULL;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to clean up old notifications (call this periodically)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '30 days' 
  AND is_read = true;
  
  DELETE FROM notifications 
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update trending hashtags
CREATE OR REPLACE FUNCTION update_trending_hashtags()
RETURNS void AS $$
BEGIN
  -- Reset all hashtags to not trending
  UPDATE hashtags SET is_trending = false;
  
  -- Mark top 10 hashtags from last 7 days as trending
  WITH recent_hashtag_usage AS (
    SELECT 
      h.id,
      COUNT(ph.id) as recent_usage
    FROM hashtags h
    JOIN post_hashtags ph ON h.id = ph.hashtag_id
    JOIN community_posts cp ON ph.post_id = cp.id
    WHERE cp.created_at > NOW() - INTERVAL '7 days'
    GROUP BY h.id
    ORDER BY recent_usage DESC
    LIMIT 10
  )
  UPDATE hashtags 
  SET is_trending = true 
  WHERE id IN (SELECT id FROM recent_hashtag_usage);
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_stats_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY issue_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_engagement_stats;
END;
$$ LANGUAGE plpgsql;
