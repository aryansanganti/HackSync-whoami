import { useTheme } from '@/contexts/ThemeContext';
import { RoleManager, UserRole } from '@/lib/roleManager';
import { Session, supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LanguageSelector from '../../components/LanguageSelector';

interface User {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role?: UserRole;
}

export default function ProfileScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const userRole = await RoleManager.detectUserRole(session.user.email || null);
        setUser({
          displayName: session.user.user_metadata?.full_name ?? null,
          email: session.user.email ?? null,
          photoURL: session.user.user_metadata?.avatar_url ?? null,
          role: userRole,
        });
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, s) => {
      setSession(s);
      if (s?.user) {
        const userRole = await RoleManager.detectUserRole(s.user.email || null);
        setUser({
          displayName: s.user.user_metadata?.full_name ?? null,
          email: s.user.email ?? null,
          photoURL: s.user.user_metadata?.avatar_url ?? null,
          role: userRole,
        });
      } else {
        setUser(null);
      }
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
      title: t('profile.account'),
      icon: 'person-outline',
      onPress: () => user ? null : handleSignIn,
      showArrow: true,
    },
    {
      title: t('profile.notifications'),
      icon: 'notifications-outline',
      onPress: () => setNotificationsEnabled(!notificationsEnabled),
      showSwitch: true,
      switchValue: notificationsEnabled,
    },
    {
      title: t('profile.locationServices'),
      icon: 'location-outline',
      onPress: () => setLocationEnabled(!locationEnabled),
      showSwitch: true,
      switchValue: locationEnabled,
    },
    {
      title: t('profile.darkMode'),
      icon: 'moon-outline',
      onPress: toggleTheme,
      showSwitch: true,
      switchValue: isDark,
    },
    {
      title: t('profile.privacyPolicy'),
      icon: 'shield-outline',
      onPress: () => Alert.alert(t('profile.privacyPolicy'), t('profile.privacyPolicyComingSoon')),
      showArrow: true,
    },
    {
      title: t('profile.termsOfService'),
      icon: 'document-text-outline',
      onPress: () => Alert.alert(t('profile.termsOfService'), t('profile.termsOfServiceComingSoon')),
      showArrow: true,
    },
    {
      title: t('profile.about'),
      icon: 'information-circle-outline',
      onPress: () => Alert.alert(t('profile.about'), `${t('profile.appName')} ${t('profile.version')}\n${t('profile.appDescription')}`),
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
            {t('profile.title')}
          </Text>
          <Text style={{
            fontSize: 16,
            color: isDark ? '#9ca3af' : '#6b7280',
            marginBottom: 30
          }}>
            {t('profile.manageAccount')}
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
                  marginBottom: 8
                }}>
                  {user.email}
                </Text>

                {/* Role Badge */}
                <View style={{
                  backgroundColor: user.role === 'officer' ? (isDark ? '#059669' : '#10b981') : (isDark ? '#3b82f6' : '#3b82f6'),
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  marginBottom: 16,
                }}>
                  <Text style={{
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                  }}>
                    {user.role ? `${RoleManager.getRoleIcon(user.role)} ${RoleManager.getRoleDisplayName(user.role)}` : '👤 Citizen'}
                  </Text>
                </View>

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
                      {t('profile.signOut')}
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
                      {t('profile.editProfile')}
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
                  {t('profile.guestUser')}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: isDark ? '#9ca3af' : '#6b7280',
                  marginBottom: 16
                }}>
                  {t('profile.signInToAccess')}
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
                    {t('profile.signInWithGoogle')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Language Selector */}
          <View style={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}>
            <LanguageSelector />
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
              {t('profile.appName')} v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}