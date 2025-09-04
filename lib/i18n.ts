import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import bn from '../locales/bn.json';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import mr from '../locales/mr.json';
import ta from '../locales/ta.json';
import te from '../locales/te.json';

const LANGUAGE_STORAGE_KEY = 'civic_ai_language';

// Language detection function
const detectLanguage = async (): Promise<string> => {
  try {
    // First check if user has manually selected a language
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage) {
      return savedLanguage;
    }

    // Get device locale
    const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
    
    // Map device locale to our supported languages
    const supportedLanguages = ['en', 'hi', 'bn', 'te', 'mr', 'ta'];
    
    // Check if device locale is supported
    if (supportedLanguages.includes(deviceLocale)) {
      return deviceLocale;
    }

    // Check for language family matches (e.g., 'hi-IN' -> 'hi')
    const languageFamily = deviceLocale.split('-')[0];
    if (supportedLanguages.includes(languageFamily)) {
      return languageFamily;
    }

    // Default to English
    return 'en';
  } catch (error) {
    console.error('Error detecting language:', error);
    return 'en';
  }
};

// Initialize i18n
const initI18n = async () => {
  try {
    const detectedLanguage = await detectLanguage();

    // Initialize i18n synchronously first
    i18n.use(initReactI18next).init({
      resources: {
        en: { translation: en },
        hi: { translation: hi },
        bn: { translation: bn },
        te: { translation: te },
        mr: { translation: mr },
        ta: { translation: ta },
      },
      lng: detectedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

    // Wait for i18n to be ready
    await new Promise((resolve) => {
      if (i18n.isInitialized) {
        resolve(true);
      } else {
        i18n.on('initialized', () => resolve(true));
      }
    });

    return detectedLanguage;
  } catch (error) {
    console.error('Error initializing i18n:', error);
    // Fallback initialization with English
    i18n.use(initReactI18next).init({
      resources: {
        en: { translation: en },
      },
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
    return 'en';
  }
};

// Language switching function
export const changeLanguage = async (languageCode: string) => {
  try {
    await i18n.changeLanguage(languageCode);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// Get current language
export const getCurrentLanguage = () => i18n.language;

// Get available languages
export const getAvailableLanguages = () => [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
];

export default i18n;
export { initI18n };
