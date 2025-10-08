import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IssueCategory, IssueStatus } from '../../types';

interface FilterState {
    category?: IssueCategory;
    priority?: 'Low' | 'Medium' | 'High';
    status?: IssueStatus;
    showHeatmap: boolean;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
    isDark: boolean;
}

export function IssueFiltersModal({ visible, onClose, filters, setFilters, isDark }: Props) {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                        Map Filters
                    </Text>
                    <TouchableOpacity
                        onPress={onClose}
                        style={[styles.closeButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}
                    >
                        <Ionicons name="close" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    {/* Category Filter */}
                    <View style={styles.filterSection}>
                        <Text style={[styles.filterLabel, { color: isDark ? '#d1d5db' : '#374151' }]}>
                            Category
                        </Text>
                        <View style={styles.filterOptions}>
                            {(['Roads', 'Sanitation', 'Electricity', 'Water Supply', 'Public Safety', 'Others'] as IssueCategory[]).map((category) => (
                                <TouchableOpacity
                                    key={category}
                                    style={[
                                        styles.filterOption,
                                        filters.category === category && { backgroundColor: isDark ? '#3b82f6' : '#3b82f6' }
                                    ]}
                                    onPress={() => setFilters({
                                        ...filters,
                                        category: filters.category === category ? undefined : category
                                    })}
                                >
                                    <Text style={[
                                        styles.filterOptionText,
                                        { color: filters.category === category ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280') }
                                    ]}>
                                        {category}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Priority Filter */}
                    <View style={styles.filterSection}>
                        <Text style={[styles.filterLabel, { color: isDark ? '#d1d5db' : '#374151' }]}>
                            Priority
                        </Text>
                        <View style={styles.filterOptions}>
                            {(['Low', 'Medium', 'High'] as const).map((priority) => (
                                <TouchableOpacity
                                    key={priority}
                                    style={[
                                        styles.filterOption,
                                        filters.priority === priority && { backgroundColor: isDark ? '#3b82f6' : '#3b82f6' }
                                    ]}
                                    onPress={() => setFilters({
                                        ...filters,
                                        priority: filters.priority === priority ? undefined : priority
                                    })}
                                >
                                    <Text style={[
                                        styles.filterOptionText,
                                        { color: filters.priority === priority ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280') }
                                    ]}>
                                        {priority}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Status Filter */}
                    <View style={styles.filterSection}>
                        <Text style={[styles.filterLabel, { color: isDark ? '#d1d5db' : '#374151' }]}>
                            Status
                        </Text>
                        <View style={styles.filterOptions}>
                            {(['Pending', 'In Progress', 'Resolved'] as IssueStatus[]).map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={[
                                        styles.filterOption,
                                        filters.status === status && { backgroundColor: isDark ? '#3b82f6' : '#3b82f6' }
                                    ]}
                                    onPress={() => setFilters({
                                        ...filters,
                                        status: filters.status === status ? undefined : status
                                    })}
                                >
                                    <Text style={[
                                        styles.filterOptionText,
                                        { color: filters.status === status ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280') }
                                    ]}>
                                        {status}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Heatmap Toggle */}
                    <View style={styles.filterSection}>
                        <View style={styles.filterToggle}>
                            <Text style={[styles.filterLabel, { color: isDark ? '#d1d5db' : '#374151' }]}>
                                Show Heatmap
                            </Text>
                            <TouchableOpacity
                                style={[
                                    styles.toggleButton,
                                    { backgroundColor: filters.showHeatmap ? '#3b82f6' : (isDark ? '#374151' : '#d1d5db') }
                                ]}
                                onPress={() => setFilters({ ...filters, showHeatmap: !filters.showHeatmap })}
                            >
                                <Ionicons
                                    name={filters.showHeatmap ? 'checkmark' : 'close'}
                                    size={16}
                                    color="#ffffff"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Clear Filters */}
                    <TouchableOpacity
                        style={[styles.clearFiltersButton, { backgroundColor: isDark ? '#ef4444' : '#dc2626' }]}
                        onPress={() => setFilters({ 
                            category: undefined, 
                            priority: undefined, 
                            status: undefined, 
                            showHeatmap: false 
                        })}
                    >
                        <Text style={styles.clearFiltersText}>Clear All Filters</Text>
                    </TouchableOpacity>
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
    modalContent: {
        flex: 1,
        padding: 20,
    },
    filterSection: {
        marginBottom: 24,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    filterOptionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    filterToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleButton: {
        width: 40,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearFiltersButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    clearFiltersText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});
