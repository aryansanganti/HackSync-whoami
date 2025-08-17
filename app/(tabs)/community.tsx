import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

export default function CommunityScreen() {
  const { isDark } = useTheme();
  return (
    <View
      className="flex-1 items-center justify-center bg-white dark:bg-black px-6"
      style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}
    >
      <Ionicons
        name="people-outline"
        size={64}
        color={isDark ? '#9ca3af' : '#6b7280'}
      />
      <Text className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-200 text-center">
        Community Coming Soon
      </Text>
    </View>
  );
}
