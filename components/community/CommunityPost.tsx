import { useTheme } from '@/contexts/ThemeContext';
import CommunityService, { CommunityPost as CommunityPostType } from '@/lib/communityService';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CommunityPostProps {
  post: CommunityPostType;
  onReply?: (post: CommunityPostType) => void;
  onVote?: (postId: string, voteType: 'upvote' | 'downvote') => void;
  showReplies?: boolean;
}

export default function CommunityPost({
  post,
  onReply,
  onVote,
  showReplies = false
}: CommunityPostProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (isVoting) return;

    setIsVoting(true);
    try {
      const success = await CommunityService.vote({
        target_type: 'post',
        target_id: post.id,
        vote_type: voteType
      });

      if (success && onVote) {
        onVote(post.id, voteType);
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply(post);
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userInfo: {
      flex: 1,
    },
    displayName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#111827',
    },
    roleBadge: {
      marginLeft: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: isDark ? '#111827' : '#eef2ff',
    },
    roleText: {
      fontSize: 10,
      color: isDark ? '#93c5fd' : '#3b82f6',
      fontWeight: '700',
      textTransform: 'uppercase'
    },
    timestamp: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 2,
    },
    content: {
      fontSize: 16,
      lineHeight: 24,
      color: isDark ? '#ffffff' : '#111827',
      marginBottom: 12,
    },
    hashtag: {
      color: isDark ? '#60a5fa' : '#3b82f6',
      fontWeight: '500',
    },
    mention: {
      color: isDark ? '#10b981' : '#059669',
      fontWeight: '500',
    },
    images: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 12,
    },
    image: {
      width: 100,
      height: 100,
      borderRadius: 8,
      marginRight: 8,
      marginBottom: 8,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#e5e7eb',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 24,
    },
    actionText: {
      marginLeft: 6,
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    voteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 24,
    },
    voteText: {
      marginLeft: 6,
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    upvoteActive: {
      color: isDark ? '#10b981' : '#059669',
    },
    downvoteActive: {
      color: isDark ? '#ef4444' : '#dc2626',
    },
    replyButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    replyText: {
      marginLeft: 6,
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
  });

  const formatContent = (content: string) => {
    // Simple hashtag and mention highlighting
    return content
      .split(/(#\w+|@\w+)/g)
      .map((part, index) => {
        if (part.startsWith('#')) {
          return (
            <Text key={index} style={styles.hashtag}>
              {part}
            </Text>
          );
        } else if (part.startsWith('@')) {
          return (
            <Text key={index} style={styles.mention}>
              {part}
            </Text>
          );
        }
        return part;
      });
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return t('community.justNow');
    if (diffInMinutes < 60) return t('community.minutesAgo', { count: diffInMinutes });

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('community.hoursAgo', { count: diffInHours });

    const diffInDays = Math.floor(diffInHours / 24);
    return t('community.daysAgo', { count: diffInDays });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {post.user_profile?.avatar_url ? (
            <Image
              source={{ uri: post.user_profile.avatar_url }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
          ) : (
            <Ionicons
              name="person"
              size={20}
              color={isDark ? '#9ca3af' : '#6b7280'}
            />
          )}
        </View>
        <View style={styles.userInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.displayName}>
              {post.user_profile?.display_name || t('community.anonymous')}
            </Text>
            {!!post.user_profile?.role && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {post.user_profile.role === 'officer' ? 'Officer' : 'Citizen'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.timestamp}>
            {formatTimestamp(post.created_at)}
          </Text>
        </View>
        {post.is_pinned && (
          <Ionicons
            name="pin"
            size={16}
            color={isDark ? '#f59e0b' : '#d97706'}
          />
        )}
      </View>

      <Text style={styles.content}>
        {formatContent(post.content)}
      </Text>

      {post.image_urls && post.image_urls.length > 0 && (
        <View style={styles.images}>
          {post.image_urls.map((url, index) => (
            <Image
              key={index}
              source={{ uri: url }}
              style={styles.image}
            />
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.voteButton}
          onPress={() => handleVote('upvote')}
          disabled={isVoting}
        >
          <Ionicons
            name={post.user_vote === 'upvote' ? 'arrow-up' : 'arrow-up-outline'}
            size={20}
            color={
              post.user_vote === 'upvote'
                ? styles.upvoteActive.color
                : isDark ? '#9ca3af' : '#6b7280'
            }
          />
          <Text
            style={[
              styles.voteText,
              post.user_vote === 'upvote' && styles.upvoteActive,
            ]}
          >
            {post.vote_counts?.upvotes || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.voteButton}
          onPress={() => handleVote('downvote')}
          disabled={isVoting}
        >
          <Ionicons
            name={post.user_vote === 'downvote' ? 'arrow-down' : 'arrow-down-outline'}
            size={20}
            color={
              post.user_vote === 'downvote'
                ? styles.downvoteActive.color
                : isDark ? '#9ca3af' : '#6b7280'
            }
          />
          <Text
            style={[
              styles.voteText,
              post.user_vote === 'downvote' && styles.downvoteActive,
            ]}
          >
            {post.vote_counts?.downvotes || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.replyButton} onPress={handleReply}>
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={isDark ? '#9ca3af' : '#6b7280'}
          />
          <Text style={styles.replyText}>
            {post.reply_count || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons
            name="share-outline"
            size={20}
            color={isDark ? '#9ca3af' : '#6b7280'}
          />
          <Text style={styles.actionText}>
            {t('community.share')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
