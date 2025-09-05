# 🚀 Supabase Schema Setup Guide for Civic AI

This guide will help you set up the complete database schema for your Civic AI application in your existing Supabase project.

## 📋 Prerequisites

- ✅ Existing Supabase project (you have this)
- ✅ Environment variables configured in `.env` (you have this)
- ✅ Supabase project URL and anon key (you have this)

## 🗃️ Step 1: Apply Database Schema

1. **Open your Supabase Dashboard**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Select your project: `dnbrbpallquktorvzmap`

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Apply the Main Schema**
   - Copy the entire contents of `supabase/complete-schema-for-supabase.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the script
   - ✅ This will create all tables, functions, indexes, and policies

## 📁 Step 2: Create Storage Buckets

1. **Navigate to Storage**
   - Click on "Storage" in the left sidebar
   - Click "Create bucket"

2. **Create these buckets one by one:**

   **Bucket 1: issue-images**
   - Name: `issue-images`
   - Public: ❌ (Private)
   - File size limit: 10MB
   - Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`

   **Bucket 2: user-avatars**
   - Name: `user-avatars`
   - Public: ✅ (Public)
   - File size limit: 2MB
   - Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`

   **Bucket 3: community-images**
   - Name: `community-images`
   - Public: ❌ (Private)
   - File size limit: 10MB
   - Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`

   **Bucket 4: issue-audio**
   - Name: `issue-audio`
   - Public: ❌ (Private)
   - File size limit: 25MB
   - Allowed MIME types: `audio/mpeg,audio/wav,audio/mp4`

   **Bucket 5: issue-videos**
   - Name: `issue-videos`
   - Public: ❌ (Private)
   - File size limit: 100MB
   - Allowed MIME types: `video/mp4,video/quicktime,video/avi`

## 🔒 Step 3: Apply Storage Policies

1. **Go back to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

2. **Apply Storage Policies**
   - Copy the entire contents of `supabase/storage-bucket-policies.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the script
   - ✅ This will set up all the storage access policies

## 🧪 Step 4: Test Your Setup

1. **Verify Tables Created**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

   You should see these tables:
   - ✅ `user_profiles`
   - ✅ `issues`
   - ✅ `issue_comments`
   - ✅ `community_posts`
   - ✅ `votes`
   - ✅ `notifications`
   - ✅ `analytics_events`

2. **Verify Storage Buckets**
   ```sql
   SELECT * FROM storage.buckets;
   ```

   You should see these buckets:
   - ✅ `issue-images`
   - ✅ `user-avatars`
   - ✅ `community-images`
   - ✅ `issue-audio`
   - ✅ `issue-videos`

3. **Test a Sample Query**
   ```sql
   -- This should work without errors
   SELECT * FROM issues LIMIT 5;
   ```

## 🚀 Step 5: Test Your App

1. **Start your React Native app**
   ```bash
   npm start
   ```

2. **Check for Schema Errors**
   - The schema warnings should now be gone
   - Your app should be able to connect to all tables
   - You should be able to create issues, users, etc.

## 🔧 Troubleshooting

### If you get "table not found" errors:
- Make sure you ran the complete schema SQL script
- Check that all tables were created in the public schema
- Verify RLS policies are enabled

### If you get storage errors:
- Make sure all 5 buckets are created
- Check that storage policies are applied
- Verify bucket permissions (public/private settings)

### If you get permission errors:
- Check that RLS policies are properly applied
- Make sure your app is using the correct anon key
- Test authentication flow

## 📊 Features Now Available

With this schema, your app now supports:

- ✅ **Complete User Management** - Profiles, roles, departments
- ✅ **Civic Issues** - Full CRUD with location, images, AI analysis
- ✅ **Community Features** - Comments, posts, discussions
- ✅ **Voting System** - Upvotes/downvotes for issues and posts
- ✅ **Notifications** - Multi-channel notification system
- ✅ **Media Storage** - Images, audio, video files
- ✅ **Analytics** - Event tracking and reporting
- ✅ **Geospatial Features** - Location-based queries and nearby issues
- ✅ **Multi-language Support** - Ready for i18n
- ✅ **Role-based Access** - Citizens, officers, volunteers, admins

## 🎉 You're All Set!

Your Civic AI app now has a complete, production-ready database schema with all the features you requested. The schema includes everything for civic issue reporting, community engagement, AI analysis storage, and administrative features.

## 📝 Next Steps

1. Test all app features
2. Add sample data for testing
3. Configure your AI integration (Gemini)
4. Set up push notifications
5. Deploy to app stores

**Need help?** Check the sample queries in the SQL files or refer to the Supabase documentation.
