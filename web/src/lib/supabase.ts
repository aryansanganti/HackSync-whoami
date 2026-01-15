import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase env not set: VITE_SUPABASE_URL/VITE_SUPABASE_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

export type { Session, User } from '@supabase/supabase-js';
