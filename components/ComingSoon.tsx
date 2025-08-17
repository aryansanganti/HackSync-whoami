import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface ComingSoonProps {
  feature: string;
  description?: string;
}

export default function ComingSoon({ feature, description }: ComingSoonProps) {
  const { isDark } = useTheme();
  
  return (
    <View className="flex-1 bg-white dark:bg-black items-center justify-center px-8">
      <View className="items-center">
        <View className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-6">
          <Ionicons 
            name="construct-outline" 
            size={48} 
            color={isDark ? '#6b7280' : '#9ca3af'} 
          />
        </View>
        
        <Text className="text-3xl font-bold text-gray-800 dark:text-gray-200 text-center mb-4">
          🚧 {feature} Coming Soon
        </Text>
        
        <Text className="text-base text-gray-500 dark:text-gray-400 text-center leading-6">
          {description || `This feature will be available in Phase 2 & 3 updates.`}
        </Text>
        
        <View className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <Text className="text-sm text-blue-700 dark:text-blue-300 text-center">
            💡 This feature is planned for future releases and will enhance your civic engagement experience.
          </Text>
        </View>
      </View>
    </View>
  );
}
