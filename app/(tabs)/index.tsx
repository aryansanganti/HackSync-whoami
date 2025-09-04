import { useTheme } from '@/contexts/ThemeContext';
import { RoleManager, UserRole } from '@/lib/roleManager';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SupabaseService from '../../lib/supabase-service';

export default function HomeScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [quickStats, setQuickStats] = useState<{ total: number; byStatus: Record<string, number> }>({
    total: 0,
    byStatus: { 'Pending': 0, 'In Progress': 0, 'Resolved': 0 },
  });

  useEffect(() => {
    checkUserRole();
    loadQuickStats();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        checkUserRole();
        loadQuickStats();
      } else {
        setUserRole(null);
        loadQuickStats();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Refresh stats when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      loadQuickStats();
      // Subscribe to realtime changes and refresh stats
      const sub = SupabaseService.subscribeToIssues(() => {
        loadQuickStats();
      });
      return () => {
        try { sub.unsubscribe(); } catch { }
      };
    }, [])
  );

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

  const loadQuickStats = async () => {
    try {
      const stats = await SupabaseService.getIssueStats();
      setQuickStats({ total: stats.total, byStatus: stats.byStatus as any });
    } catch (e) {
      // keep previous
    }
  };

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
            {isOfficer ? t('home.officerTitle') : t('home.title')}
          </Text>
          <Text style={{
            fontSize: 16,
            color: isDark ? '#9ca3af' : '#6b7280',
            marginBottom: 20
          }}>
            {isOfficer
              ? t('home.officerSubtitle')
              : t('home.subtitle')
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
                  {t('home.reportNewIssue')}
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
                    {t('home.myIssues')}
                  </Text>
                  <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' }}>
                    {t('home.myIssuesDescription')}
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
                  {t('home.viewAllIssues')}
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
                    {t('home.reportIssue')}
                  </Text>
                  <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' }}>
                    {t('home.reportIssueDescription')}
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
              {t('home.quickStats')}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: isDark ? '#60a5fa' : '#3b82f6' }}>{quickStats.total}</Text>
                <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>{t('home.totalIssues')}</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: isDark ? '#10b981' : '#059669' }}>{quickStats.byStatus['Resolved'] || 0}</Text>
                <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>{t('home.resolved')}</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: isDark ? '#f59e0b' : '#d97706' }}>{quickStats.byStatus['Pending'] || 0}</Text>
                <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>{t('home.pending')}</Text>
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
                {t('home.viewIssuesOnMap')}
              </Text>
              <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' }}>
                {isOfficer ? t('home.officerViewIssuesOnMapDescription') : t('home.viewIssuesOnMapDescription')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 