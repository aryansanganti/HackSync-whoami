import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SupabaseService from '../../lib/supabase-service';
import { CivicIssue, IssueCategory, IssueStatus } from '../../types';

interface FilterState {
    category?: IssueCategory;
    priority?: 'Low' | 'Medium' | 'High';
    status?: IssueStatus;
}

export default function AllIssuesScreen() {
    const { isDark } = useTheme();
    const [issues, setIssues] = useState<CivicIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [filters, setFilters] = useState<FilterState>({});
    const [stats, setStats] = useState<any>({});
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<IssueStatus | 'all'>('all');

    useEffect(() => {
        loadIssues();
        loadStats();

        const subscription = SupabaseService.subscribeToIssues(() => {
            loadIssues();
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [filters]);

    const loadIssues = async () => {
        try {
            const data = await SupabaseService.getPublicIssues(filters);
            setIssues(data);
        } catch (error) {
            console.error('Error loading issues:', error);
            Alert.alert('Error', 'Failed to load issues');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadStats = async () => {
        try {
            const statsData = await SupabaseService.getIssueStats();
            setStats(statsData);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleStatusUpdate = async (issueId: string, newStatus: IssueStatus) => {
        try {
            const success = await SupabaseService.updateIssueStatus(issueId, newStatus);
            if (success) {
                setIssues(prev => prev.map(issue =>
                    issue.id === issueId ? { ...issue, status: newStatus } : issue
                ));
                if (selectedIssue?.id === issueId) {
                    setSelectedIssue(prev => prev ? { ...prev, status: newStatus } : null);
                }
                Alert.alert('Success', `Issue status updated to ${newStatus}`);
            } else {
                Alert.alert('Error', 'Failed to update issue status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            Alert.alert('Error', 'Failed to update issue status');
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        loadIssues();
        loadStats();
    }, [filters]);

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

    const filters_ui: { key: IssueStatus | 'all'; label: string; icon: string }[] = [
        { key: 'all', label: 'All', icon: 'list' },
        { key: 'Pending', label: 'Pending', icon: 'time' },
        { key: 'In Progress', label: 'In Progress', icon: 'construct' },
        { key: 'Resolved', label: 'Resolved', icon: 'checkmark-circle' },
    ];

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={{ marginTop: 16, color: isDark ? '#9ca3af' : '#6b7280' }}>Loading issues...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
            <ScrollView
                style={{ flex: 1 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={{ padding: 20 }}>
                    <Text style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: isDark ? '#ffffff' : '#111827',
                        marginBottom: 8
                    }}>
                        All issues
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        color: isDark ? '#9ca3af' : '#6b7280',
                        marginBottom: 20
                    }}>
                        Manage civic issues and track progress
                    </Text>

                    {/* Stats Cards */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                        <View style={{ flex: 1, backgroundColor: isDark ? '#1f2937' : '#ffffff', borderRadius: 12, padding: 16, marginRight: 8, alignItems: 'center' }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? '#f59e0b' : '#d97706' }}>
                                {stats.byStatus?.Pending || 0}
                            </Text>
                            <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>Pending</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: isDark ? '#1f2937' : '#ffffff', borderRadius: 12, padding: 16, marginHorizontal: 4, alignItems: 'center' }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#3b82f6' }}>
                                {stats.byStatus?.['In Progress'] || 0}
                            </Text>
                            <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>In Progress</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: isDark ? '#1f2937' : '#ffffff', borderRadius: 12, padding: 16, marginLeft: 8, alignItems: 'center' }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? '#10b981' : '#059669' }}>
                                {stats.byStatus?.Resolved || 0}
                            </Text>
                            <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>Resolved</Text>
                        </View>
                    </View>

                    {/* Filter Tabs */}
                    <View style={{ flexDirection: 'row', backgroundColor: isDark ? '#1f2937' : '#ffffff', borderRadius: 12, padding: 4, marginBottom: 20 }}>
                        {filters_ui.map((filter) => (
                            <TouchableOpacity
                                key={filter.key}
                                onPress={() => setSelectedFilter(filter.key)}
                                style={{
                                    flex: 1,
                                    backgroundColor: selectedFilter === filter.key ? '#3b82f6' : 'transparent',
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
                                <Text style={{ fontSize: 12, fontWeight: '500', color: selectedFilter === filter.key ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280') }}>
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Issues List */}
                    {issues.length === 0 ? (
                        <View style={{ alignItems: 'center', padding: 40, backgroundColor: isDark ? '#1f2937' : '#ffffff', borderRadius: 12 }}>
                            <Ionicons name="shield-outline" size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
                            <Text style={{ marginTop: 16, fontSize: 16, color: isDark ? '#9ca3af' : '#6b7280', textAlign: 'center' }}>
                                No issues found
                            </Text>
                            <Text style={{ marginTop: 8, fontSize: 14, color: isDark ? '#6b7280' : '#9ca3af', textAlign: 'center' }}>
                                Issues will appear here as they are reported
                            </Text>
                        </View>
                    ) : (
                        issues
                            .filter(issue => selectedFilter === 'all' || issue.status === selectedFilter)
                            .map((issue) => (
                                <TouchableOpacity
                                    key={issue.id}
                                    style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12 }}
                                    onPress={() => {
                                        setSelectedIssue(issue);
                                        setModalVisible(true);
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#ffffff' : '#111827', flex: 1 }}>
                                            {issue.title}
                                        </Text>
                                        <View style={{ backgroundColor: getPriorityColor(issue.priority), paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 8 }}>
                                            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '500' }}>
                                                {issue.priority}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280', marginBottom: 8, lineHeight: 20 }}>
                                        {issue.description.length > 100 ? `${issue.description.substring(0, 100)}...` : issue.description}
                                    </Text>

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <View style={{ backgroundColor: getStatusColor(issue.status), paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                                                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '500' }}>
                                                    {issue.status}
                                                </Text>
                                            </View>
                                            <View style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                                                <Text style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}>
                                                    {issue.category}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af' }}>
                                            {new Date(issue.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                    )}
                </View>
            </ScrollView>

            {/* Issue Detail Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
                    {selectedIssue && (
                        <ScrollView style={{ flex: 1 }}>
                            {/* Modal Header */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#e5e7eb' }}>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? '#ffffff' : '#111827', flex: 1 }}>
                                    Issue Details
                                </Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 8, borderRadius: 20, backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
                                    <Ionicons name="close" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ padding: 20 }}>
                                {/* Title */}
                                <Text style={{ fontSize: 18, fontWeight: '600', color: isDark ? '#ffffff' : '#111827', marginBottom: 16 }}>
                                    {selectedIssue.title}
                                </Text>

                                {/* Badges */}
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                    <View style={{ backgroundColor: getPriorityColor(selectedIssue.priority), paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                                        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                                            {selectedIssue.priority} Priority
                                        </Text>
                                    </View>

                                    <View style={{ backgroundColor: getStatusColor(selectedIssue.status), paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                                        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                                            {selectedIssue.status}
                                        </Text>
                                    </View>

                                    <View style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                                        <Text style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 14 }}>
                                            {selectedIssue.category}
                                        </Text>
                                    </View>
                                </View>

                                {/* Description */}
                                <View style={{ marginBottom: 20 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#ffffff' : '#111827', marginBottom: 8 }}>
                                        Description
                                    </Text>
                                    <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280', lineHeight: 20 }}>
                                        {selectedIssue.description}
                                    </Text>
                                </View>

                                {/* Location */}
                                <View style={{ marginBottom: 20 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#ffffff' : '#111827', marginBottom: 8 }}>
                                        📍 Location
                                    </Text>
                                    <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' }}>
                                        {selectedIssue.address}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: isDark ? '#6b7280' : '#9ca3af', marginTop: 4 }}>
                                        {selectedIssue.latitude.toFixed(6)}, {selectedIssue.longitude.toFixed(6)}
                                    </Text>
                                </View>

                                {/* Images */}
                                {selectedIssue.image_urls && selectedIssue.image_urls.length > 0 && (
                                    <View style={{ marginBottom: 20 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#ffffff' : '#111827', marginBottom: 8 }}>
                                            📸 Images
                                        </Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            {selectedIssue.image_urls.map((url, index) => (
                                                <Image
                                                    key={index}
                                                    source={{ uri: url }}
                                                    style={{ width: 120, height: 120, borderRadius: 8, marginRight: 8 }}
                                                />
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}

                                {/* Status Update Actions */}
                                <View style={{ marginBottom: 20 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#ffffff' : '#111827', marginBottom: 12 }}>
                                        Update Status
                                    </Text>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        {(['Pending', 'In Progress', 'Resolved'] as IssueStatus[]).map(status => (
                                            <TouchableOpacity
                                                key={status}
                                                onPress={() => handleStatusUpdate(selectedIssue.id, status)}
                                                disabled={selectedIssue.status === status}
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: selectedIssue.status === status ? getStatusColor(status) : (isDark ? '#374151' : '#f3f4f6'),
                                                    paddingVertical: 12,
                                                    borderRadius: 8,
                                                    alignItems: 'center',
                                                    opacity: selectedIssue.status === status ? 0.7 : 1
                                                }}
                                            >
                                                <Text style={{ color: selectedIssue.status === status ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280'), fontSize: 14, fontWeight: '500' }}>
                                                    {status}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Metadata */}
                                <View style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#ffffff' : '#111827', marginBottom: 8 }}>
                                        Issue Information
                                    </Text>
                                    <View style={{ gap: 4 }}>
                                        <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>
                                            Issue ID: {selectedIssue.id}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>
                                            Reporter: {selectedIssue.is_anonymous ? 'Anonymous' : selectedIssue.reporter_id}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>
                                            Created: {new Date(selectedIssue.created_at).toLocaleString()}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>
                                            Updated: {new Date(selectedIssue.updated_at).toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}