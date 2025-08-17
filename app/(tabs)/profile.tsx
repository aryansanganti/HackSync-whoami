import { Session, supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

interface User {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export default function ProfileScreen() {
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ? {
        displayName: session.user.user_metadata?.full_name ?? null,
        email: session.user.email ?? null,
        photoURL: session.user.user_metadata?.avatar_url ?? null,
      } : null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setUser(s?.user ? {
        displayName: s.user.user_metadata?.full_name ?? null,
        email: s.user.email ?? null,
        photoURL: s.user.user_metadata?.avatar_url ?? null,
      } : null);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const handleSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  const handleSignOut = async () => {
    try {
      await AsyncStorage.removeItem('guest');
      await supabase.auth.signOut(); // Supabase automatically clears session from SecureStore
      console.log('📱 User signed out and session cleared');
    } catch (error) {
      console.error('📱 Error during sign out:', error);
    }
  };

  const menuItems = [
    {
      title: 'Account',
      icon: 'person-outline',
      onPress: () => user ? null : handleSignIn,
      showArrow: true,
    },
    {
      title: 'Notifications',
      icon: 'notifications-outline',
      onPress: () => setNotificationsEnabled(!notificationsEnabled),
      showSwitch: true,
      switchValue: notificationsEnabled,
    },
    {
      title: 'Location Services',
      icon: 'location-outline',
      onPress: () => setLocationEnabled(!locationEnabled),
      showSwitch: true,
      switchValue: locationEnabled,
    },
    {
      title: 'Dark Mode',
      icon: 'moon-outline',
      onPress: toggleTheme,
      showSwitch: true,
      switchValue: isDark,
    },
    {
      title: 'Language',
      icon: 'language-outline',
      onPress: () => Alert.alert('Language', 'Language settings coming soon'),
      showArrow: true,
    },
    {
      title: 'Privacy Policy',
      icon: 'shield-outline',
      onPress: () => Alert.alert('Privacy Policy', 'Privacy policy coming soon'),
      showArrow: true,
    },
    {
      title: 'Terms of Service',
      icon: 'document-text-outline',
      onPress: () => Alert.alert('Terms of Service', 'Terms of service coming soon'),
      showArrow: true,
    },
    {
      title: 'About',
      icon: 'information-circle-outline',
      onPress: () => Alert.alert('About', 'Civic AI v1.0.0\nEmpowering citizens to report civic issues'),
      showArrow: true,
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: isDark ? '#ffffff' : '#111827' }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 20 }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: isDark ? '#ffffff' : '#111827',
            marginBottom: 8
          }}>
            Profile
          </Text>
          <Text style={{
            fontSize: 16,
            color: isDark ? '#9ca3af' : '#6b7280',
            marginBottom: 30
          }}>
            Manage your account and preferences
          </Text>

          {/* User Info Card */}
          <View style={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            alignItems: 'center',
          }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: isDark ? '#374151' : '#f3f4f6',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              {user?.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                />
              ) : (
                <Ionicons
                  name="person"
                  size={40}
                  color={isDark ? '#9ca3af' : '#6b7280'}
                />
              )}
            </View>

            {user ? (
              <>
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: isDark ? '#ffffff' : '#111827',
                  marginBottom: 4
                }}>
                  {user.displayName || 'User'}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: isDark ? '#9ca3af' : '#6b7280',
                  marginBottom: 16
                }}>
                  {user.email}
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={handleSignOut}
                    style={{
                      backgroundColor: isDark ? '#ef4444' : '#dc2626',
                      paddingHorizontal: 20,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                      Sign Out
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      backgroundColor: isDark ? '#3b82f6' : '#3b82f6',
                      paddingHorizontal: 20,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                      Edit Profile
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: isDark ? '#ffffff' : '#111827',
                  marginBottom: 4
                }}>
                  Guest User
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: isDark ? '#9ca3af' : '#6b7280',
                  marginBottom: 16
                }}>
                  Sign in to access all features
                </Text>
                <TouchableOpacity
                  onPress={handleSignIn}
                  style={{
                    backgroundColor: isDark ? '#3b82f6' : '#3b82f6',
                    paddingHorizontal: 20,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                    Sign In with Google
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Menu Items */}
          <View style={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.title}
                onPress={item.onPress}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                  borderBottomColor: isDark ? '#374151' : '#f3f4f6',
                }}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={isDark ? '#9ca3af' : '#6b7280'}
                  style={{ marginRight: 12 }}
                />
                <Text style={{
                  flex: 1,
                  fontSize: 16,
                  color: isDark ? '#ffffff' : '#111827'
                }}>
                  {item.title}
                </Text>
                {item.showSwitch && (
                  <Switch
                    value={item.switchValue}
                    onValueChange={item.onPress}
                    trackColor={{ false: isDark ? '#374151' : '#e5e7eb', true: isDark ? '#3b82f6' : '#3b82f6' }}
                    thumbColor={item.switchValue ? '#ffffff' : '#ffffff'}
                  />
                )}
                {item.showArrow && (
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={isDark ? '#6b7280' : '#9ca3af'}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* App Version */}
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{
              fontSize: 12,
              color: isDark ? '#6b7280' : '#9ca3af'
            }}>
              Civic AI v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 