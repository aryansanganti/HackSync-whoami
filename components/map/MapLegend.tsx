import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
    isDark: boolean;
}

export function MapLegend({ isDark }: Props) {
    return (
        <View style={[styles.legend, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
            <Text style={[styles.legendTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
                Issue Priority
            </Text>
            <View style={styles.legendItems}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                    <Text style={[styles.legendText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        Low
                    </Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                    <Text style={[styles.legendText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        Medium
                    </Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                    <Text style={[styles.legendText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        High
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    legend: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    legendTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    legendItems: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
    },
});
