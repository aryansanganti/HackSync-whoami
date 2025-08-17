import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import SupabaseService from '@/lib/supabase-service';
import { CivicIssue, IssueStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyIssues() {
  const { isDark } = useTheme();
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<IssueStatus | 'all'>('all');

  useEffect(() => {
    loadUserIssues();
  }, []);

  const loadUserIssues = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const userIssues = await SupabaseService.getIssuesByReporter(user.id);
        setIssues(userIssues);
      } else {
        setIssues([]);
      }
    } catch (error) {
      console.error('Error loading user issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadUserIssues();
    setRefreshing(false);
  }, []);

  const getStatusColor = (status: IssueStatus) => {
    const colors = {
      'Pending': isDark ? '#f59e0b' : '#d97706',
      'In Progress': isDark ? '#3b82f6' : '#3b82f6',
      'Resolved': isDark ? '#10b981' : '#059669',
    };
    return colors[status] || colors['Pending'];
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'Low': isDark ? '#10b981' : '#059669',
      'Medium': isDark ? '#f59e0b' : '#d97706',
      'High': isDark ? '#ef4444' : '#dc2626',
    };
    return colors[priority as keyof typeof colors] || colors['Medium'];
  };

  const filters = [
    { key: 'all' as const, label: 'All', icon: 'list' },
    { key: 'Pending' as const, label: 'Pending', icon: 'time' },
    { key: 'In Progress' as const, label: 'In Progress', icon: 'construct' },
    { key: 'Resolved' as const, label: 'Resolved', icon: 'checkmark-circle' },
  ];

  const filteredIssues = issues.filter(issue => 
    selectedFilter === 'all' || issue.status === selectedFilter
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Loading your issues...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={{ padding: 20 }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: isDark ? '#ffffff' : '#111827',
            marginBottom: 8
          }}>
            My Issues
          </Text>
          <Text style={{
            fontSize: 16,
            color: isDark ? '#9ca3af' : '#6b7280',
            marginBottom: 20
          }}>
            Track the status of your reported civic issues
          </Text>

          {/* Filter Tabs */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderRadius: 12,
            padding: 4,
            marginBottom: 20,
          }}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                onPress={() => setSelectedFilter(filter.key)}
                style={{
                  flex: 1,
                  backgroundColor: selectedFilter === filter.key
                    ? (isDark ? '#3b82f6' : '#3b82f6')
                    : 'transparent',
                  borderRadius: 8,
                  padding: 12,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={filter.icon as any}
                  size={16}
                  color={selectedFilter === filter.key ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280')}
                  style={{ marginRight: 4 }}
                />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: selectedFilter === filter.key ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280')
                }}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Issues List */}
          {filteredIssues.length === 0 ? (
            <View style={{
              alignItems: 'center',
              padding: 40,
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderRadius: 12,
            }}>
              <Ionicons
                name="document-outline"
                size={48}
                color={isDark ? '#6b7280' : '#9ca3af'}
              />
              <Text style={{
                marginTop: 16,
                fontSize: 16,
                color: isDark ? '#9ca3af' : '#6b7280',
                textAlign: 'center'
              }}>
                {selectedFilter === 'all' ? 'No issues reported yet' : `No ${selectedFilter.toLowerCase()} issues`}
              </Text>
              <Text style={{
                marginTop: 8,
                fontSize: 14,
                color: isDark ? '#6b7280' : '#9ca3af',
                textAlign: 'center'
              }}>
                {selectedFilter === 'all' 
                  ? 'Start by reporting a civic issue in your area'
                  : 'Issues with this status will appear here'
                }
              </Text>
            </View>
          ) : (
            filteredIssues.map((issue) => (
              <View
                key={issue.id}
                style={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: isDark ? '#ffffff' : '#111827',
                    flex: 1
                  }}>
                    {issue.title}
                  </Text>
                  <View style={{
                    backgroundColor: getPriorityColor(issue.priority),
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    marginLeft: 8,
                  }}>
                    <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '500' }}>
                      {issue.priority}
                    </Text>
                  </View>
                </View>

                <Text style={{
                  fontSize: 14,
                  color: isDark ? '#9ca3af' : '#6b7280',
                  marginBottom: 8,
                  lineHeight: 20
                }}>
                  {issue.description.length > 100 ? `${issue.description.substring(0, 100)}...` : issue.description}
                </Text>

                {/* Images Preview */}
                {issue.image_urls && issue.image_urls.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    {issue.image_urls.slice(0, 3).map((url, index) => (
                      <Image
                        key={index}
                        source={{ uri: url }}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          marginRight: 8
                        }}
                      />
                    ))}
                    {issue.image_urls.length > 3 && (
                      <View style={{
                        width: 60,
                        height: 60,
                        borderRadius: 8,
                        backgroundColor: isDark ? '#374151' : '#f3f4f6',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Text style={{
                          fontSize: 12,
                          color: isDark ? '#9ca3af' : '#6b7280',
                          fontWeight: '600'
                        }}>
                          +{issue.image_urls.length - 3}
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{
                      backgroundColor: getStatusColor(issue.status),
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}>
                      <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '500' }}>
                        {issue.status}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: isDark ? '#374151' : '#f3f4f6',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}>
                      <Text style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}>
                        {issue.category}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af' }}>
                    {new Date(issue.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
