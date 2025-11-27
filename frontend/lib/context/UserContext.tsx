'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CountryCode, UserIdentity, UserRole, Subject, UserProfile } from '@/types/i18n';
import { DEFAULT_COUNTRY } from '@/lib/i18n/countries';
import { getCookie, setCookie, COOKIE_NAMES, isFirstVisit } from '@/lib/utils/cookies';
import { detectBrowserCountry } from '@/lib/utils/language-detection';
import { logoutUser as firebaseLogout, loginUser as firebaseLogin, onAuthChange } from '@/lib/firebase/auth';
import { getUserById } from '@/lib/firebase/users';

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
  logoutUser: () => Promise<void>;
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
  const [authInitialized, setAuthInitialized] = useState(false);

  // Listen to Firebase Auth state changes to restore session on reload
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[UserContext] Setting up Firebase Auth listener...');

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      console.log('[UserContext] Firebase Auth state changed:', firebaseUser ? `User: ${firebaseUser.uid}` : 'No user');

      if (firebaseUser) {
        try {
          // User is authenticated - restore session from Firestore
          const userData = await getUserById(firebaseUser.uid);
          console.log('[UserContext] Restored user data from Firestore:', userData);

          if (!userData) {
            console.warn('[UserContext] No user data found in Firestore for:', firebaseUser.uid);
            setAuthInitialized(true);
            return;
          }

          const profile: UserProfile = {
            email: userData.email,
            name: userData.name,
            registeredAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            token: '',
          };

          // Update context state
          setUser((prev) => ({
            ...prev,
            isRegistered: true,
            profile,
            role: 'registered',
            identity: userData.role as UserIdentity,
            subject: userData.subject || null,
            hasCompletedOnboarding: true, // If they're in Firestore, they've completed onboarding
            isFirstVisit: false,
          }));

          // Update cookies
          setCookie(COOKIE_NAMES.IS_REGISTERED, 'true');
          setCookie(COOKIE_NAMES.USER_PROFILE, JSON.stringify(profile));
          setCookie(COOKIE_NAMES.ROLE, 'registered');
          if (userData.role) {
            setCookie(COOKIE_NAMES.IDENTITY, userData.role);
          }
          if (userData.subject) {
            setCookie(COOKIE_NAMES.SUBJECT, userData.subject);
          }
        } catch (error) {
          console.error('[UserContext] Error restoring user session:', error);
        }
      } else {
        // No user authenticated
        console.log('[UserContext] No Firebase user, checking cookies...');
      }

      setAuthInitialized(true);
    });

    return () => {
      console.log('[UserContext] Cleaning up Firebase Auth listener');
      unsubscribe();
    };
  }, []);

  // Initialize user state from cookies on mount (fallback)
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
    // In production, the backend would generate and return a JWT token
    // For now, we'll create a placeholder token structure
    const profileWithToken: UserProfile = {
      ...profile,
      token: profile.token || '', // Will be populated by backend in production
    };

    setUser((prev) => ({
      ...prev,
      isRegistered: true,
      profile: profileWithToken,
      role: 'registered',
    }));
    setCookie(COOKIE_NAMES.IS_REGISTERED, 'true');
    setCookie(COOKIE_NAMES.USER_PROFILE, JSON.stringify(profileWithToken));
    setCookie(COOKIE_NAMES.ROLE, 'registered');
  }, []);

  // Login user with Firebase Auth
  const loginUser = useCallback(async (email: string, password: string) => {
    try {
      console.log('[UserContext] Logging in with Firebase Auth...');

      // Call Firebase Auth login
      const firebaseUser = await firebaseLogin(email, password);
      console.log('[UserContext] Firebase login successful:', firebaseUser.uid);

      // Get user data from Firestore
      const userData = await getUserById(firebaseUser.uid);
      console.log('[UserContext] User data loaded:', userData);

      if (!userData) {
        throw new Error('User not found in Firestore. Please register first.');
      }

      // Build profile from Firestore data
      const profile: UserProfile = {
        email: userData.email,
        name: userData.name,
        registeredAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        token: '', // Token is managed by Firebase Auth
      };

      // Update local context state
      setUser((prev) => ({
        ...prev,
        isRegistered: true,
        profile,
        role: 'registered',
        identity: userData.role as UserIdentity,
        subject: userData.subject || null,
      }));

      // Save to cookies
      setCookie(COOKIE_NAMES.IS_REGISTERED, 'true');
      setCookie(COOKIE_NAMES.USER_PROFILE, JSON.stringify(profile));
      setCookie(COOKIE_NAMES.ROLE, 'registered');
      if (userData.role) {
        setCookie(COOKIE_NAMES.IDENTITY, userData.role);
      }
      if (userData.subject) {
        setCookie(COOKIE_NAMES.SUBJECT, userData.subject);
      }

      console.log('[UserContext] Login complete, user state updated');
    } catch (error) {
      console.error('[UserContext] Login error:', error);
      throw error;
    }
  }, []);

  // Logout user
  const logoutUser = useCallback(async () => {
    try {
      // Call Firebase Auth logout first
      await firebaseLogout();
      console.log('[UserContext] Firebase logout successful');
    } catch (error) {
      console.error('[UserContext] Firebase logout error:', error);
    }

    // Clear local state
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

    // Clear localStorage authToken
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
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
