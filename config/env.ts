// Environment Configuration for Civic AI
// Copy this file to .env and fill in your actual values

export const ENV_CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_KEY || '',
  
  // Gemini AI Configuration
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
  
  // App Configuration
  APP_NAME: 'Civic AI',
  APP_VERSION: '1.0.0',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  
  // Feature Flags
  FEATURES: {
    COMMUNITY: false, // Phase 2
    VOLUNTEER_ROLE: false, // Phase 2
    PUSH_NOTIFICATIONS: false, // Phase 2
    HEATMAPS: false, // Phase 2
    MULTILINGUAL: false, // Phase 2
    SMART_ESCALATION: false, // Phase 3
  }
};

// Validation
export const validateEnvironment = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GEMINI_API_KEY'];
  const missing = required.filter(key => !ENV_CONFIG[key as keyof typeof ENV_CONFIG]);
  
  if (missing.length > 0) {
    console.warn('⚠️ Missing environment variables:', missing);
    console.warn('Please check your .env file configuration');
    return false;
  }
  
  return true;
};
