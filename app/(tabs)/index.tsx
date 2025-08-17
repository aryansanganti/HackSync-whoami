import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function HomeScreen() {
  const { isDark } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 20 }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: isDark ? '#ffffff' : '#111827',
            marginBottom: 8 
          }}>
            Civic AI
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: isDark ? '#9ca3af' : '#6b7280',
            marginBottom: 20 
          }}>
            Report and track civic issues in your area
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/report')}
            style={{
              backgroundColor: isDark ? '#3b82f6' : '#3b82f6',
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Ionicons name="add-circle" size={24} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
              Report New Issue
            </Text>
          </TouchableOpacity>

          <View style={{ 
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDark ? '#ffffff' : '#111827', marginBottom: 12 }}>
              Quick Stats
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: isDark ? '#60a5fa' : '#3b82f6' }}>0</Text>
                <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>Total Issues</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: isDark ? '#10b981' : '#059669' }}>0</Text>
                <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>Resolved</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: isDark ? '#f59e0b' : '#d97706' }}>0</Text>
                <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>Pending</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/map')}
            style={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: isDark ? '#374151' : '#e5e7eb',
            }}
          >
            <Ionicons name="map-outline" size={24} color={isDark ? '#60a5fa' : '#3b82f6'} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#ffffff' : '#111827' }}>
                View Issues on Map
              </Text>
              <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' }}>
                See all reported issues in your area
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 