-- =====================================================
-- CIVIC AI - INITIAL DATABASE MIGRATION
-- =====================================================
-- Migration: 001_initial_schema
-- Description: Create all tables, functions, and policies for Civic AI app
-- Created: 2025-01-05

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- ENUMS AND TYPES
-- =====================================================

-- User roles
CREATE TYPE user_role AS ENUM ('citizen', 'officer', 'volunteer', 'admin');

-- Issue categories (matches TypeScript interface)
CREATE TYPE issue_category AS ENUM (
  'Roads',
  'Sanitation', 
  'Electricity',
  'Water Supply',
  'Public Safety',
  'Others'
);

-- Issue status (matches TypeScript interface)
CREATE TYPE issue_status AS ENUM ('Pending', 'In Progress', 'Resolved');

-- Issue priority
CREATE TYPE issue_priority AS ENUM ('Low', 'Medium', 'High');

-- Vote types
CREATE TYPE vote_type AS ENUM ('upvote', 'downvote');

-- Target types for voting/comments
CREATE TYPE target_type AS ENUM ('issue', 'comment', 'post');

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'issue_update',
  'issue_resolved', 
  'comment_reply',
  'upvote',
  'mention',
  'assignment',
  'community_post',
  'general'
);

-- =====================================================
-- USER MANAGEMENT TABLES
-- =====================================================

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role user_role DEFAULT 'citizen',
  
  -- Location data
  location GEOGRAPHY(POINT, 4326), -- PostGIS point for efficient geospatial queries
  address TEXT,
  assigned_area TEXT, -- For officers
  
  -- Preferences
  notification_preferences JSONB DEFAULT '{
    "issue_updates": true,
    "issue_resolved": true,
    "comment_replies": true,
    "upvotes": true,
    "community_posts": true,
    "general": true
  }',
  language_preference TEXT DEFAULT 'en',
  theme_preference TEXT DEFAULT 'light',
  
  -- Push notifications
  push_token TEXT,
  push_token_updated_at TIMESTAMPTZ,
  
  -- Activity tracking
  last_active TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id),
  UNIQUE(email)
);

-- User sessions for tracking active users
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  device_info JSONB,
  ip_address INET,
  location GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- User follows (social features)
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

-- =====================================================
-- CIVIC ISSUES TABLES
-- =====================================================

-- Main issues table
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reporter information
  reporter_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT false,
  
  -- Issue details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category issue_category NOT NULL,
  priority issue_priority DEFAULT 'Medium',
  status issue_status DEFAULT 'Pending',
  
  -- Location data
  location GEOGRAPHY(POINT, 4326) NOT NULL, -- PostGIS point
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  
  -- Media and attachments
  image_urls TEXT[] DEFAULT '{}',
  audio_url TEXT,
  video_urls TEXT[] DEFAULT '{}',
  
  -- Assignment and tracking
  assigned_to UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  assigned_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  
  -- AI Analysis data
  ai_confidence REAL,
  ai_analysis JSONB, -- Store AI analysis results
  ai_category_override issue_category, -- If AI category was manually overridden
  
  -- Engagement metrics
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Workflow tracking
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  verification_required BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  
  -- Tags and metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_coordinates CHECK (
    latitude >= -90 AND latitude <= 90 AND
    longitude >= -180 AND longitude <= 180
  ),
  CONSTRAINT valid_ai_confidence CHECK (ai_confidence >= 0 AND ai_confidence <= 100)
);

-- Issue history for tracking changes
CREATE TABLE issue_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issue attachments (for additional files)
CREATE TABLE issue_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMMUNITY AND ENGAGEMENT TABLES
-- =====================================================

-- Comments on issues
CREATE TABLE issue_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES issue_comments(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  is_official BOOLEAN DEFAULT false, -- If comment is from an officer
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  
  -- Engagement
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  edited_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community posts (general discussion)
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  parent_post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES issues(id) ON DELETE SET NULL, -- If post is related to an issue
  
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  
  -- Moderation
  is_deleted BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  
  -- Engagement
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  mentions TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voting system (unified for issues, comments, posts)
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  target_type target_type NOT NULL,
  target_id UUID NOT NULL,
  vote_type vote_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, target_type, target_id)
);

-- =====================================================
-- NOTIFICATION SYSTEM
-- =====================================================

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Related entities
  issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES issue_comments(id) ON DELETE SET NULL,
  post_id UUID REFERENCES community_posts(id) ON DELETE SET NULL,
  related_user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  
  -- Notification data
  data JSONB DEFAULT '{}',
  image_url TEXT,
  action_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  
  -- Delivery tracking
  push_notification_id TEXT,
  delivery_status TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Notification templates
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type notification_type NOT NULL,
  language TEXT DEFAULT 'en',
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(type, language)
);

-- =====================================================
-- HASHTAGS AND MENTIONS
-- =====================================================

-- Hashtags table
CREATE TABLE hashtags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 1,
  is_trending BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post hashtags junction table
CREATE TABLE post_hashtags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(post_id, hashtag_id)
);

-- Mentions table
CREATE TABLE mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentioned_user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES issue_comments(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  mentioned_by UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure at least one target is specified
  CONSTRAINT mention_target_check CHECK (
    (issue_id IS NOT NULL)::INTEGER + 
    (comment_id IS NOT NULL)::INTEGER + 
    (post_id IS NOT NULL)::INTEGER = 1
  )
);

-- =====================================================
-- ANALYTICS AND REPORTING
-- =====================================================

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
  
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  
  -- Context
  issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  
  -- Event data
  properties JSONB DEFAULT '{}',
  
  -- Location and device info
  location GEOGRAPHY(POINT, 4326),
  device_info JSONB,
  ip_address INET,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_location ON user_profiles USING GIST(location);

-- Issues indexes
CREATE INDEX idx_issues_reporter_id ON issues(reporter_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_category ON issues(category);
CREATE INDEX idx_issues_priority ON issues(priority);
CREATE INDEX idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX idx_issues_location ON issues USING GIST(location);
CREATE INDEX idx_issues_assigned_to ON issues(assigned_to);
CREATE INDEX idx_issues_geolocation ON issues(latitude, longitude);

-- Comments indexes
CREATE INDEX idx_issue_comments_issue_id ON issue_comments(issue_id);
CREATE INDEX idx_issue_comments_user_id ON issue_comments(user_id);
CREATE INDEX idx_issue_comments_parent_comment_id ON issue_comments(parent_comment_id);
CREATE INDEX idx_issue_comments_created_at ON issue_comments(created_at DESC);

-- Community posts indexes
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_issue_id ON community_posts(issue_id);
CREATE INDEX idx_community_posts_parent_post_id ON community_posts(parent_post_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);

-- Votes indexes
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_target_type_target_id ON votes(target_type, target_id);
CREATE INDEX idx_votes_target_id ON votes(target_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Analytics indexes
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_issue_comments_updated_at BEFORE UPDATE ON issue_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hashtags_updated_at BEFORE UPDATE ON hashtags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update upvotes/downvotes on target table
    IF NEW.target_type = 'issue' THEN
      IF NEW.vote_type = 'upvote' THEN
        UPDATE issues SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
      ELSE
        UPDATE issues SET downvotes = downvotes + 1 WHERE id = NEW.target_id;
      END IF;
    ELSIF NEW.target_type = 'comment' THEN
      IF NEW.vote_type = 'upvote' THEN
        UPDATE issue_comments SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
      ELSE
        UPDATE issue_comments SET downvotes = downvotes + 1 WHERE id = NEW.target_id;
      END IF;
    ELSIF NEW.target_type = 'post' THEN
      IF NEW.vote_type = 'upvote' THEN
        UPDATE community_posts SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
      ELSE
        UPDATE community_posts SET downvotes = downvotes + 1 WHERE id = NEW.target_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle vote type changes
    IF OLD.vote_type != NEW.vote_type THEN
      -- Remove old vote
      IF OLD.target_type = 'issue' THEN
        IF OLD.vote_type = 'upvote' THEN
          UPDATE issues SET upvotes = upvotes - 1 WHERE id = OLD.target_id;
        ELSE
          UPDATE issues SET downvotes = downvotes - 1 WHERE id = OLD.target_id;
        END IF;
      ELSIF OLD.target_type = 'comment' THEN
        IF OLD.vote_type = 'upvote' THEN
          UPDATE issue_comments SET upvotes = upvotes - 1 WHERE id = OLD.target_id;
        ELSE
          UPDATE issue_comments SET downvotes = downvotes - 1 WHERE id = OLD.target_id;
        END IF;
      ELSIF OLD.target_type = 'post' THEN
        IF OLD.vote_type = 'upvote' THEN
          UPDATE community_posts SET upvotes = upvotes - 1 WHERE id = OLD.target_id;
        ELSE
          UPDATE community_posts SET downvotes = downvotes - 1 WHERE id = OLD.target_id;
        END IF;
      END IF;
      
      -- Add new vote
      IF NEW.target_type = 'issue' THEN
        IF NEW.vote_type = 'upvote' THEN
          UPDATE issues SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
        ELSE
          UPDATE issues SET downvotes = downvotes + 1 WHERE id = NEW.target_id;
        END IF;
      ELSIF NEW.target_type = 'comment' THEN
        IF NEW.vote_type = 'upvote' THEN
          UPDATE issue_comments SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
        ELSE
          UPDATE issue_comments SET downvotes = downvotes + 1 WHERE id = NEW.target_id;
        END IF;
      ELSIF NEW.target_type = 'post' THEN
        IF NEW.vote_type = 'upvote' THEN
          UPDATE community_posts SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
        ELSE
          UPDATE community_posts SET downvotes = downvotes + 1 WHERE id = NEW.target_id;
        END IF;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove vote counts
    IF OLD.target_type = 'issue' THEN
      IF OLD.vote_type = 'upvote' THEN
        UPDATE issues SET upvotes = upvotes - 1 WHERE id = OLD.target_id;
      ELSE
        UPDATE issues SET downvotes = downvotes - 1 WHERE id = OLD.target_id;
      END IF;
    ELSIF OLD.target_type = 'comment' THEN
      IF OLD.vote_type = 'upvote' THEN
        UPDATE issue_comments SET upvotes = upvotes - 1 WHERE id = OLD.target_id;
      ELSE
        UPDATE issue_comments SET downvotes = downvotes - 1 WHERE id = OLD.target_id;
      END IF;
    ELSIF OLD.target_type = 'post' THEN
      IF OLD.vote_type = 'upvote' THEN
        UPDATE community_posts SET upvotes = upvotes - 1 WHERE id = OLD.target_id;
      ELSE
        UPDATE community_posts SET downvotes = downvotes - 1 WHERE id = OLD.target_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply vote count trigger
CREATE TRIGGER update_vote_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_counts();

-- Function to track issue history
CREATE OR REPLACE FUNCTION track_issue_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Track status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO issue_history (issue_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'status', OLD.status::text, NEW.status::text, NEW.assigned_to);
    END IF;
    
    -- Track assignment changes
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      INSERT INTO issue_history (issue_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'assigned_to', OLD.assigned_to::text, NEW.assigned_to::text, NEW.assigned_to);
    END IF;
    
    -- Track priority changes
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      INSERT INTO issue_history (issue_id, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'priority', OLD.priority::text, NEW.priority::text, NEW.assigned_to);
    END IF;
    
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply issue history trigger
CREATE TRIGGER track_issue_changes_trigger
  AFTER UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION track_issue_changes();

-- Function to update user activity
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_profiles SET last_active = NOW() WHERE user_id = NEW.user_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply activity tracking triggers
CREATE TRIGGER update_user_activity_issues
  AFTER INSERT ON issues
  FOR EACH ROW EXECUTE FUNCTION update_user_activity();

CREATE TRIGGER update_user_activity_comments
  AFTER INSERT ON issue_comments
  FOR EACH ROW EXECUTE FUNCTION update_user_activity();

CREATE TRIGGER update_user_activity_posts
  AFTER INSERT ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_user_activity();

-- Function to get vote count for a target
CREATE OR REPLACE FUNCTION get_vote_count(target_type_param target_type, target_id_param UUID)
RETURNS TABLE(upvotes INTEGER, downvotes INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN vote_type = 'upvote' THEN 1 ELSE 0 END), 0)::INTEGER as upvotes,
    COALESCE(SUM(CASE WHEN vote_type = 'downvote' THEN 1 ELSE 0 END), 0)::INTEGER as downvotes
  FROM votes 
  WHERE target_type = target_type_param AND target_id = target_id_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can read all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Issues policies  
CREATE POLICY "Anyone can read issues" ON issues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create issues" ON issues FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL OR is_anonymous = true
);
CREATE POLICY "Users can update their own issues" ON issues FOR UPDATE USING (
  auth.uid() = reporter_id OR 
  EXISTS(SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('officer', 'admin'))
);

-- Comments policies
CREATE POLICY "Anyone can read comments" ON issue_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON issue_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON issue_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON issue_comments FOR DELETE USING (auth.uid() = user_id);

-- Community posts policies
CREATE POLICY "Anyone can read community posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON community_posts FOR DELETE USING (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Users can read all votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own votes" ON votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own votes" ON votes FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can read their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default notification templates
INSERT INTO notification_templates (type, language, title_template, body_template) VALUES
('issue_update', 'en', 'Issue Update', 'Your issue "{{issue_title}}" has been updated to {{status}}'),
('issue_resolved', 'en', 'Issue Resolved', 'Your issue "{{issue_title}}" has been resolved!'),
('comment_reply', 'en', 'New Reply', '{{user_name}} replied to your comment'),
('upvote', 'en', 'New Upvote', 'Someone upvoted your {{target_type}}'),
('mention', 'en', 'You were mentioned', '{{user_name}} mentioned you in a {{target_type}}'),
('assignment', 'en', 'Issue Assigned', 'Issue "{{issue_title}}" has been assigned to you'),
('community_post', 'en', 'New Community Post', '{{user_name}} posted in the community'),
('general', 'en', 'Notification', '{{message}}');

-- =====================================================
-- UTILITY FUNCTIONS FOR APPLICATION USE
-- =====================================================

-- Function to get nearby issues
CREATE OR REPLACE FUNCTION get_nearby_issues(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION, 
  radius_km DOUBLE PRECISION DEFAULT 5
) RETURNS TABLE (
  id UUID,
  title TEXT,
  category issue_category,
  status issue_status,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.title,
    i.category,
    i.status,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      i.location
    ) / 1000.0 as distance_km
  FROM issues i
  WHERE ST_DWithin(
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    i.location,
    radius_km * 1000
  )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics(target_user_id UUID)
RETURNS TABLE (
  issues_reported INTEGER,
  comments_made INTEGER,
  posts_made INTEGER,
  votes_cast INTEGER,
  upvotes_received INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM issues WHERE reporter_id = target_user_id) as issues_reported,
    (SELECT COUNT(*)::INTEGER FROM issue_comments WHERE user_id = target_user_id) as comments_made,
    (SELECT COUNT(*)::INTEGER FROM community_posts WHERE user_id = target_user_id) as posts_made,
    (SELECT COUNT(*)::INTEGER FROM votes WHERE user_id = target_user_id) as votes_cast,
    (
      SELECT (
        COALESCE((SELECT SUM(upvotes) FROM issues WHERE reporter_id = target_user_id), 0) +
        COALESCE((SELECT SUM(upvotes) FROM issue_comments WHERE user_id = target_user_id), 0) +
        COALESCE((SELECT SUM(upvotes) FROM community_posts WHERE user_id = target_user_id), 0)
      )::INTEGER
    ) as upvotes_received;
END;
$$ LANGUAGE plpgsql;
