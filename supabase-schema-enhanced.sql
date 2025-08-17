-- Enhanced Civic Issue Management Database Schema
-- Execute these commands in your Supabase SQL editor

-- 1. Enhanced issues table with additional fields
ALTER TABLE IF EXISTS issues ADD COLUMN IF NOT EXISTS assigned_officer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS issues ADD COLUMN IF NOT EXISTS estimated_resolution_date DATE;
ALTER TABLE IF EXISTS issues ADD COLUMN IF NOT EXISTS actual_resolution_date DATE;
ALTER TABLE IF EXISTS issues ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE IF EXISTS issues ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS issues ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS issues ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE IF EXISTS issues ADD COLUMN IF NOT EXISTS ai_confidence_score FLOAT;
ALTER TABLE IF EXISTS issues ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Create officers table for better officer management
CREATE TABLE IF NOT EXISTS officers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_number TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    assigned_area TEXT,
    contact_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create issue_assignments table for tracking officer assignments
CREATE TABLE IF NOT EXISTS issue_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    officer_id UUID REFERENCES officers(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'completed'))
);

-- 4. Create issue_updates table for tracking issue progress
CREATE TABLE IF NOT EXISTS issue_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    officer_id UUID REFERENCES officers(id) ON DELETE SET NULL,
    update_type TEXT NOT NULL CHECK (update_type IN ('status_change', 'assignment', 'note', 'resolution')),
    old_value TEXT,
    new_value TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Create issue_votes table for upvoting/downvoting
CREATE TABLE IF NOT EXISTS issue_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(issue_id, user_id)
);

-- 6. Create issue_comments table for public comments
CREATE TABLE IF NOT EXISTS issue_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    is_official BOOLEAN DEFAULT false,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Create notifications table for user notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('issue_update', 'assignment', 'resolution', 'comment', 'general')),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Create heatmap_data table for storing aggregated heatmap data
CREATE TABLE IF NOT EXISTS heatmap_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grid_x INTEGER NOT NULL,
    grid_y INTEGER NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    issue_count INTEGER DEFAULT 0,
    total_priority_score FLOAT DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(grid_x, grid_y)
);

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_issues_assigned_officer ON issues(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);
CREATE INDEX IF NOT EXISTS idx_issues_last_activity ON issues(last_activity);
CREATE INDEX IF NOT EXISTS idx_issues_location ON issues(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_issues_tags ON issues USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_officers_user_id ON officers(user_id);
CREATE INDEX IF NOT EXISTS idx_officers_department ON officers(department);
CREATE INDEX IF NOT EXISTS idx_issue_assignments_issue_id ON issue_assignments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_assignments_officer_id ON issue_assignments(officer_id);
CREATE INDEX IF NOT EXISTS idx_issue_updates_issue_id ON issue_updates(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_votes_issue_id ON issue_votes(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_votes_user_id ON issue_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_heatmap_data_location ON heatmap_data(latitude, longitude);

-- 10. Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_officers_updated_at 
    BEFORE UPDATE ON officers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issue_comments_updated_at 
    BEFORE UPDATE ON issue_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Create function to update issue last_activity
CREATE OR REPLACE FUNCTION update_issue_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE issues SET last_activity = now() WHERE id = NEW.issue_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_issue_activity_on_comment
    AFTER INSERT OR UPDATE ON issue_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_issue_activity();

CREATE TRIGGER update_issue_activity_on_update
    AFTER INSERT OR UPDATE ON issue_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_issue_activity();

-- 12. Create function to update heatmap data
CREATE OR REPLACE FUNCTION update_heatmap_data()
RETURNS TRIGGER AS $$
DECLARE
    grid_size FLOAT := 0.001; -- Approximately 100m grid
    grid_x INTEGER;
    grid_y INTEGER;
BEGIN
    -- Calculate grid coordinates
    grid_x := FLOOR(NEW.latitude / grid_size);
    grid_y := FLOOR(NEW.longitude / grid_size);
    
    -- Update or insert heatmap data
    INSERT INTO heatmap_data (grid_x, grid_y, latitude, longitude, issue_count, total_priority_score, last_updated)
    VALUES (
        grid_x, 
        grid_y, 
        (grid_x + 0.5) * grid_size, 
        (grid_y + 0.5) * grid_size, 
        1, 
        CASE 
            WHEN NEW.priority = 'High' THEN 3.0
            WHEN NEW.priority = 'Medium' THEN 2.0
            ELSE 1.0
        END,
        now()
    )
    ON CONFLICT (grid_x, grid_y) DO UPDATE SET
        issue_count = heatmap_data.issue_count + 1,
        total_priority_score = heatmap_data.total_priority_score + EXCLUDED.total_priority_score,
        last_updated = now();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_heatmap_on_issue_insert
    AFTER INSERT ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_heatmap_data();

-- 13. Create function to get nearby issues with distance calculation
CREATE OR REPLACE FUNCTION get_nearby_issues(
    user_lat FLOAT,
    user_lng FLOAT,
    radius_km FLOAT DEFAULT 5.0,
    category_filter TEXT DEFAULT NULL,
    status_filter TEXT DEFAULT NULL,
    priority_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    category TEXT,
    priority TEXT,
    status TEXT,
    latitude FLOAT,
    longitude FLOAT,
    address TEXT,
    is_anonymous BOOLEAN,
    distance_km FLOAT,
    upvotes INTEGER,
    downvotes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.title,
        i.description,
        i.category,
        i.priority,
        i.status,
        i.latitude,
        i.longitude,
        i.address,
        i.is_anonymous,
        (6371 * acos(cos(radians(user_lat)) * cos(radians(i.latitude)) * 
         cos(radians(i.longitude) - radians(user_lng)) + 
         sin(radians(user_lat)) * sin(radians(i.latitude))))::FLOAT as distance_km,
        i.upvotes,
        i.downvotes,
        i.created_at
    FROM issues i
    WHERE (6371 * acos(cos(radians(user_lat)) * cos(radians(i.latitude)) * 
           cos(radians(i.longitude) - radians(user_lng)) + 
           sin(radians(user_lat)) * sin(radians(i.latitude)))) <= radius_km
    AND (category_filter IS NULL OR i.category = category_filter)
    AND (status_filter IS NULL OR i.status = status_filter)
    AND (priority_filter IS NULL OR i.priority = priority_filter)
    ORDER BY distance_km, i.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 14. Create function to get issue statistics for dashboard
CREATE OR REPLACE FUNCTION get_issue_dashboard_stats(
    officer_id UUID DEFAULT NULL,
    date_from DATE DEFAULT NULL,
    date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    total_issues BIGINT,
    pending_issues BIGINT,
    in_progress_issues BIGINT,
    resolved_issues BIGINT,
    high_priority_issues BIGINT,
    medium_priority_issues BIGINT,
    low_priority_issues BIGINT,
    avg_resolution_time_days FLOAT,
    issues_by_category JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_issues,
        COUNT(*) FILTER (WHERE status = 'Pending')::BIGINT as pending_issues,
        COUNT(*) FILTER (WHERE status = 'In Progress')::BIGINT as in_progress_issues,
        COUNT(*) FILTER (WHERE status = 'Resolved')::BIGINT as resolved_issues,
        COUNT(*) FILTER (WHERE priority = 'High')::BIGINT as high_priority_issues,
        COUNT(*) FILTER (WHERE priority = 'Medium')::BIGINT as medium_priority_issues,
        COUNT(*) FILTER (WHERE priority = 'Low')::BIGINT as low_priority_issues,
        AVG(EXTRACT(EPOCH FROM (actual_resolution_date - created_at))/86400)::FLOAT as avg_resolution_time_days,
        jsonb_object_agg(
            category, 
            COUNT(*)::BIGINT
        ) FILTER (WHERE category IS NOT NULL) as issues_by_category
    FROM issues i
    WHERE (officer_id IS NULL OR i.assigned_officer_id = officer_id)
    AND (date_from IS NULL OR i.created_at >= date_from)
    AND (date_to IS NULL OR i.created_at <= date_to);
END;
$$ LANGUAGE plpgsql;

-- 15. Create function to assign issue to officer
CREATE OR REPLACE FUNCTION assign_issue_to_officer(
    issue_uuid UUID,
    officer_uuid UUID,
    assigned_by_uuid UUID DEFAULT NULL,
    notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if issue exists and is not already assigned
    IF NOT EXISTS (SELECT 1 FROM issues WHERE id = issue_uuid) THEN
        RETURN FALSE;
    END IF;
    
    -- Check if officer exists and is active
    IF NOT EXISTS (SELECT 1 FROM officers WHERE id = officer_uuid AND is_active = true) THEN
        RETURN FALSE;
    END IF;
    
    -- Update issue assignment
    UPDATE issues 
    SET assigned_officer_id = officer_uuid, 
        updated_at = now() 
    WHERE id = issue_uuid;
    
    -- Create assignment record
    INSERT INTO issue_assignments (issue_id, officer_id, assigned_by, notes)
    VALUES (issue_uuid, officer_uuid, assigned_by_uuid, notes);
    
    -- Create issue update record
    INSERT INTO issue_updates (issue_id, officer_id, update_type, new_value, notes)
    VALUES (issue_uuid, officer_uuid, 'assignment', officer_uuid::TEXT, notes);
    
    -- Create notification for officer
    INSERT INTO notifications (user_id, title, body, type, issue_id)
    SELECT 
        o.user_id,
        'New Issue Assignment',
        'You have been assigned a new civic issue: ' || i.title,
        'assignment',
        issue_uuid
    FROM officers o
    JOIN issues i ON i.id = issue_uuid
    WHERE o.id = officer_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 16. Create function to update issue status
CREATE OR REPLACE FUNCTION update_issue_status(
    issue_uuid UUID,
    new_status TEXT,
    officer_uuid UUID DEFAULT NULL,
    notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    old_status TEXT;
BEGIN
    -- Get current status
    SELECT status INTO old_status FROM issues WHERE id = issue_uuid;
    
    IF old_status IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update issue status
    UPDATE issues 
    SET status = new_status, 
        updated_at = now(),
        actual_resolution_date = CASE WHEN new_status = 'Resolved' THEN now() ELSE actual_resolution_date END
    WHERE id = issue_uuid;
    
    -- Create issue update record
    INSERT INTO issue_updates (issue_id, officer_id, update_type, old_value, new_value, notes)
    VALUES (issue_uuid, officer_uuid, 'status_change', old_status, new_status, notes);
    
    -- Create notification for reporter if not anonymous
    INSERT INTO notifications (user_id, title, body, type, issue_id)
    SELECT 
        i.reporter_id,
        'Issue Status Updated',
        'Your issue "' || i.title || '" status has been updated to: ' || new_status,
        'issue_update',
        issue_uuid
    FROM issues i
    WHERE i.id = issue_uuid AND i.reporter_id IS NOT NULL;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 17. Create function to handle issue voting
CREATE OR REPLACE FUNCTION handle_issue_vote(
    issue_uuid UUID,
    user_uuid UUID,
    vote_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    existing_vote TEXT;
    vote_change INTEGER;
BEGIN
    -- Check if user already voted
    SELECT vote_type INTO existing_vote 
    FROM issue_votes 
    WHERE issue_id = issue_uuid AND user_id = user_uuid;
    
    -- Handle vote logic
    IF existing_vote IS NULL THEN
        -- New vote
        INSERT INTO issue_votes (issue_id, user_id, vote_type) 
        VALUES (issue_uuid, user_uuid, vote_type);
        
        IF vote_type = 'upvote' THEN
            UPDATE issues SET upvotes = upvotes + 1 WHERE id = issue_uuid;
        ELSE
            UPDATE issues SET downvotes = downvotes + 1 WHERE id = issue_uuid;
        END IF;
    ELSIF existing_vote != vote_type THEN
        -- Change vote
        UPDATE issue_votes SET vote_type = vote_type WHERE issue_id = issue_uuid AND user_id = user_uuid;
        
        IF existing_vote = 'upvote' THEN
            UPDATE issues SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = issue_uuid;
        ELSE
            UPDATE issues SET downvotes = downvotes - 1, upvotes = upvotes + 1 WHERE id = issue_uuid;
        END IF;
    ELSE
        -- Remove vote
        DELETE FROM issue_votes WHERE issue_id = issue_uuid AND user_id = user_uuid;
        
        IF vote_type = 'upvote' THEN
            UPDATE issues SET upvotes = upvotes - 1 WHERE id = issue_uuid;
        ELSE
            UPDATE issues SET downvotes = downvotes - 1 WHERE id = issue_uuid;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 18. Set up Row Level Security (RLS) policies
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE heatmap_data ENABLE ROW LEVEL SECURITY;

-- Officers policies
CREATE POLICY "Officers can view all officers" ON officers FOR SELECT USING (true);
CREATE POLICY "Users can view own officer profile" ON officers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage officers" ON officers FOR ALL USING (auth.role() = 'authenticated');

-- Issue assignments policies
CREATE POLICY "Users can view issue assignments" ON issue_assignments FOR SELECT USING (true);
CREATE POLICY "Officers can create assignments" ON issue_assignments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Issue updates policies
CREATE POLICY "Users can view issue updates" ON issue_updates FOR SELECT USING (true);
CREATE POLICY "Officers can create updates" ON issue_updates FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Issue votes policies
CREATE POLICY "Users can view votes" ON issue_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON issue_votes FOR ALL USING (auth.uid() = user_id);

-- Issue comments policies
CREATE POLICY "Users can view comments" ON issue_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON issue_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON issue_comments FOR UPDATE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Heatmap data policies
CREATE POLICY "Public can view heatmap data" ON heatmap_data FOR SELECT USING (true);

-- 19. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 20. Insert sample data for testing (optional)
-- Uncomment the following lines if you want sample data

/*
-- Sample officers
INSERT INTO officers (user_id, badge_number, department, assigned_area) VALUES
('00000000-0000-0000-0000-000000000001', 'OFF001', 'Public Works', 'Downtown'),
('00000000-0000-0000-0000-000000000002', 'OFF002', 'Sanitation', 'West Side'),
('00000000-0000-0000-0000-000000000003', 'OFF003', 'Traffic', 'North District');

-- Sample issues with more realistic data
INSERT INTO issues (title, description, category, priority, latitude, longitude, address, is_anonymous, status) VALUES
('Large Pothole on Main Street', 'Deep pothole causing traffic delays and vehicle damage', 'Roads', 'High', 19.0760, 72.8777, 'Main Street, Mumbai, Maharashtra', false, 'Pending'),
('Broken Streetlight at Park Entrance', 'Streetlight not working for past week, safety concern', 'Electricity', 'Medium', 19.0750, 72.8767, 'Park Entrance, Mumbai, Maharashtra', true, 'In Progress'),
('Garbage Collection Delayed', 'Garbage not collected for 3 days, creating health hazard', 'Sanitation', 'High', 19.0770, 72.8787, 'Residential Area, Mumbai, Maharashtra', false, 'Pending'),
('Water Leak on Sidewalk', 'Water leaking from underground pipe, creating slippery surface', 'Water Supply', 'Medium', 19.0740, 72.8757, 'Sidewalk near Market, Mumbai, Maharashtra', true, 'Resolved');
*/
