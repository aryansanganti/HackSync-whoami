import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      setIsProcessing(true);
      
      // Get the current URL to extract tokens
      const url = window.location?.href || '';
      
      if (url.includes('access_token') || url.includes('error')) {
        // Handle the OAuth callback
        const { data, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.error('Auth callback error:', authError);
          setError('Authentication failed. Please try again.');
          return;
        }

        if (data.session) {
          console.log('Auth callback successful, session found');
          // Successfully authenticated, redirect to main app
          router.replace('/(tabs)');
        } else {
          console.log('No session found in auth callback');
          setError('Authentication incomplete. Please try signing in again.');
        }
      } else {
        // No tokens found, redirect back to sign in
        console.log('No auth tokens found, redirecting to sign in');
        router.replace('/(auth)/sign-in');
      }
    } catch (err) {
      console.error('Error in auth callback:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsProcessing(true);
    handleAuthCallback();
  };

  const handleBackToSignIn = () => {
    router.replace('/(auth)/sign-in');
  };

  if (isProcessing) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        backgroundColor: isDark ? '#111827' : '#f9fafb',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <View style={{
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderRadius: 20,
          padding: 40,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        }}>
          <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#3b82f6'} />
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: isDark ? '#ffffff' : '#111827',
            marginTop: 20,
            textAlign: 'center'
          }}>
            Completing Sign In...
          </Text>
          <Text style={{
            fontSize: 14,
            color: isDark ? '#9ca3af' : '#6b7280',
            marginTop: 8,
            textAlign: 'center'
          }}>
            Please wait while we complete your authentication
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        backgroundColor: isDark ? '#111827' : '#f9fafb',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <View style={{
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderRadius: 20,
          padding: 40,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: isDark ? '#ef4444' : '#fee2e2',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}>
            <Ionicons name="close-circle" size={40} color={isDark ? '#fca5a5' : '#dc2626'} />
          </View>
          
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: isDark ? '#ffffff' : '#111827',
            marginBottom: 12,
            textAlign: 'center'
          }}>
            Authentication Failed
          </Text>
          
          <Text style={{
            fontSize: 16,
            color: isDark ? '#9ca3af' : '#6b7280',
            marginBottom: 24,
            textAlign: 'center',
            lineHeight: 22,
          }}>
            {error}
          </Text>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={handleRetry}
              style={{
                backgroundColor: isDark ? '#3b82f6' : '#3b82f6',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
                minWidth: 100,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                Retry
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBackToSignIn}
              style={{
                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
                minWidth: 100,
                borderWidth: 1,
                borderColor: isDark ? '#4b5563' : '#d1d5db',
              }}
            >
              <Text style={{ 
                color: isDark ? '#d1d5db' : '#374151', 
                fontSize: 16, 
                fontWeight: '600',
                textAlign: 'center'
              }}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}
