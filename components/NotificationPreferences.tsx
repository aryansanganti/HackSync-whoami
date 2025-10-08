import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function NotificationPreferences() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      // Notification service integration removed - using default preferences
      console.log('Loading default notification preferences');
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (value: boolean) => {
    try {
      setNotificationsEnabled(value);
      
      // Notification service integration removed - preferences only stored locally
      console.log('Notification preference updated locally:', value);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      setNotificationsEnabled(notificationsEnabled);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('profile.notifications')}</Text>
      
      <View style={styles.preferenceItem}>
        <View style={{ flex: 1 }}>
          <Text style={styles.preferenceText}>Enable Notifications</Text>
          <Text style={styles.preferenceDescription}>
            Receive notifications for all app activities
          </Text>
        </View>
        <Switch
          style={styles.switch}
          value={notificationsEnabled}
          onValueChange={updatePreference}
          trackColor={{ false: isDark ? '#374151' : '#e5e7eb', true: isDark ? '#3b82f6' : '#3b82f6' }}
          thumbColor={notificationsEnabled ? '#ffffff' : '#ffffff'}
        />
      </View>
    </View>
  );
}
