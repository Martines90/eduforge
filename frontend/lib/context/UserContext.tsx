'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CountryCode } from '@/types/i18n';
import { DEFAULT_COUNTRY } from '@/lib/i18n/countries';
import { getCookie, setCookie, COOKIE_NAMES, isFirstVisit } from '@/lib/utils/cookies';
import { detectBrowserCountry } from '@/lib/utils/language-detection';

/**
 * User state interface
 */
export interface UserState {
  country: CountryCode;
  isFirstVisit: boolean;
  hasCompletedOnboarding: boolean;
  // Future: can add more user preferences here
  // theme?: 'light' | 'dark';
  // notifications?: boolean;
}

/**
 * User context interface
 */
interface UserContextType {
  user: UserState;
  setCountry: (country: CountryCode) => void;
  completeOnboarding: () => void;
  resetUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * UserProvider - Manages global user state
 * Handles country selection, cookies, and onboarding flow
 */
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserState>({
    country: DEFAULT_COUNTRY,
    isFirstVisit: true,
    hasCompletedOnboarding: false,
  });

  const [mounted, setMounted] = useState(false);

  // Initialize user state from cookies on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setMounted(true);

    const savedCountry = getCookie(COOKIE_NAMES.COUNTRY) as CountryCode | undefined;
    const firstVisit = isFirstVisit();

    if (savedCountry && (savedCountry === 'US' || savedCountry === 'HU')) {
      // User has previously selected a country
      setUser({
        country: savedCountry,
        isFirstVisit: false,
        hasCompletedOnboarding: true,
      });
    } else if (!firstVisit) {
      // Has visit cookie but no country (shouldn't happen, but handle it)
      const detected = detectBrowserCountry();
      setUser({
        country: detected,
        isFirstVisit: false,
        hasCompletedOnboarding: true,
      });
      setCookie(COOKIE_NAMES.COUNTRY, detected);
    } else {
      // True first visit - detect from browser but don't save yet
      const detected = detectBrowserCountry();
      setUser({
        country: detected,
        isFirstVisit: true,
        hasCompletedOnboarding: false,
      });
    }
  }, []);

  // Set country and save to cookie
  const setCountry = useCallback((newCountry: CountryCode) => {
    setUser((prev) => ({ ...prev, country: newCountry }));
    setCookie(COOKIE_NAMES.COUNTRY, newCountry);
  }, []);

  // Mark onboarding as complete
  const completeOnboarding = useCallback(() => {
    setUser((prev) => ({
      ...prev,
      isFirstVisit: false,
      hasCompletedOnboarding: true,
    }));
    // Country should already be saved by setCountry
  }, []);

  // Reset user state (useful for testing)
  const resetUser = useCallback(() => {
    setUser({
      country: DEFAULT_COUNTRY,
      isFirstVisit: true,
      hasCompletedOnboarding: false,
    });
  }, []);

  return (
    <UserContext.Provider value={{ user, setCountry, completeOnboarding, resetUser }}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook to access user context
 */
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
