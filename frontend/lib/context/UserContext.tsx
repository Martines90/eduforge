'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CountryCode, UserIdentity, UserRole, Subject, UserProfile } from '@/types/i18n';
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
  isRegistered: boolean;
  profile: UserProfile | null;
  identity: UserIdentity | null;
  role: UserRole;
  subject: Subject | null;
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
  setIdentity: (identity: UserIdentity) => void;
  setSubject: (subject: Subject) => void;
  registerUser: (profile: UserProfile) => void;
  loginUser: (email: string, password: string) => Promise<void>;
  logoutUser: () => void;
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
    isRegistered: false,
    profile: null,
    identity: null,
    role: 'guest',
    subject: null,
  });

  const [mounted, setMounted] = useState(false);

  // Initialize user state from cookies on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setMounted(true);

    const savedCountry = getCookie(COOKIE_NAMES.COUNTRY) as CountryCode | undefined;
    const savedIdentity = getCookie(COOKIE_NAMES.IDENTITY) as UserIdentity | undefined;
    const savedRole = getCookie(COOKIE_NAMES.ROLE) as UserRole | undefined;
    const savedSubject = getCookie(COOKIE_NAMES.SUBJECT) as Subject | undefined;
    const savedIsRegistered = getCookie(COOKIE_NAMES.IS_REGISTERED) === 'true';
    const savedProfileStr = getCookie(COOKIE_NAMES.USER_PROFILE);
    const firstVisit = isFirstVisit();

    let savedProfile: UserProfile | null = null;
    if (savedProfileStr) {
      try {
        savedProfile = JSON.parse(savedProfileStr);
      } catch (e) {
        console.error('Failed to parse user profile:', e);
      }
    }

    if (savedCountry && (savedCountry === 'US' || savedCountry === 'HU')) {
      // User has previously completed onboarding
      setUser({
        country: savedCountry,
        isFirstVisit: false,
        hasCompletedOnboarding: true,
        isRegistered: savedIsRegistered,
        profile: savedProfile,
        identity: savedIdentity || null,
        role: savedIsRegistered ? 'registered' : 'guest',
        subject: savedSubject || null,
      });
    } else if (!firstVisit) {
      // Has visit cookie but no country (shouldn't happen, but handle it)
      const detected = detectBrowserCountry();
      setUser({
        country: detected,
        isFirstVisit: false,
        hasCompletedOnboarding: true,
        isRegistered: savedIsRegistered,
        profile: savedProfile,
        identity: savedIdentity || null,
        role: savedIsRegistered ? 'registered' : 'guest',
        subject: savedSubject || null,
      });
      setCookie(COOKIE_NAMES.COUNTRY, detected);
    } else {
      // True first visit - detect from browser but don't save yet
      const detected = detectBrowserCountry();
      setUser({
        country: detected,
        isFirstVisit: true,
        hasCompletedOnboarding: false,
        isRegistered: false,
        profile: null,
        identity: null,
        role: 'guest',
        subject: null,
      });
    }
  }, []);

  // Set country and save to cookie
  const setCountry = useCallback((newCountry: CountryCode) => {
    setUser((prev) => ({ ...prev, country: newCountry }));
    setCookie(COOKIE_NAMES.COUNTRY, newCountry);
  }, []);

  // Set identity and save to cookie
  const setIdentity = useCallback((newIdentity: UserIdentity) => {
    setUser((prev) => ({ ...prev, identity: newIdentity }));
    setCookie(COOKIE_NAMES.IDENTITY, newIdentity);
  }, []);

  // Set subject and save to cookie
  const setSubject = useCallback((newSubject: Subject) => {
    setUser((prev) => ({ ...prev, subject: newSubject }));
    setCookie(COOKIE_NAMES.SUBJECT, newSubject);
  }, []);

  // Register user and save profile
  const registerUser = useCallback((profile: UserProfile) => {
    setUser((prev) => ({
      ...prev,
      isRegistered: true,
      profile,
      role: 'registered',
    }));
    setCookie(COOKIE_NAMES.IS_REGISTERED, 'true');
    setCookie(COOKIE_NAMES.USER_PROFILE, JSON.stringify(profile));
    setCookie(COOKIE_NAMES.ROLE, 'registered');
  }, []);

  // Login user (simplified - in production, verify against backend)
  const loginUser = useCallback(async (email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In a real app, verify credentials with backend
    // For demo, just accept any email/password
    const profile: UserProfile = {
      email: email.toLowerCase(),
      name: email.split('@')[0], // Simple name from email
      registeredAt: new Date().toISOString(),
    };

    setUser((prev) => ({
      ...prev,
      isRegistered: true,
      profile,
      role: 'registered',
    }));

    setCookie(COOKIE_NAMES.IS_REGISTERED, 'true');
    setCookie(COOKIE_NAMES.USER_PROFILE, JSON.stringify(profile));
    setCookie(COOKIE_NAMES.ROLE, 'registered');
  }, []);

  // Logout user
  const logoutUser = useCallback(() => {
    setUser((prev) => ({
      ...prev,
      isRegistered: false,
      profile: null,
      role: 'guest',
      identity: null,
      subject: null,
    }));
    // Clear auth cookies but keep country
    setCookie(COOKIE_NAMES.IS_REGISTERED, 'false');
    setCookie(COOKIE_NAMES.USER_PROFILE, '');
    setCookie(COOKIE_NAMES.ROLE, 'guest');
  }, []);

  // Mark onboarding as complete
  const completeOnboarding = useCallback(() => {
    setUser((prev) => ({
      ...prev,
      isFirstVisit: false,
      hasCompletedOnboarding: true,
    }));
    // All values should already be saved by their respective setters
  }, []);

  // Reset user state (useful for testing)
  const resetUser = useCallback(() => {
    setUser({
      country: DEFAULT_COUNTRY,
      isFirstVisit: true,
      hasCompletedOnboarding: false,
      isRegistered: false,
      profile: null,
      identity: null,
      role: 'guest',
      subject: null,
    });
  }, []);

  return (
    <UserContext.Provider value={{ user, setCountry, setIdentity, setSubject, registerUser, loginUser, logoutUser, completeOnboarding, resetUser }}>
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
