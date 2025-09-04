import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AppState, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
    const router = useRouter();
    const { isDark, toggleTheme, theme } = useTheme();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto refresh while app is foregrounded
    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') supabase.auth.startAutoRefresh();
            else supabase.auth.stopAutoRefresh();
        });
        return () => sub.remove();
    }, []);

    async function signInWithEmail() {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            router.replace('/(tabs)');
        } catch (e) {
            if (e instanceof Error) Alert.alert(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function signUpWithEmail() {
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            if (!data.session) Alert.alert('Check your inbox to verify your email');
        } catch (e) {
            if (e instanceof Error) Alert.alert(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function signInWithGoogle() {
        try {
            setLoading(true);

            // DEBUG: Log the redirect URI
            console.log('🔍 Platform:', Platform.OS);
            console.log('🔍 Environment:', __DEV__ ? 'development' : 'production');

            if (Platform.OS === 'web') {
                // Web platform - let Supabase handle in-window
                const redirectTo = makeRedirectUri({ scheme: 'civicai', path: 'auth-callback' });
                console.log('🔍 Web redirect URI:', redirectTo);

                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo,
                        queryParams: { access_type: 'offline', prompt: 'consent' },
                    },
                });
                if (error) throw error;
            } else {
                // Mobile platform - use WebBrowser with deep linking
                const redirectTo = 'civicai://auth-callback';
                console.log('🔍 Mobile redirect URI:', redirectTo);

                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo,
                        skipBrowserRedirect: true,
                        queryParams: { access_type: 'offline', prompt: 'consent' },
                    },
                });

                if (error) throw error;
                if (!data?.url) throw new Error('Failed to get auth URL');

                console.log('🔍 Opening auth URL:', data.url);

                // Use WebBrowser to open the OAuth URL
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectTo,
                    {
                        // Additional options for better compatibility
                        showInRecents: true,
                    }
                );

                console.log('🔍 WebBrowser result:', result);

                if (result.type === 'success') {
                    console.log('🔍 Auth success, callback URL:', result.url);

                    // Parse the callback URL to extract tokens
                    if (result.url && result.url.includes('access_token')) {
                        // Extract tokens from the callback URL
                        const urlObj = new URL(result.url.replace('civicai://', 'https://dummy.com/'));
                        const hash = urlObj.hash.substring(1);
                        const hashParams = new URLSearchParams(hash);
                        const searchParams = new URLSearchParams(urlObj.search);

                        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
                        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');

                        console.log('🔍 Extracted tokens:', {
                            hasAccessToken: !!accessToken,
                            hasRefreshToken: !!refreshToken
                        });

                        if (accessToken && refreshToken) {
                            // Set the session directly
                            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                                access_token: accessToken,
                                refresh_token: refreshToken,
                            });

                            if (!sessionError && sessionData.session) {
                                console.log('🔍 Session set successfully');
                                // Session will be automatically saved by the auth state change handler
                                await AsyncStorage.removeItem('guest');
                                router.replace('/(tabs)');
                                return;
                            } else {
                                console.error('🔍 Error setting session:', sessionError);
                                throw new Error('Failed to set session');
                            }
                        } else {
                            throw new Error('Missing authentication tokens');
                        }
                    } else {
                        // Navigate to auth callback page to handle the deep link
                        router.push('/auth-callback');
                    }
                } else if (result.type === 'cancel') {
                    console.log('🔍 Auth cancelled by user');
                    Alert.alert('Sign-in Cancelled', 'Google sign-in was cancelled');
                } else if (result.type === 'dismiss') {
                    console.log('🔍 Auth dismissed by user');
                    Alert.alert('Sign-in Dismissed', 'Google sign-in was dismissed');
                } else {
                    console.log('🔍 Auth failed with result:', result);
                    Alert.alert('Sign-in Failed', 'Unable to complete Google sign-in');
                }
            }
        } catch (e) {
            console.error('🔍 Google sign-in error:', e);
            if (e instanceof Error) Alert.alert('Sign-in Error', e.message);
        } finally {
            setLoading(false);
        }
    }

    async function continueAsGuest() {
        await AsyncStorage.setItem('guest', '1');
        router.replace('/(tabs)');
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
            {/* Theme Toggle Button */}
            <TouchableOpacity 
                style={[styles.themeToggle, { backgroundColor: isDark ? '#374151' : '#ffffff' }]}
                onPress={toggleTheme}
            >
                <Ionicons 
                    name={isDark ? 'sunny' : 'moon'} 
                    size={24} 
                    color={isDark ? '#fbbf24' : '#6b7280'} 
                />
            </TouchableOpacity>

            <View style={styles.content}>
                <Text style={[styles.title, { color: isDark ? '#ffffff' : '#111827' }]}>
                    {t('auth.welcome')}
                </Text>
                <Text style={[styles.subtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    {t('auth.welcomeDescription')}
                </Text>

                <View style={styles.formSection}>
                    <Text style={[styles.label, { color: isDark ? '#d1d5db' : '#374151' }]}>Email</Text>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholder="you@example.com"
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        style={[styles.input, { 
                            backgroundColor: isDark ? '#1f2937' : '#ffffff',
                            borderColor: isDark ? '#374151' : '#d1d5db',
                            color: isDark ? '#ffffff' : '#111827'
                        }]}
                    />

                    <Text style={[styles.label, { color: isDark ? '#d1d5db' : '#374151' }]}>Password</Text>
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholder="••••••••"
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        style={[styles.input, { 
                            backgroundColor: isDark ? '#1f2937' : '#ffffff',
                            borderColor: isDark ? '#374151' : '#d1d5db',
                            color: isDark ? '#ffffff' : '#111827'
                        }]}
                    />

                    <TouchableOpacity 
                        onPress={signInWithEmail} 
                        disabled={loading} 
                        style={[styles.primaryButton, { opacity: loading ? 0.7 : 1 }]}
                    >
                        <Text style={styles.primaryButtonText}>
                            {loading ? t('common.loading') : t('auth.signIn')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={signUpWithEmail} 
                        disabled={loading} 
                        style={[styles.secondaryButton, { 
                            backgroundColor: isDark ? '#374151' : '#f3f4f6',
                            borderColor: isDark ? '#4b5563' : '#d1d5db'
                        }]}
                    >
                        <Text style={[styles.secondaryButtonText, { color: isDark ? '#d1d5db' : '#374151' }]}>
                            {loading ? t('common.loading') : t('auth.signUp')}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]} />

                <View style={styles.socialSection}>
                    <TouchableOpacity 
                        onPress={signInWithGoogle} 
                        disabled={loading} 
                        style={[styles.googleButton, { 
                            backgroundColor: isDark ? '#1f2937' : '#ffffff',
                            borderColor: isDark ? '#374151' : '#d1d5db'
                        }]}
                    >
                        <Ionicons name="logo-google" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                        <Text style={[styles.googleButtonText, { color: isDark ? '#d1d5db' : '#374151' }]}>
                            {t('auth.signInWithGoogle')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={continueAsGuest} 
                        style={styles.guestButton}
                    >
                        <Text style={[styles.guestButtonText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                            {t('auth.signInAnonymously')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    themeToggle: {
        position: 'absolute',
        top: 20,
        right: 20,
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
        zIndex: 1000,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: 80, // Account for theme toggle
        gap: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 36,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
    },
    formSection: {
        gap: 16,
        width: '100%',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        width: '100%',
        minHeight: 52,
    },
    primaryButton: {
        backgroundColor: '#3b82f6',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        width: '100%',
        minHeight: 52,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16,
    },
    secondaryButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        width: '100%',
        minHeight: 52,
    },
    secondaryButtonText: {
        fontWeight: '600',
        fontSize: 16,
    },
    divider: {
        height: 1,
        marginVertical: 24,
    },
    socialSection: {
        gap: 16,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        width: '100%',
        minHeight: 52,
    },
    googleButtonText: {
        fontWeight: '600',
        fontSize: 16,
    },
    guestButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
        minHeight: 52,
    },
    guestButtonText: {
        fontWeight: '600',
        fontSize: 16,
    },
});
