
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { initI18n } from '@/lib/i18n';
import notificationService from '@/lib/notificationService';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';

function RootLayoutContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    // Listen for auth state changes - Supabase handles session persistence automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      if (session) {
        // Initialize push notifications when a session is active
        notificationService.initialize().catch((e) => console.warn('Notification init failed:', e));
        // Persisted or new session: go to main app
        router.replace('/(tabs)');
      } else {
        // No session: return to auth flow
        router.replace('/(auth)/sign-in');
      }
    });

    const getInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url) handleDeepLink({ url });
    };

    const handleDeepLink = async ({ url }: { url: string }) => {
      console.log('🔗 Deep link received:', url);

      const { queryParams, path } = Linking.parse(url);
      console.log('🔗 Query params:', queryParams);
      console.log('🔗 Path:', path);

      // Handle OAuth callback - Check for auth-callback path or access_token presence
      if (url.includes('auth-callback') || url.includes('access_token')) {
        console.log('🔗 Processing OAuth callback');

        try {
          // Extract tokens from URL - they can be in hash, query params, or direct URL
          let accessToken, refreshToken;

          // Method 1: Check query params first
          if (queryParams?.access_token) {
            accessToken = queryParams.access_token;
            refreshToken = queryParams.refresh_token;
          }

          // Method 2: Check URL hash
          if (!accessToken && url.includes('#')) {
            const urlObj = new URL(url.replace('civicai://', 'https://dummy.com/'));
            const hash = urlObj.hash.substring(1);
            const hashParams = new URLSearchParams(hash);
            accessToken = hashParams.get('access_token');
            refreshToken = hashParams.get('refresh_token');
          }

          // Method 3: Check URL search params
          if (!accessToken && url.includes('?')) {
            const urlObj = new URL(url.replace('civicai://', 'https://dummy.com/'));
            const searchParams = new URLSearchParams(urlObj.search);
            accessToken = searchParams.get('access_token');
            refreshToken = searchParams.get('refresh_token');
          }

          console.log('🔗 Token extraction result:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            url: url.substring(0, 100) + '...'
          });

          if (accessToken && refreshToken) {
            console.log('🔗 Setting session from deep link');
            const { error } = await supabase.auth.setSession({
              access_token: accessToken as string,
              refresh_token: refreshToken as string,
            });

            if (!error) {
              console.log('🔗 Session set successfully, will redirect via auth state change');
              await AsyncStorage.removeItem('guest');
            } else {
              console.error('🔗 Error setting session:', error);
            }
          } else {
            console.log('🔗 No tokens found in callback URL');
          }
        } catch (error) {
          console.error('🔗 Error processing deep link:', error);
        }
      }
    };

    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    getInitialUrl();

    // On cold start, immediately route based on existing session
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/(tabs)');
        } else {
          // Ensure we land on auth if no session
          router.replace('/(auth)/sign-in');
        }
      } catch (e) {
        // no-op
      }
    })();

    return () => {
      linkingSubscription?.remove();
      subscription.unsubscribe();
      // Clean up notification listeners
      notificationService.cleanup();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <>
          <Stack>
            <Stack.Screen
              name="(auth)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />
          </Stack>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function I18nGate() {
  const { isDark } = useTheme();
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initI18n();
      } catch (e) {
        console.error('Error initializing i18n (root):', e);
      } finally {
        setI18nReady(true);
      }
    })();
  }, []);

  if (!i18nReady) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: isDark ? '#111827' : '#f9fafb'
          }}>
            <Text style={{
              color: isDark ? '#ffffff' : '#111827',
              fontSize: 16
            }}>
              Loading...
            </Text>
          </View>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  return (
    <LanguageProvider>
      <RootLayoutContent />
    </LanguageProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <I18nGate />
    </ThemeProvider>
  );
}
