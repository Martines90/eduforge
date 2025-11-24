'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { CountryCode, TranslationKey } from '@/types/i18n';
import { translations } from './translations';
import { useUser } from '@/lib/context';

interface I18nContextType {
  country: CountryCode;
  setCountry: (country: CountryCode) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { user, setCountry: setUserCountry } = useUser();

  // Translation function
  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[user.country][key] || key;
    },
    [user.country]
  );

  // Set country (delegates to UserContext)
  const setCountry = useCallback(
    (newCountry: CountryCode) => {
      setUserCountry(newCountry);
    },
    [setUserCountry]
  );

  return (
    <I18nContext.Provider value={{ country: user.country, setCountry, t }}>
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

// Convenience hook for just the translation function
export function useTranslation() {
  const { t } = useI18n();
  return { t };
}
