import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import CommunityService, { IssueComment as IssueCommentType } from '@/lib/communityService';

interface IssueCommentProps {
  comment: IssueCommentType;
  onReply?: (comment: IssueCommentType) => void;
  onVote?: (commentId: string, voteType: 'upvote' | 'downvote') => void;
  showReplies?: boolean;
  level?: number;
}

export default function IssueComment({ 
  comment, 
  onReply, 
  onVote, 
  showReplies = true,
  level = 0
}: IssueCommentProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [isVoting, setIsVoting] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (isVoting) return;
    
    setIsVoting(true);
    try {
      const success = await CommunityService.vote({
        target_type: 'comment',
        target_id: comment.id,
        vote_type: voteType
      });
      
      if (success && onVote) {
        onVote(comment.id, voteType);
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply(comment);
    } else {
      setShowReplyForm(!showReplyForm);
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      marginLeft: level * 20,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#e5e7eb',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userInfo: {
      flex: 1,
    },
    displayName: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#111827',
    },
    timestamp: {
      fontSize: 11,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 1,
    },
    content: {
      fontSize: 14,
      lineHeight: 20,
      color: isDark ? '#ffffff' : '#111827',
      marginBottom: 8,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#e5e7eb',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    actionText: {
      marginLeft: 4,
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    voteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    voteText: {
      marginLeft: 4,
      fontSize: 12,
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
      marginLeft: 4,
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
    },
    repliesContainer: {
      marginTop: 8,
    },
  });

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - commentTime.getTime()) / (1000 * 60));
    
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
          {comment.user_profile?.avatar_url ? (
            <Ionicons
              name="person"
              size={16}
              color={isDark ? '#9ca3af' : '#6b7280'}
            />
          ) : (
            <Ionicons
              name="person"
              size={16}
              color={isDark ? '#9ca3af' : '#6b7280'}
            />
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>
            {comment.user_profile?.display_name || t('community.anonymous')}
          </Text>
          <Text style={styles.timestamp}>
            {formatTimestamp(comment.created_at)}
          </Text>
        </View>
      </View>

      <Text style={styles.content}>
        {comment.content}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.voteButton}
          onPress={() => handleVote('upvote')}
          disabled={isVoting}
        >
          <Ionicons
            name={comment.user_vote === 'upvote' ? 'arrow-up' : 'arrow-up-outline'}
            size={16}
            color={
              comment.user_vote === 'upvote'
                ? styles.upvoteActive.color
                : isDark ? '#9ca3af' : '#6b7280'
            }
          />
          <Text
            style={[
              styles.voteText,
              comment.user_vote === 'upvote' && styles.upvoteActive,
            ]}
          >
            {comment.vote_counts?.upvotes || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.voteButton}
          onPress={() => handleVote('downvote')}
          disabled={isVoting}
        >
          <Ionicons
            name={comment.user_vote === 'downvote' ? 'arrow-down' : 'arrow-down-outline'}
            size={16}
            color={
              comment.user_vote === 'downvote'
                ? styles.downvoteActive.color
                : isDark ? '#9ca3af' : '#6b7280'
            }
          />
          <Text
            style={[
              styles.voteText,
              comment.user_vote === 'downvote' && styles.downvoteActive,
            ]}
          >
            {comment.vote_counts?.downvotes || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.replyButton} onPress={handleReply}>
          <Ionicons
            name="chatbubble-outline"
            size={16}
            color={isDark ? '#9ca3af' : '#6b7280'}
          />
          <Text style={styles.replyText}>
            {t('community.reply')}
          </Text>
        </TouchableOpacity>
      </View>

      {showReplies && comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <IssueComment
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onVote={onVote}
              level={level + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}
