'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CountryCode, UserIdentity, UserRole, Subject, UserProfile } from '@/types/i18n';
import { DEFAULT_COUNTRY } from '@/lib/i18n/countries';
import { getCookie, setCookie, COOKIE_NAMES, isFirstVisit, clearAuthCookies } from '@/lib/utils/cookies';
import { detectBrowserCountry } from '@/lib/utils/language-detection';
import { logoutUser as firebaseLogout, onAuthChange } from '@/lib/firebase/auth';
import { getUserById } from '@/lib/firebase/users';
import * as apiService from '@/lib/services/api.service';

export type EducationalModel =
  | 'secular'
  | 'conservative'
  | 'traditional'
  | 'liberal'
  | 'progressive'
  | 'religious_christian'
  | 'religious_islamic'
  | 'religious_jewish'
  | 'montessori'
  | 'waldorf';

export interface SubscriptionInfo {
  plan: 'trial' | 'annual' | 'none';
  status: 'active' | 'expired' | 'cancelled';
  trialStartDate?: string;
  trialEndDate?: string;
  annualStartDate?: string;
  annualEndDate?: string;
}

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
  educationalModel: EducationalModel | null;
  subscription?: SubscriptionInfo;
  taskCredits?: number;
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
  setEducationalModel: (model: EducationalModel) => void;
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
    educationalModel: null,
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
          // Get country from cookies first (we need it to construct the Firestore path)
          const cookieCountry = (getCookie(COOKIE_NAMES.COUNTRY) as CountryCode) || DEFAULT_COUNTRY;

          // User is authenticated - restore session from Firestore
          const userData = await getUserById(firebaseUser.uid, cookieCountry);
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

          // Use country from Firestore (it should match the cookie)
          const savedCountry = userData.country;

          // Normalize backend role to frontend UserIdentity (backend uses 'general_user', frontend uses 'non-teacher')
          const backendRole = userData.role as string;
          const normalizedIdentity: UserIdentity = backendRole === 'general_user' ? 'non-teacher' : backendRole as UserIdentity;

          // Convert subscription from Firestore to frontend format
          let subscription: SubscriptionInfo | undefined;
          if (userData.subscription) {
            subscription = {
              plan: userData.subscription.plan,
              status: userData.subscription.status,
              trialStartDate: userData.subscription.trialStartDate?.toDate?.()?.toISOString(),
              trialEndDate: userData.subscription.trialEndDate?.toDate?.()?.toISOString(),
              annualStartDate: userData.subscription.annualStartDate?.toDate?.()?.toISOString(),
              annualEndDate: userData.subscription.annualEndDate?.toDate?.()?.toISOString(),
            };
          }

          // Update context state
          setUser((prev) => ({
            ...prev,
            isRegistered: true,
            profile,
            role: 'registered',
            identity: normalizedIdentity,
            subject: userData.subject || null,
            country: savedCountry || prev.country,
            hasCompletedOnboarding: true, // If they're in Firestore, they've completed onboarding
            isFirstVisit: false,
            subscription,
            taskCredits: userData.taskCredits,
          }));

          // Update cookies
          setCookie(COOKIE_NAMES.IS_REGISTERED, 'true');
          setCookie(COOKIE_NAMES.USER_PROFILE, JSON.stringify(profile));
          setCookie(COOKIE_NAMES.ROLE, 'registered');
          if (savedCountry) {
            setCookie(COOKIE_NAMES.COUNTRY, savedCountry);
          }
          if (normalizedIdentity) {
            setCookie(COOKIE_NAMES.IDENTITY, normalizedIdentity);
          }
          if (userData.subject) {
            setCookie(COOKIE_NAMES.SUBJECT, userData.subject);
          }
        } catch (error) {
          console.error('[UserContext] Error restoring user session:', error);
        }
      } else {
        // No Firebase Auth user - check if we have a JWT token from backend login
        console.log('[UserContext] No Firebase user, checking localStorage for JWT token...');

        const authToken = localStorage.getItem('authToken');
        const profileStr = getCookie(COOKIE_NAMES.USER_PROFILE);
        const isRegistered = getCookie(COOKIE_NAMES.IS_REGISTERED) === 'true';

        if (authToken && profileStr && isRegistered) {
          try {
            const profile = JSON.parse(profileStr) as UserProfile;
            const cookieIdentity = getCookie(COOKIE_NAMES.IDENTITY);
            // Normalize backend role to frontend UserIdentity (backend uses 'general_user', frontend uses 'non-teacher')
            const identity: UserIdentity | undefined = cookieIdentity === 'general_user' ? 'non-teacher' : cookieIdentity as UserIdentity | undefined;
            const subject = getCookie(COOKIE_NAMES.SUBJECT) as Subject | undefined;
            const savedCountry = (getCookie(COOKIE_NAMES.COUNTRY) as CountryCode) || DEFAULT_COUNTRY;

            console.log('[UserContext] Restoring session from localStorage/cookies');

            // Restore user state from cookies/localStorage
            setUser((prev) => ({
              ...prev,
              isRegistered: true,
              profile: { ...profile, token: authToken },
              role: 'registered',
              identity: identity || null,
              subject: subject || null,
              country: savedCountry,
              hasCompletedOnboarding: true,
              isFirstVisit: false,
            }));
          } catch (error) {
            console.error('[UserContext] Error parsing stored user data:', error);
          }
        } else {
          console.log('[UserContext] No stored session found');
        }
      }

      setAuthInitialized(true);
    });

    return () => {
      console.log('[UserContext] Cleaning up Firebase Auth listener');
      unsubscribe();
    };
  }, []);

  // Initialize country from cookies (don't touch auth state - Firebase handles that)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setMounted(true);

    const savedCountry = getCookie(COOKIE_NAMES.COUNTRY) as CountryCode | undefined;

    if (savedCountry) {
      // Restore country preference only (auth state is managed by Firebase listener)
      setUser((prev) => ({
        ...prev,
        country: savedCountry,
      }));
    } else {
      // Detect country from browser
      const detected = detectBrowserCountry();
      setUser((prev) => ({
        ...prev,
        country: detected,
      }));
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

  // Set educational model and save to cookie
  const setEducationalModel = useCallback((newModel: EducationalModel) => {
    setUser((prev) => ({ ...prev, educationalModel: newModel }));
    setCookie(COOKIE_NAMES.EDUCATIONAL_MODEL, newModel);
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

  // Login user with backend API
  const loginUser = useCallback(async (email: string, password: string) => {
    try {
      console.log('[UserContext] Logging in with backend API...');

      // Call backend login API (verifies password hash in Firestore)
      const response = await apiService.loginUser({ email, password });
      console.log('[UserContext] Backend login successful:', response);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
      }

      const { user: userData, token } = response.data;

      // Store auth token
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', token);
      }

      // Build profile from backend response (no need to fetch from Firestore again)
      const profile: UserProfile = {
        email: userData.email,
        name: userData.name,
        registeredAt: new Date().toISOString(), // Backend doesn't return createdAt in login response
        token,
      };

      // Get user data from backend response
      const backendRole = (userData as any).role as string | undefined;
      // Normalize backend role to frontend UserIdentity (backend uses 'general_user', frontend uses 'non-teacher')
      const userRole: UserIdentity | undefined = backendRole === 'general_user' ? 'non-teacher' : backendRole as UserIdentity | undefined;
      const userCountry = (userData as any).country as CountryCode | undefined;
      const userSubject = (userData as any).subject as Subject | undefined;
      const userSubscription = (userData as any).subscription as any;
      const userTaskCredits = (userData as any).taskCredits as number | undefined;

      // Convert subscription to frontend format
      let subscription: SubscriptionInfo | undefined;
      if (userSubscription) {
        subscription = {
          plan: userSubscription.plan,
          status: userSubscription.status,
          // Backend returns ISO strings, not Firestore Timestamps
          trialStartDate: userSubscription.trialStartDate,
          trialEndDate: userSubscription.trialEndDate,
          annualStartDate: userSubscription.annualStartDate,
          annualEndDate: userSubscription.annualEndDate,
        };
      }

      // Use country from backend, fallback to cookie, then default
      const savedCountry = userCountry || (getCookie(COOKIE_NAMES.COUNTRY) as CountryCode) || DEFAULT_COUNTRY;

      // Update local context state
      setUser((prev) => ({
        ...prev,
        isRegistered: true,
        profile,
        role: 'registered',
        identity: userRole || prev.identity,
        subject: userSubject || prev.subject,
        country: savedCountry,
        hasCompletedOnboarding: true,
        isFirstVisit: false,
        subscription,
        taskCredits: userTaskCredits,
      }));

      // Save to cookies
      setCookie(COOKIE_NAMES.IS_REGISTERED, 'true');
      setCookie(COOKIE_NAMES.USER_PROFILE, JSON.stringify(profile));
      setCookie(COOKIE_NAMES.ROLE, 'registered');
      setCookie(COOKIE_NAMES.COUNTRY, savedCountry);
      if (userRole) {
        setCookie(COOKIE_NAMES.IDENTITY, userRole);
      }
      if (userSubject) {
        setCookie(COOKIE_NAMES.SUBJECT, userSubject);
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

    // Clear local state - reset to guest state
    setUser((prev) => ({
      ...prev,
      isRegistered: false,
      profile: null,
      role: 'guest',
      identity: null,
      subject: null,
      educationalModel: null,
      hasCompletedOnboarding: false,
      isFirstVisit: true,
    }));

    // Clear all auth cookies (keeps country preference)
    clearAuthCookies();

    // Clear localStorage authToken
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }

    console.log('[UserContext] Logout complete, all auth data cleared');
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
      educationalModel: null,
    });
  }, []);

  return (
    <UserContext.Provider value={{ user, setCountry, setIdentity, setSubject, setEducationalModel, registerUser, loginUser, logoutUser, completeOnboarding, resetUser }}>
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
