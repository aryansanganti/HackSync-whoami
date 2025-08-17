import { useTheme } from '@/contexts/ThemeContext';
import { RoleManager, UserRole } from '@/lib/roleManager';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { TouchableOpacity } from 'react-native';

export default function TabLayout() {
  const { isDark, toggleTheme } = useTheme();
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

  // Citizen-visible when unauthenticated or not officer/admin
  const isOfficer = RoleManager.canAccessOfficerFeatures((userRole || 'citizen'));
  const showCitizenTabs = !isOfficer;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#60a5fa' : '#3b82f6',
        tabBarInactiveTintColor: isDark ? '#6b7280' : '#9ca3af',
        tabBarStyle: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderTopColor: isDark ? '#374151' : '#e5e7eb',
        },
        headerStyle: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
        },
        headerTintColor: isDark ? '#ffffff' : '#000000',
        headerRight: () => (
          <TouchableOpacity
            onPress={toggleTheme}
            style={{
              marginRight: 16,
              padding: 8,
              borderRadius: 20,
              backgroundColor: isDark ? '#374151' : '#f3f4f6',
            }}
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={20}
              color={isDark ? '#fbbf24' : '#6b7280'}
            />
          </TouchableOpacity>
        ),
      }}>
      {/* Declare every screen once; control visibility with href */}
      <Tabs.Screen
        name="index"
        options={{
          href: showCitizenTabs ? undefined : null,
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* Place officer first (hidden for citizens) so Map becomes second visible for both roles */}
      <Tabs.Screen
        name="officer"
        options={{
          href: showCitizenTabs ? null : undefined,
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'shield' : 'shield-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* Map: second visible tab for both roles */}
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* Officer-only: appears after Map for officers */}
      <Tabs.Screen
        name="all-issues"
        options={{
          href: showCitizenTabs ? null : undefined,
          title: 'All Issues',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* Citizen-only tabs follow */}
      <Tabs.Screen
        name="community"
        options={{
          href: showCitizenTabs ? undefined : null,
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* Hidden from tab bar but route remains */}
      <Tabs.Screen
        name="my-issues"
        options={{
          href: null,
          title: 'My Issues',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* Common Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
} 