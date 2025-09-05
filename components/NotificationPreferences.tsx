import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import notificationService from '@/lib/notificationService';

interface NotificationPreferences {
  issue_updates: boolean;
  issue_resolved: boolean;
  comment_replies: boolean;
  upvotes: boolean;
  community_posts: boolean;
  general: boolean;
}

export default function NotificationPreferences() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    issue_updates: true,
    issue_resolved: true,
    comment_replies: true,
    upvotes: true,
    community_posts: true,
    general: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await notificationService.getNotificationPreferences();
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);
      
      const success = await notificationService.updateNotificationPreferences(newPreferences);
      if (!success) {
        // Revert on failure
        setPreferences(preferences);
        Alert.alert(t('common.error'), 'Failed to update notification preferences');
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      setPreferences(preferences);
      Alert.alert(t('common.error'), 'Failed to update notification preferences');
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#ffffff' : '#111827',
      marginBottom: 16,
    },
    preferenceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    lastItem: {
      borderBottomWidth: 0,
    },
    preferenceText: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#ffffff' : '#111827',
    },
    preferenceDescription: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 2,
    },
    switch: {
      marginLeft: 12,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('profile.notifications')}</Text>
        <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  const preferenceItems = [
    {
      key: 'issue_updates' as keyof NotificationPreferences,
      title: t('notifications.issueUpdates'),
      description: t('notifications.issueUpdatesDesc'),
    },
    {
      key: 'issue_resolved' as keyof NotificationPreferences,
      title: t('notifications.issueResolved'),
      description: t('notifications.issueResolvedDesc'),
    },
    {
      key: 'comment_replies' as keyof NotificationPreferences,
      title: t('notifications.commentReplies'),
      description: t('notifications.commentRepliesDesc'),
    },
    {
      key: 'upvotes' as keyof NotificationPreferences,
      title: t('notifications.upvotes'),
      description: t('notifications.upvotesDesc'),
    },
    {
      key: 'community_posts' as keyof NotificationPreferences,
      title: t('notifications.communityPosts'),
      description: t('notifications.communityPostsDesc'),
    },
    {
      key: 'general' as keyof NotificationPreferences,
      title: t('notifications.general'),
      description: t('notifications.generalDesc'),
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('profile.notifications')}</Text>
      
      {preferenceItems.map((item, index) => (
        <View
          key={item.key}
          style={[
            styles.preferenceItem,
            index === preferenceItems.length - 1 && styles.lastItem,
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.preferenceText}>{item.title}</Text>
            <Text style={styles.preferenceDescription}>{item.description}</Text>
          </View>
          <Switch
            style={styles.switch}
            value={preferences[item.key]}
            onValueChange={(value) => updatePreference(item.key, value)}
            trackColor={{ false: isDark ? '#374151' : '#e5e7eb', true: isDark ? '#3b82f6' : '#3b82f6' }}
            thumbColor={preferences[item.key] ? '#ffffff' : '#ffffff'}
          />
        </View>
      ))}
    </View>
  );
}
