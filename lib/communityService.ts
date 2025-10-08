import { supabase } from './supabase';

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  image_urls?: string[];
  issue_id?: string;
  parent_post_id?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  is_pinned: boolean;
  metadata: any;
  user_profile?: {
    display_name: string;
    avatar_url?: string;
    role?: string;
  };
  vote_counts?: {
    upvotes: number;
    downvotes: number;
  };
  user_vote?: 'upvote' | 'downvote' | null;
  reply_count?: number;
  hashtags?: string[];
  mentions?: string[];
}

export interface IssueComment {
  id: string;
  user_id: string;
  issue_id: string;
  content: string;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  metadata: any;
  user_profile?: {
    display_name: string;
    avatar_url?: string;
    role?: string;
  };
  vote_counts?: {
    upvotes: number;
    downvotes: number;
  };
  user_vote?: 'upvote' | 'downvote' | null;
  reply_count?: number;
  replies?: IssueComment[];
}

export interface VoteData {
  target_type: 'issue' | 'comment' | 'post';
  target_id: string;
  vote_type: 'upvote' | 'downvote';
}

class CommunityService {
  private storagePrefix: string;

  constructor() {
    const base = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    this.storagePrefix = base
      ? `${base.replace(/\/$/, '')}/storage/v1/object/public/community-images/`
      : '';
  }

  private normalizeImageUrls(urls?: string[] | null): string[] | undefined {
    if (!urls || urls.length === 0) return urls || undefined;
    if (!this.storagePrefix) return urls; // Fallback: return as-is if env missing
    return urls.map(u => {
      if (!u) return u;
      if (u.startsWith('http://') || u.startsWith('https://')) return u;
      return `${this.storagePrefix}${u.replace(/^\//, '')}`;
    });
  }
  // Community Posts
  async getCommunityFeed(page = 0, limit = 20): Promise<CommunityPost[]> {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          user_profile:user_profiles(*)
        `)
        .eq('is_deleted', false)
        .is('parent_post_id', null) // Only top-level posts
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;

      const postsWithVotes = await Promise.all(
        (data || []).map(async (post: any) => {
          const userVote = await this.getUserVote('post', post.id);
          const vote_counts = { upvotes: post.upvotes ?? 0, downvotes: post.downvotes ?? 0 };
          return { ...post, image_urls: this.normalizeImageUrls(post.image_urls), vote_counts, user_vote: userVote } as CommunityPost;
        })
      );

      return postsWithVotes;
    } catch (error) {
      console.error('Error fetching community feed:', error);
      return [];
    }
  }

  async createCommunityPost(
    content: string,
    imageUrls?: string[],
    issueId?: string,
    parentPostId?: string
  ): Promise<CommunityPost | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Ensure user profile exists
      await this.ensureUserProfile(user.id);

      const hashtags = this.extractHashtags(content);
      const mentions = this.extractMentions(content);

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          content,
          image_urls: imageUrls,
          issue_id: issueId,
          parent_post_id: parentPostId,
          metadata: { hashtags, mentions }
        })
        .select('*')
        .single();

      if (error) throw error;

      // Process hashtags and mentions
      await this.processHashtags(data.id, hashtags);
      await this.processMentions(data.id, mentions);

      // Send notifications for mentions
      if (mentions.length > 0) {
        await this.notifyMentions(data.id, mentions, 'post');
      }

      // Refetch with user_profile join for consistent UI
      const { data: enriched, error: fetchErr } = await supabase
        .from('community_posts')
        .select(`*, user_profile:user_profiles(*)`)
        .eq('id', data.id)
        .single();

      if (fetchErr || !enriched) return data as unknown as CommunityPost;

      const vote_counts = { upvotes: enriched.upvotes ?? 0, downvotes: enriched.downvotes ?? 0 };
      const user_vote = await this.getUserVote('post', enriched.id);
      return { ...enriched, vote_counts, user_vote } as CommunityPost;
    } catch (error) {
      console.error('Error creating community post:', error);
      return null;
    }
  }

  async getPostReplies(postId: string): Promise<CommunityPost[]> {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          user_profile:user_profiles(*)
        `)
        .eq('parent_post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map((post) => ({
        ...post,
        image_urls: this.normalizeImageUrls(post.image_urls),
        vote_counts: { upvotes: post.upvotes ?? 0, downvotes: post.downvotes ?? 0 },
      })) as CommunityPost[];
    } catch (error) {
      console.error('Error fetching post replies:', error);
      return [];
    }
  }

  // Issue Comments
  async getIssueComments(issueId: string): Promise<IssueComment[]> {
    try {
      const { data, error } = await supabase
        .from('issue_comments')
        .select(`
          *,
          user_profile:user_profiles(*)
        `)
        .eq('issue_id', issueId)
        .eq('is_deleted', false)
        .is('parent_comment_id', null) // Only top-level comments
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get replies for each comment
      const commentsWithReplies = await Promise.all(
        data.map(async (comment) => {
          const replies = await this.getCommentReplies(comment.id);
          const userVote = await this.getUserVote('comment', comment.id);
          const vote_counts = { upvotes: comment.upvotes ?? 0, downvotes: comment.downvotes ?? 0 };
          return { ...comment, vote_counts, replies, user_vote: userVote } as IssueComment;
        })
      );

      return commentsWithReplies;
    } catch (error) {
      console.error('Error fetching issue comments:', error);
      return [];
    }
  }

  async getCommentReplies(commentId: string): Promise<IssueComment[]> {
    try {
      const { data, error } = await supabase
        .from('issue_comments')
        .select(`
          *,
          user_profile:user_profiles(*)
        `)
        .eq('parent_comment_id', commentId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map((c) => ({
        ...c,
        image_urls: this.normalizeImageUrls(c.image_urls),
        vote_counts: { upvotes: c.upvotes ?? 0, downvotes: c.downvotes ?? 0 },
      })) as IssueComment[];
    } catch (error) {
      console.error('Error fetching comment replies:', error);
      return [];
    }
  }

  async createIssueComment(
    issueId: string,
    content: string,
    parentCommentId?: string
  ): Promise<IssueComment | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Ensure user profile exists
      await this.ensureUserProfile(user.id);

      const mentions = this.extractMentions(content);

      const { data, error } = await supabase
        .from('issue_comments')
        .insert({
          user_id: user.id,
          issue_id: issueId,
          content,
          parent_comment_id: parentCommentId,
          metadata: { mentions }
        })
        .select('*')
        .single();

      if (error) throw error;

      // Process mentions
      await this.processMentions(data.id, mentions, 'comment');

      // Send notifications for mentions
      if (mentions.length > 0) {
        await this.notifyMentions(data.id, mentions, 'comment');
      }

      // Notify issue owner of new comment
      await this.notifyIssueOwner(issueId, 'New comment on your issue');

      return data;
    } catch (error) {
      console.error('Error creating issue comment:', error);
      return null;
    }
  }

  // Voting System
  async vote(voteData: VoteData): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('votes')
        .upsert({
          user_id: user.id,
          target_type: voteData.target_type,
          target_id: voteData.target_id,
          vote_type: voteData.vote_type,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification for upvotes
      if (voteData.vote_type === 'upvote') {
        await this.notifyVote(voteData);
      }

      return true;
    } catch (error) {
      console.error('Error voting:', error);
      return false;
    }
  }

  async removeVote(targetType: string, targetId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error removing vote:', error);
      return false;
    }
  }

  async getUserVote(targetType: string, targetId: string): Promise<'upvote' | 'downvote' | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('user_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .single();

      if (error || !data) return null;

      return data.vote_type;
    } catch (error) {
      console.error('Error getting user vote:', error);
      return null;
    }
  }

  // User Following
  async followUser(userId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: userId
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  }

  async unfollowUser(userId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }

  async getFollowing(): Promise<string[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (error) throw error;

      return data.map(follow => follow.following_id);
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  }

  // Helper Methods
  private async ensureUserProfile(userId: string): Promise<void> {
    try {
      console.log('Checking user profile for userId:', userId);

      // Check if user profile exists
      const { data: existingProfile, error: selectError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (selectError) {
        console.error('Error checking existing profile:', selectError);
        throw selectError;
      }

      if (!existingProfile) {
        console.log('User profile not found, creating new profile...');

        // Get user email from auth for display name fallback
        const { data: authUser } = await supabase.auth.getUser();
        const displayName = authUser.user?.email?.split('@')[0] || `User_${userId.slice(0, 8)}`;

        console.log('Creating profile with display name:', displayName);

        // Create basic user profile with only essential fields
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            display_name: displayName
          })
          .select()
          .single();

        if (insertError) {
          console.log('Error creating user profile:', insertError);

          // If the insert still fails, try with minimal data
          console.log('Trying to create profile with minimal data...');
          const { error: minimalError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: userId
            });

          if (minimalError) {
            console.error('Failed to create even minimal profile:', minimalError);
            throw minimalError;
          }

          console.log('Minimal profile created successfully');
        } else {
          console.log('User profile created successfully:', newProfile);
        }
      } else {
        console.log('User profile already exists');
      }
    } catch (error) {
      console.error('Error in ensureUserProfile:', error);

      // Final check to see if profile exists now
      const { data: finalCheck, error: finalError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (finalError || !finalCheck) {
        // If we still can't create/find the profile, let's proceed without it
        // This allows the post creation to continue even if profile creation fails
        console.warn(`Could not create/verify user profile for user: ${userId}, proceeding anyway`);
      }
    }
  }

  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    return content.match(hashtagRegex)?.map(tag => tag.substring(1)) || [];
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@[\w\u0590-\u05ff]+/g;
    return content.match(mentionRegex)?.map(mention => mention.substring(1)) || [];
  }

  private async processHashtags(postId: string, hashtags: string[]): Promise<void> {
    try {
      for (const hashtag of hashtags) {
        // Insert or update hashtag
        const { data: tagData } = await supabase
          .from('hashtags')
          .upsert({ name: hashtag }, { onConflict: 'name' })
          .select()
          .single();

        if (tagData) {
          // Link post to hashtag
          await supabase
            .from('post_hashtags')
            .insert({ post_id: postId, hashtag_id: tagData.id });
        }
      }
    } catch (error) {
      console.error('Error processing hashtags:', error);
    }
  }

  private async processMentions(
    targetId: string,
    mentions: string[],
    type: 'post' | 'comment' = 'post'
  ): Promise<void> {
    try {
      for (const mention of mentions) {
        // Find user by display name
        const { data: userData } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('display_name', mention)
          .single();

        if (userData) {
          const mentionData: any = {
            mentioned_user_id: userData.user_id,
            created_at: new Date().toISOString()
          };

          if (type === 'post') {
            mentionData.post_id = targetId;
          } else {
            mentionData.comment_id = targetId;
          }

          await supabase.from('mentions').insert(mentionData);
        }
      }
    } catch (error) {
      console.error('Error processing mentions:', error);
    }
  }

  private async notifyMentions(
    targetId: string,
    mentions: string[],
    type: 'post' | 'comment'
  ): Promise<void> {
    try {
      for (const mention of mentions) {
        const { data: userData } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('display_name', mention)
          .single();

        if (userData) {
          // Notification service integration removed
          console.log(`User ${userData.user_id} mentioned in ${type} ${targetId}`);
        }
      }
    } catch (error) {
      console.error('Error notifying mentions:', error);
    }
  }

  private async notifyIssueOwner(issueId: string, message: string): Promise<void> {
    try {
      // Using canonical 'issues' table (was 'civic_issues' in earlier schema drafts).
      // If your database still has only 'civic_issues', create a view:
      //   CREATE OR REPLACE VIEW public.issues AS SELECT * FROM public.civic_issues;
      const { data: issueData } = await supabase
        .from('issues')
        .select('reported_by')
        .eq('id', issueId)
        .single();

      if (issueData) {
        // Notification service integration removed
        console.log(`Issue owner ${issueData.reported_by} notified about issue ${issueId}: ${message}`);
      }
    } catch (error) {
      console.error('Error notifying issue owner:', error);
    }
  }

  private async notifyVote(voteData: VoteData): Promise<void> {
    try {
      let targetUserId: string | null = null;

      if (voteData.target_type === 'post') {
        const { data } = await supabase
          .from('community_posts')
          .select('user_id')
          .eq('id', voteData.target_id)
          .single();
        targetUserId = data?.user_id;
      } else if (voteData.target_type === 'comment') {
        const { data } = await supabase
          .from('issue_comments')
          .select('user_id')
          .eq('id', voteData.target_id)
          .single();
        targetUserId = data?.user_id;
      }

      if (targetUserId) {
        // Notification service integration removed
        console.log(`User ${targetUserId} notified about vote on ${voteData.target_type} ${voteData.target_id}`);
      }
    } catch (error) {
      console.error('Error notifying vote:', error);
    }
  }
}

export default new CommunityService();
