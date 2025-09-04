# Internationalization (i18n) Implementation

This document describes the multilingual support implementation for the Civic AI app, supporting the top 5 Indian languages plus English.

## Supported Languages

1. **English** (en) - Default language
2. **Hindi** (hi) - हिन्दी
3. **Bengali** (bn) - বাংলা
4. **Telugu** (te) - తెలుగు
5. **Marathi** (mr) - मराठी
6. **Tamil** (ta) - தமிழ்

## Architecture

### Core Files

- `lib/i18n.ts` - Main i18n configuration and initialization
- `contexts/LanguageContext.tsx` - React context for language management
- `components/LanguageSelector.tsx` - UI component for language selection
- `locales/` - Translation files for each language

### Translation Files

Each language has its own JSON file in the `locales/` directory:
- `en.json` - English translations
- `hi.json` - Hindi translations
- `bn.json` - Bengali translations
- `te.json` - Telugu translations
- `mr.json` - Marathi translations
- `ta.json` - Tamil translations

## Features

### 1. Automatic Language Detection
- Detects device locale on first launch
- Falls back to English if device language is not supported
- Remembers user's language choice

### 2. Language Switching
- Easy language switching via profile screen
- Real-time language change without app restart
- Persistent language preference storage

### 3. Comprehensive Translation Coverage
- Navigation labels
- Home screen content
- Profile screen
- Common UI elements
- Error messages and alerts

## Usage

### Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <Text>{t('home.title')}</Text>
  );
}
```

### Language Context Usage

```tsx
import { useLanguage } from '@/contexts/LanguageContext';

function MyComponent() {
  const { currentLanguage, changeAppLanguage } = useLanguage();
  
  const handleLanguageChange = async (langCode: string) => {
    await changeAppLanguage(langCode);
  };
}
```

### Adding New Translations

1. Add the translation key to all language files in `locales/`
2. Use the key in your component with `t('key')`
3. Ensure consistent key structure across all languages

## Implementation Details

### Language Detection Logic
1. Check for saved language preference in AsyncStorage
2. If no saved preference, detect device locale
3. Map device locale to supported languages
4. Fall back to English if no match found

### Storage
- Language preference stored in AsyncStorage with key `civic_ai_language`
- Persists across app restarts
- Automatically loads on app initialization

### Performance
- Translations loaded on app startup
- No runtime translation loading
- Efficient language switching with React context

## Translation Structure

The translation files follow a nested structure:

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error"
  },
  "navigation": {
    "home": "Home",
    "profile": "Profile"
  },
  "home": {
    "title": "Civic AI",
    "subtitle": "Report and track civic issues"
  }
}
```

## Future Enhancements

1. **RTL Support** - Right-to-left language support
2. **Pluralization** - Advanced plural forms for different languages
3. **Date/Time Localization** - Localized date and time formats
4. **Number Formatting** - Localized number and currency formatting
5. **Dynamic Translations** - Server-side translation updates

## Testing

To test the i18n implementation:

1. Change device language in system settings
2. Launch the app to test automatic detection
3. Use the language selector in profile screen
4. Verify all UI elements update correctly
5. Test app restart to ensure persistence

## Dependencies

- `i18next` - Core internationalization framework
- `react-i18next` - React integration for i18next
- `expo-localization` - Device locale detection
- `@react-native-async-storage/async-storage` - Persistent storage

## Notes

- All translations are manually created and reviewed for accuracy
- Native language names are used in the language selector
- The implementation follows React Native best practices
- Error handling ensures the app continues to work even if i18n fails
