import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';

import { translations } from '../utils/localization';

export type Language = 'en' | 'ar';

interface I18nContextType {
  language: Language;
  isRTL: boolean;
  t: (key: string, options?: any) => string;
  setLanguage: (language: Language) => Promise<void>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@app_language';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  const i18n = new I18n(translations);
  i18n.locale = language;
  i18n.enableFallback = true;
  i18n.defaultLocale = 'en';

  const isRTL = language === 'ar';

  useEffect(() => {
    loadLanguage();
  }, []);

  useEffect(() => {
    // Update RTL layout when language changes
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
    }
  }, [isRTL]);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && ['en', 'ar'].includes(savedLanguage)) {
        setLanguageState(savedLanguage as Language);
      } else {
        // Detect system language
        const locales = Localization.getLocales();
        const systemLanguage = locales[0]?.languageCode?.startsWith('ar')
          ? 'ar'
          : 'en';
        setLanguageState(systemLanguage);
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setLanguage = async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  const t = (key: string, options?: any) => {
    return i18n.t(key, options);
  };

  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <I18nContext.Provider value={{ language, isRTL, t, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
