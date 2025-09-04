import { changeLanguage, getAvailableLanguages, getCurrentLanguage } from '@/lib/i18n';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Language = {
  code: string;
  name: string;
  nativeName: string;
};

interface LanguageContextType {
  currentLanguage: string;
  availableLanguages: Language[];
  changeAppLanguage: (languageCode: string) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [availableLanguages] = useState<Language[]>(getAvailableLanguages());

  useEffect(() => {
    // Initialize language on mount
    const initLanguage = async () => {
      try {
        const detectedLanguage = getCurrentLanguage();
        setCurrentLanguage(detectedLanguage);
      } catch (error) {
        console.error('Error initializing language:', error);
        setCurrentLanguage('en');
      } finally {
        setIsLoading(false);
      }
    };

    initLanguage();
  }, []);

  const changeAppLanguage = async (languageCode: string) => {
    try {
      setIsLoading(true);
      await changeLanguage(languageCode);
      setCurrentLanguage(languageCode);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: LanguageContextType = {
    currentLanguage,
    availableLanguages,
    changeAppLanguage,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
