import { useTheme } from '@/contexts/ThemeContext';
import { RoleManager, UserRole } from '@/lib/roleManager';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { isDark } = useTheme();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkUserRole();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        checkUserRole();
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const role = await RoleManager.detectUserRole(user.email || null);
        setUserRole(role);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole('citizen'); // Default to citizen
    }
  };

  const isOfficer = isAuthenticated && RoleManager.canAccessOfficerFeatures(userRole || 'citizen');

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
            {isOfficer ? 'Officer Dashboard' : 'Civic AI'}
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: isDark ? '#9ca3af' : '#6b7280',
            marginBottom: 20 
          }}>
            {isOfficer 
              ? 'Manage civic issues and track progress'
              : 'Report and track civic issues in your area'
            }
          </Text>

          {!isOfficer && (
            <>
              {/* Citizen Actions */}
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

              <TouchableOpacity
                onPress={() => router.push('/(tabs)/my-issues')}
                style={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                  marginBottom: 20,
                }}
              >
                <Ionicons name="document-text" size={24} color={isDark ? '#60a5fa' : '#3b82f6'} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#ffffff' : '#111827' }}>
                    My Issues
                  </Text>
                  <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' }}>
                    Track your reported issues
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
              </TouchableOpacity>
            </>
          )}

          {isOfficer && (
            <>
              {/* Officer Actions */}
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/all-issues')}
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
                <Ionicons name="list" size={24} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                  View All Issues
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/report')}
                style={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                  marginBottom: 20,
                }}
              >
                <Ionicons name="add-circle" size={24} color={isDark ? '#60a5fa' : '#3b82f6'} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#ffffff' : '#111827' }}>
                    Report Issue
                  </Text>
                  <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' }}>
                    Manual entry for officers
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
              </TouchableOpacity>
            </>
          )}

          {/* Quick Stats */}
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

          {/* Map Access */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/map')}
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
                {isOfficer ? 'See all issues across your area' : 'See all reported issues in your area'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 