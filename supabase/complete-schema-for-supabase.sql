-- =====================================================
-- CIVIC AI - COMPLETE DATABASE SCHEMA
-- Apply this script in your Supabase SQL Editor
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- USER MANAGEMENT AND AUTHENTICATION
-- =====================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  -- Role and permissions
  role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'officer', 'volunteer', 'admin')),
  department TEXT, -- For officers: 'roads', 'sanitation', 'electricity', etc.
  jurisdiction JSONB, -- Geographic area of responsibility
  
  -- Profile settings
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi', 'bn', 'ta', 'te', 'mr')),
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
  
  -- Location (optional, for better issue recommendations)
  preferred_location GEOGRAPHY(POINT, 4326),
  address TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  last_active TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CIVIC ISSUES - CORE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic issue information
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Roads', 'Sanitation', 'Electricity', 'Water Supply', 'Public Safety', 'Environment', 'Others')),
  sub_category TEXT,
  
  -- Priority and status
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'closed', 'duplicate')),
  
  -- Reporter information
  reporter_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT false,
  
  -- Location data
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  address TEXT NOT NULL,
  landmark TEXT,
  
  -- Media and attachments
  image_urls TEXT[] DEFAULT '{}',
  audio_urls TEXT[] DEFAULT '{}',
  video_urls TEXT[] DEFAULT '{}',
  
  -- AI Analysis results
  ai_category_confidence FLOAT,
  ai_priority_suggestion TEXT,
  ai_description_summary TEXT,
  ai_tags TEXT[] DEFAULT '{}',
  
  -- Assignment and tracking
  assigned_officer_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  assigned_department TEXT,
  estimated_resolution_date DATE,
  actual_resolution_date DATE,
  
  -- Community engagement
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0, -- For flagging inappropriate content
  
  -- Tags and metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_coordinates CHECK (ST_X(location::geometry) BETWEEN -180 AND 180 AND ST_Y(location::geometry) BETWEEN -90 AND 90)
);

-- =====================================================
-- COMMUNITY AND ENGAGEMENT TABLES
-- =====================================================

-- Comments on issues
CREATE TABLE IF NOT EXISTS issue_comments (
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
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'discussion' CHECK (type IN ('discussion', 'announcement', 'event', 'poll')),
  
  -- Location (optional)
  location GEOGRAPHY(POINT, 4326),
  address TEXT,
  
  -- Media
  image_urls TEXT[] DEFAULT '{}',
  
  -- Engagement
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  -- Visibility
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  
  -- Tags and metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voting system (for issues and posts)
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  
  -- What is being voted on
  target_type TEXT NOT NULL CHECK (target_type IN ('issue', 'comment', 'post')),
  target_id UUID NOT NULL,
  
  -- Vote value
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one vote per user per target
  UNIQUE(user_id, target_type, target_id)
);

-- =====================================================
-- NOTIFICATIONS AND COMMUNICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('issue_update', 'assignment', 'comment', 'vote', 'system', 'announcement')),
  
  -- Related entities
  related_issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  related_user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  
  -- Delivery status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Multi-channel delivery
  channels JSONB DEFAULT '{"push": true, "email": false, "sms": false}',
  delivery_status JSONB DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- =====================================================
-- ANALYTICS AND REPORTING
-- =====================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Event details
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  
  -- User and session
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Event data
  properties JSONB DEFAULT '{}',
  
  -- Location context
  location GEOGRAPHY(POINT, 4326),
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STORAGE BUCKETS (Run these in Supabase Dashboard -> Storage)
-- =====================================================

-- Create storage buckets (you'll need to create these manually in Supabase Dashboard)
-- 1. issue-images (public: false)
-- 2. user-avatars (public: true) 
-- 3. community-images (public: false)
-- 4. issue-audio (public: false)
-- 5. issue-videos (public: false)

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Geographic indexes
CREATE INDEX IF NOT EXISTS idx_issues_location ON issues USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_community_posts_location ON community_posts USING GIST(location);

-- Core lookup indexes
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_reporter_id ON issues(reporter_id);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_officer_id ON issues(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);

-- User and profile indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON user_profiles(department);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- Comment and engagement indexes
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_user_id ON issue_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_created_at ON issue_comments(created_at DESC);

-- Community indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(type);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);

-- Vote indexes
CREATE INDEX IF NOT EXISTS idx_votes_target ON votes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Text search indexes (for better search performance)
CREATE INDEX IF NOT EXISTS idx_issues_text_search ON issues USING GIN(to_tsvector('english', title || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_community_posts_text_search ON community_posts USING GIN(to_tsvector('english', title || ' ' || content));

-- =====================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to get nearby issues
CREATE OR REPLACE FUNCTION get_nearby_issues(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_km FLOAT DEFAULT 10.0,
  issue_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  issue_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  status TEXT,
  priority TEXT,
  distance_km FLOAT,
  upvotes INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.title,
    i.description,
    i.category,
    i.status,
    i.priority,
    ST_Distance(i.location::geometry, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geometry) / 1000 as distance_km,
    i.upvotes,
    i.created_at
  FROM issues i
  WHERE ST_DWithin(
    i.location::geometry,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geometry,
    radius_km * 1000
  )
  AND i.status != 'closed'
  ORDER BY distance_km ASC, i.created_at DESC
  LIMIT issue_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update upvotes/downvotes count
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
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrease upvotes/downvotes count
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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_issue_comments_updated_at BEFORE UPDATE ON issue_comments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Vote count update trigger
CREATE TRIGGER vote_count_trigger
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW EXECUTE PROCEDURE update_vote_counts();

-- Trigger to update user last_active
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

CREATE TRIGGER update_last_active_on_issue_create
  AFTER INSERT ON issues
  FOR EACH ROW EXECUTE PROCEDURE update_user_last_active_on_issue();

CREATE TRIGGER update_last_active_on_comment_create
  AFTER INSERT ON issue_comments
  FOR EACH ROW EXECUTE PROCEDURE update_user_last_active_on_comment();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can read all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Issues policies
CREATE POLICY "Anyone can read issues" ON issues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create issues" ON issues FOR INSERT WITH CHECK (auth.uid() = reporter_id OR is_anonymous = true);
CREATE POLICY "Officers can update assigned issues" ON issues FOR UPDATE USING (
  auth.uid() IN (
    SELECT user_id FROM user_profiles 
    WHERE role IN ('officer', 'admin') 
    AND user_id = auth.uid()
  )
  OR auth.uid() = reporter_id
);

-- Issue comments policies
CREATE POLICY "Anyone can read comments" ON issue_comments FOR SELECT USING (NOT is_deleted);
CREATE POLICY "Authenticated users can create comments" ON issue_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON issue_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON issue_comments FOR DELETE USING (auth.uid() = user_id);

-- Community posts policies
CREATE POLICY "Anyone can read posts" ON community_posts FOR SELECT USING (NOT is_deleted);
CREATE POLICY "Authenticated users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON community_posts FOR DELETE USING (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Anyone can read votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own votes" ON votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own votes" ON votes FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can read their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert some sample categories and data if needed
-- This will help you test the app immediately after setup

-- You're all set! 🎉
-- Next steps:
-- 1. Run this script in your Supabase SQL Editor
-- 2. Create the storage buckets in Supabase Dashboard -> Storage:
--    - issue-images (private)
--    - user-avatars (public)
--    - community-images (private)
--    - issue-audio (private)
--    - issue-videos (private)
-- 3. Your app should now work with the complete schema!
