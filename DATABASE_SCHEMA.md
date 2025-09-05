# Civic AI Database Schema

This document describes the comprehensive Supabase database schema for the Civic AI application, supporting all features including civic issue reporting, community engagement, AI analysis, notifications, and multilingual support.

## Overview

The schema is designed to support a full-featured civic engagement platform with:

- **Civic Issue Management**: Comprehensive issue tracking with geospatial support
- **User Management**: Role-based access with profiles and authentication
- **Community Features**: Social interactions, comments, posts, voting
- **AI Integration**: Storage for AI analysis results and confidence scores
- **Notification System**: Real-time notifications with templates
- **Media Storage**: Images, audio, video files with cloud storage
- **Analytics**: Event tracking and engagement metrics
- **Multilingual Support**: Localized content and notifications

## Database Structure

### Core Tables

#### 1. User Management

**`user_profiles`** - Extended user information
- Links to Supabase Auth users
- Stores role (citizen/officer/volunteer/admin)
- Location data with PostGIS geography
- Notification preferences
- Language and theme preferences
- Push notification tokens

**`user_sessions`** - Active session tracking
- Device information
- IP address and location tracking
- Session expiration management

**`user_follows`** - Social following relationships
- Follower/following connections
- Support for social features

#### 2. Civic Issues

**`issues`** - Main civic issues table
- Complete issue information (title, description, category)
- Geospatial location with PostGIS
- Image/audio/video URLs from storage
- AI analysis results and confidence scores
- Assignment to officers
- Status tracking (Pending/In Progress/Resolved)
- Engagement metrics (upvotes, downvotes, views)

**`issue_history`** - Change tracking
- Audit trail for all issue modifications
- Track status changes, assignments, updates

**`issue_attachments`** - Additional file attachments
- Support for multiple file types
- File metadata and storage URLs

#### 3. Community & Engagement

**`issue_comments`** - Comments on issues
- Nested comment support (replies)
- Official comments from officers
- Voting support

**`community_posts`** - General community discussion
- Standalone posts not tied to specific issues
- Image support
- Hashtags and mentions
- Moderation features (pinned, featured, deleted)

**`votes`** - Unified voting system
- Support for voting on issues, comments, and posts
- Upvote/downvote tracking
- Automatic count updates via triggers

#### 4. Notifications

**`notifications`** - User notifications
- Multiple notification types
- Related entity linking (issues, comments, posts)
- Read/unread status tracking
- Push notification delivery tracking

**`notification_templates`** - Multilingual templates
- Template system for different notification types
- Support for multiple languages
- Variable substitution support

#### 5. Social Features

**`hashtags`** - Hashtag system
- Usage counting
- Trending hashtag support

**`mentions`** - User mentions
- Support for mentioning users in posts/comments
- Cross-reference to related content

### Storage Buckets

- **`issue-images`** - Images for civic issues (50MB limit)
- **`user-avatars`** - Profile pictures (10MB limit)  
- **`community-images`** - Community post images (50MB limit)
- **`issue-audio`** - Audio recordings (100MB limit)
- **`issue-videos`** - Video files (500MB limit)

### Key Features

#### Geospatial Support
- Uses PostGIS for efficient location-based queries
- Support for finding nearby issues
- Radius-based searching
- Location indexing for performance

#### AI Integration
- Storage for AI analysis results
- Confidence scoring (0-100)
- Support for AI category suggestions
- Manual override capabilities

#### Role-Based Access
- Four user roles: citizen, officer, volunteer, admin
- Row Level Security (RLS) policies
- Permission-based feature access

#### Real-time Features
- Supabase real-time subscriptions
- Live updates for issues, comments, votes
- Real-time notifications

#### Performance Optimizations
- Comprehensive indexing strategy
- Materialized views for statistics
- Partial indexes for common queries
- Trigger-based count maintenance

#### Multilingual Support
- Notification templates in multiple languages
- Support for Hindi, Bengali, Tamil, Telugu, Marathi
- Localized content support

## Database Functions

### Utility Functions

**`get_nearby_issues(lat, lng, radius)`**
- Find issues within a specified radius
- Returns distance-sorted results

**`get_user_statistics(user_id)`**
- Calculate user engagement metrics
- Issues reported, comments made, votes cast

**`get_vote_count(target_type, target_id)`**
- Get upvote/downvote counts for any entity

### Maintenance Functions

**`cleanup_old_notifications()`**
- Remove old read notifications
- Clean up expired notifications

**`update_trending_hashtags()`**
- Update trending hashtag flags
- Based on recent usage patterns

**`refresh_stats_views()`**
- Refresh materialized views
- Update cached statistics

## Triggers

- **Auto-update timestamps** on all tables
- **Vote count maintenance** - Automatically update vote counts
- **Issue history tracking** - Log all issue changes
- **User activity tracking** - Update last active timestamps

## Security

### Row Level Security (RLS)
- Enabled on all sensitive tables
- Users can only access appropriate data
- Anonymous issue reporting support
- Officer/admin elevated permissions

### Storage Security
- Public read access for images/media
- Authenticated upload requirements
- File type and size restrictions
- User-based access controls

## Migration Strategy

1. **Initial Schema** (`001_initial_schema.sql`)
   - Create all tables, types, functions
   - Set up indexes and triggers
   - Enable RLS and create policies

2. **Storage Setup** (`002_storage_policies.sql`)
   - Create storage buckets
   - Set up storage policies

3. **Seed Data** (`seed.sql`)
   - Insert notification templates
   - Add sample hashtags
   - Create materialized views

## Usage Examples

### Creating an Issue
```sql
INSERT INTO issues (
  title, description, category, priority,
  latitude, longitude, location, address,
  image_urls, is_anonymous
) VALUES (
  'Pothole on Main Road',
  'Large pothole causing traffic issues',
  'Roads', 'High',
  19.0760, 72.8777,
  ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326),
  'Andheri West, Mumbai',
  ARRAY['https://storage.url/image.jpg'],
  false
);
```

### Finding Nearby Issues
```sql
SELECT * FROM get_nearby_issues(19.0760, 72.8777, 5.0);
```

### Getting User Statistics
```sql
SELECT * FROM get_user_statistics('user-uuid-here');
```

## Monitoring & Maintenance

### Regular Tasks
- Run `cleanup_old_notifications()` daily
- Run `update_trending_hashtags()` every 6 hours
- Run `refresh_stats_views()` every hour
- Monitor storage usage and clean up unused files

### Performance Monitoring
- Monitor slow queries and add indexes as needed
- Track materialized view refresh performance
- Monitor storage bucket usage
- Track real-time subscription performance

## Environment Configuration

Ensure these environment variables are set:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Anonymous access key
- `SUPABASE_SERVICE_KEY` - Service role key (for server operations)

## Integration with App

The schema integrates seamlessly with your TypeScript interfaces:
- All enum types match your TypeScript definitions
- Field names and structures align with your models
- Support for all app features including AI analysis, notifications, and community features

This comprehensive schema provides a robust foundation for your Civic AI application with room for future expansion and optimization.
