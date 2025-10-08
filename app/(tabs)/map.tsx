import { IssueDetailModal } from '@/components/map/IssueDetailModal';
import { IssueFiltersModal } from '@/components/map/IssueFiltersModal';
import { MapLegend } from '@/components/map/MapLegend';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from '@/hooks/useLocation';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Heatmap, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import SupabaseService from '../../lib/supabase-service';
import { CivicIssue, IssueCategory, IssueStatus } from '../../types';

interface FilterState {
  category?: IssueCategory;
  priority?: 'Low' | 'Medium' | 'High';
  status?: IssueStatus;
  showHeatmap: boolean;
}

type Priority = 'Low' | 'Medium' | 'High';

const { width, height } = Dimensions.get('window');

const getPriorityColor = (priority: Priority): string => {
  const colors: Record<Priority, string> = {
    'Low': '#10b981',
    'Medium': '#f59e0b',
    'High': '#ef4444',
  };
  return colors[priority];
};

const getStatusColor = (status: IssueStatus, isDark: boolean): string => {
  const colors: Record<IssueStatus, { light: string; dark: string }> = {
    'Pending': { dark: '#f59e0b', light: '#d97706' },
    'In Progress': { dark: '#3b82f6', light: '#3b82f6' },
    'Resolved': { dark: '#10b981', light: '#059669' },
  };
  
  // Safety check for undefined/null status
  if (!status || !colors[status]) {
    return isDark ? colors['Pending'].dark : colors['Pending'].light;
  }
  
  return isDark ? colors[status].dark : colors[status].light;
};

const getCategoryIcon = (category: IssueCategory): keyof typeof Ionicons.glyphMap => {
  const icons: Record<IssueCategory, keyof typeof Ionicons.glyphMap> = {
    'Roads': 'car',
    'Sanitation': 'trash',
    'Electricity': 'flash',
    'Water Supply': 'water',
    'Public Safety': 'shield',
    'Others': 'help-circle',
  };
  
  // Safety check for undefined/null category
  if (!category || !icons[category]) {
    return 'help-circle';
  }
  
  return icons[category];
};

export default function MapScreen() {
  const { isDark } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [issueDetailModalVisible, setIssueDetailModalVisible] = useState(false);

  // Location handling
  const {
    userLocation,
    region,
    isLoading: locationLoading,
    error: locationError,
    getCurrentLocation
  } = useLocation();

  const [filters, setFilters] = useState<FilterState>({
    showHeatmap: false,
  });

  // Load saved filters from storage
  useEffect(() => {
    AsyncStorage.getItem('mapFilters').then(savedFilters => {
      if (savedFilters) {
        setFilters(JSON.parse(savedFilters));
      }
    });
  }, []);

  // Save filters to storage when they change
  useEffect(() => {
    AsyncStorage.setItem('mapFilters', JSON.stringify(filters));
  }, [filters]);

  // Subscribe to real-time updates
  useEffect(() => {
    loadIssues();

    const subscription = SupabaseService.subscribeToIssues((payload) => {
      console.log('Real-time update:', payload);
      loadIssues();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Memoized filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (filters.category && issue.category !== filters.category) return false;
      if (filters.priority && issue.priority !== filters.priority) return false;
      if (filters.status && issue.status !== filters.status) return false;
      return true;
    });
  }, [issues, filters]);

  const handleRegionChange = useCallback((newRegion: Region) => {
    // Update region without causing re-renders of unaffected components
  }, []);

  const loadIssues = async () => {
    try {
      const data = await SupabaseService.getPublicIssues();
      // Only update if data has changed
      if (JSON.stringify(data) !== JSON.stringify(issues)) {
        setIssues(data);
      }
    } catch (error) {
      console.error('Error loading issues:', error);
      Alert.alert('Error', 'Failed to load civic issues');
    }
  };

  const handleMapError = (error: any) => {
    console.error('Map error:', error);
    setMapError('Unable to load map. Please check your internet connection.');
  };

  const retryMap = () => {
    setMapError(null);
    getCurrentLocation();
    loadIssues();
  };

  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  };

  const openIssueDetail = (issue: CivicIssue) => {
    setSelectedIssue(issue);
    setIssueDetailModalVisible(true);
  };

  if (mapError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="map-outline"
            size={64}
            color={isDark ? '#6b7280' : '#9ca3af'}
          />
          <Text style={[styles.errorTitle, { color: isDark ? '#ffffff' : '#111827' }]}>
            Map Unavailable
          </Text>
          <Text style={[styles.errorMessage, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            {mapError}
          </Text>
          <TouchableOpacity
            onPress={retryMap}
            style={[styles.retryButton, { backgroundColor: isDark ? '#3b82f6' : '#3b82f6' }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Prepare heatmap data
  const heatmapData = useMemo(() => {
    if (!filters.showHeatmap) return [];
    return filteredIssues.map(issue => ({
      latitude: issue.latitude,
      longitude: issue.longitude,
      weight: issue.priority === 'High' ? 1.0 : issue.priority === 'Medium' ? 0.7 : 0.4,
    }));
  }, [filteredIssues, filters.showHeatmap]);

  return (
    <View style={styles.container}>
      <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={true}
        showsMyLocationButton={false}
        provider={PROVIDER_GOOGLE}
        mapType={isDark ? 'satellite' : 'standard'}
        loadingEnabled={true}
        loadingIndicatorColor={isDark ? '#60a5fa' : '#3b82f6'}
        loadingBackgroundColor={isDark ? '#1f2937' : '#ffffff'}
      >
        {/* Heatmap Layer */}
        {filters.showHeatmap && heatmapData.length > 0 && (
        <Heatmap
          points={heatmapData}
          radius={50}
          opacity={0.7}
          gradient={{
          colors: ['#00ff00', '#ffff00', '#ff0000'],
          startPoints: [0.2, 0.5, 1.0],
          colorMapSize: 256
          }}
        />
        )}

        {/* Issue Markers */}
        {!filters.showHeatmap && filteredIssues.map((issue) => (
        <Marker
          key={issue.id}
          coordinate={{
          latitude: issue.latitude,
          longitude: issue.longitude,
          }}
          pinColor={getPriorityColor(issue.priority as Priority)}
          onPress={() => openIssueDetail(issue)}
        >
          <Callout>
          <View style={styles.callout}>
            <View style={styles.calloutHeader}>
            <Ionicons
              name={getCategoryIcon(issue.category)}
              size={16}
              color={getPriorityColor(issue.priority as Priority)}
            />
            <Text style={styles.calloutTitle}>{issue.title}</Text>
            </View>
            <Text style={styles.calloutDescription}>{issue.description}</Text>
            <View style={styles.calloutFooter}>
            <View style={[styles.calloutBadge, { backgroundColor: getPriorityColor(issue.priority as Priority) }]}>
              <Text style={styles.calloutBadgeText}>{issue.priority}</Text>
            </View>
            <View style={[styles.calloutBadge, { backgroundColor: getStatusColor(issue.status, isDark) }]}>
              <Text style={styles.calloutBadgeText}>{issue.status}</Text>
            </View>
            </View>
          </View>
          </Callout>
        </Marker>
        ))}
      </MapView>

      {/* Control Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity
        style={[styles.controlButton, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
        onPress={centerOnUserLocation}
        >
        <Ionicons name="locate" size={24} color={isDark ? '#60a5fa' : '#3b82f6'} />
        </TouchableOpacity>

        <TouchableOpacity
        style={[styles.controlButton, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
        onPress={() => setFilterModalVisible(true)}
        >
        <Ionicons name="filter" size={24} color={isDark ? '#60a5fa' : '#3b82f6'} />
        </TouchableOpacity>
      </View>

      <MapLegend isDark={isDark} />

      <IssueFiltersModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        setFilters={setFilters}
        isDark={isDark}
      />

      {selectedIssue && (
        <IssueDetailModal
        visible={issueDetailModalVisible}
        onClose={() => setIssueDetailModalVisible(false)}
        issue={selectedIssue}
        isDark={isDark}
        getPriorityColor={(priority: string) => getPriorityColor(priority as Priority)}
        getStatusColor={(status: IssueStatus) => getStatusColor(status, isDark)}
        />
      )}

      {locationLoading && (
        <View style={[styles.loadingOverlay, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
        <Text style={[styles.loadingText, { color: isDark ? '#ffffff' : '#111827' }]}>
          Loading map...
        </Text>
        </View>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 40,
    right: 20,
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  callout: {
    width: 250,
    padding: 12,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  calloutDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 16,
  },
  calloutFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  calloutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  calloutBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
