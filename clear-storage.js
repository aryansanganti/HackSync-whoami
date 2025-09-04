import * as SecureStore from 'expo-secure-store';

const clearSecureStore = async () => {
    try {
        const possibleKeys = [
            'supabase/auth/session',
            'supabase_auth_session',
            'sb-auth-token',
            'sb_auth_token',
            'supabase-auth-token',
            'supabase_session',
            'default_key'
        ];

        for (const key of possibleKeys) {
            try {
                await SecureStore.deleteItemAsync(key);
                console.log(`Cleared: ${key}`);
            } catch (error) {
            }
        }

        console.log('SecureStore cleared successfully');
    } catch (error) {
        console.error('Error clearing SecureStore:', error);
    }
};

clearSecureStore();
