import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: 'issue_update' | 'issue_resolved' | 'comment_reply' | 'upvote' | 'community_post' | 'general';
  issueId?: string;
  commentId?: string;
  postId?: string;
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  async initialize() {
    try {
      // Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Get push token
      if (Device.isDevice) {
        const projectId = (Constants.expoConfig as any)?.extra?.eas?.projectId || (Constants as any)?.easConfig?.projectId;
        this.expoPushToken = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined as any)).data;
        console.log('Expo push token:', this.expoPushToken);

        // Save token to user profile
        await this.savePushToken();
      } else {
        console.log('Must use physical device for push notifications');
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  private async savePushToken() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && this.expoPushToken) {
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            push_token: this.expoPushToken,
            push_token_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error saving push token:', error);
        }
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  private setupNotificationListeners() {
    // Handle notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Handle in-app notification display
    });

    // Handle notification taps
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      this.handleNotificationTap(response);
    });
  }

  private handleNotificationTap(response: any) {
    const data = response.notification.request.content.data;

    // Navigate based on notification type
    if (data?.type === 'issue_update' && data?.issueId) {
      // Navigate to issue detail
      // This would need to be implemented with navigation
    } else if (data?.type === 'comment_reply' && data?.commentId) {
      // Navigate to comment thread
    } else if (data?.type === 'community_post' && data?.postId) {
      // Navigate to community post
    }
  }

  async scheduleLocalNotification(notificationData: NotificationData) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }

  async sendPushNotification(notificationData: NotificationData, userId?: string) {
    try {
      if (!this.expoPushToken && !userId) {
        console.log('No push token available');
        return;
      }

      let pushToken = this.expoPushToken;

      // If userId is provided, get their push token
      if (userId && !pushToken) {
        const { data } = await supabase
          .from('user_profiles')
          .select('push_token, notification_preferences')
          .eq('user_id', userId)
          .single();

        // Respect recipient preferences when provided
        const prefs = data?.notification_preferences as any | undefined;
        if (prefs) {
          const allowed = this.isAllowedByPreferences(notificationData.type, prefs);
          if (!allowed) {
            console.log('Recipient has disabled this notification type');
            return;
          }
        }

        if (data?.push_token) {
          pushToken = data.push_token;
        }
      }

      if (!pushToken) {
        console.log('No push token found for user');
        return;
      }

      const message = {
        to: pushToken,
        sound: 'default',
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data || {},
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log('Push notification sent:', result);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  async sendBulkNotifications(notificationData: NotificationData, userIds: string[]) {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('push_token, notification_preferences')
        .in('user_id', userIds)
        .not('push_token', 'is', null);

      if (!data || data.length === 0) {
        console.log('No push tokens found for users');
        return;
      }

      const messages = data
        .filter((user: any) => this.isAllowedByPreferences(notificationData.type, user.notification_preferences))
        .map((user: any) => ({
          to: user.push_token,
          sound: 'default',
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || {},
        }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      console.log('Bulk push notifications sent:', result);
    } catch (error) {
      console.error('Error sending bulk push notifications:', error);
    }
  }

  private isAllowedByPreferences(
    type: NotificationData['type'],
    prefs?: any
  ): boolean {
    if (!prefs) return true;
    switch (type) {
      case 'issue_update':
        return prefs.issue_updates !== false;
      case 'issue_resolved':
        return prefs.issue_resolved !== false;
      case 'comment_reply':
        return prefs.comment_replies !== false;
      case 'upvote':
        return prefs.upvotes !== false;
      case 'community_post':
        return prefs.community_posts !== false;
      case 'general':
      default:
        return prefs.general !== false;
    }
  }

  async getNotificationPreferences() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('user_profiles')
        .select('notification_preferences')
        .eq('user_id', user.id)
        .single();

      return data?.notification_preferences || {
        issue_updates: true,
        issue_resolved: true,
        comment_replies: true,
        upvotes: true,
        community_posts: true,
        general: true,
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }

  async updateNotificationPreferences(preferences: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          notification_preferences: preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating notification preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export default new NotificationService();
