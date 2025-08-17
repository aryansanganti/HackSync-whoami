import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CivicIssue, IssueStatus } from '../../types';

interface Props {
    visible: boolean;
    onClose: () => void;
    issue: CivicIssue;
    isDark: boolean;
    getPriorityColor: (priority: string) => string;
    getStatusColor: (status: IssueStatus) => string;
}

export function IssueDetailModal({
    visible,
    onClose,
    issue,
    isDark,
    getPriorityColor,
    getStatusColor
}: Props) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
                <ScrollView style={{ flex: 1 }}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                            Issue Details
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.closeButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}
                        >
                            <Ionicons name="close" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.issueDetailContent}>
                        <Text style={[styles.issueTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                            {issue.title}
                        </Text>

                        <View style={styles.issueBadges}>
                            <View style={[styles.issueBadge, { backgroundColor: getPriorityColor(issue.priority) }]}>
                                <Text style={styles.issueBadgeText}>{issue.priority} Priority</Text>
                            </View>
                            <View style={[styles.issueBadge, { backgroundColor: getStatusColor(issue.status) }]}>
                                <Text style={styles.issueBadgeText}>{issue.status}</Text>
                            </View>
                            <View style={[styles.issueBadge, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                <Text style={[styles.issueBadgeText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                    {issue.category}
                                </Text>
                            </View>
                        </View>

                        <Text style={[styles.issueDescription, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                            {issue.description}
                        </Text>

                        <View style={styles.issueLocation}>
                            <Ionicons name="location" size={20} color={isDark ? '#60a5fa' : '#3b82f6'} />
                            <Text style={[styles.issueLocationText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                {issue.address}
                            </Text>
                        </View>

                        <Text style={[styles.issueDate, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
                            Reported on {new Date(issue.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
    },
    issueDetailContent: {
        padding: 20,
    },
    issueTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    issueBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    issueBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    issueBadgeText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '500',
    },
    issueDescription: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 16,
    },
    issueLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    issueLocationText: {
        fontSize: 14,
        flex: 1,
    },
    issueDate: {
        fontSize: 12,
        fontStyle: 'italic',
    },
});
