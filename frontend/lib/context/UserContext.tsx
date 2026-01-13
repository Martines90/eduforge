'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CountryCode, UserIdentity, UserRole, Subject, UserProfile } from '@/types/i18n';
import { DEFAULT_COUNTRY } from '@/lib/i18n/countries';
import { getCookie, setCookie, COOKIE_NAMES, isFirstVisit, clearAuthCookies } from '@/lib/utils/cookies';
import { logoutUser as firebaseLogout, onAuthChange } from '@/lib/firebase/auth';
import { getUserById } from '@/lib/firebase/users';
import * as apiService from '@/lib/services/api.service';
import { CountrySelectionModal } from '@/components/organisms/CountrySelectionModal/CountrySelectionModal';
import {
  GradeLevel,
  GradeConfig,
  getGradesForCountry,
  getGradeConfig,
  TeacherRole,
  getTeacherRole,
  getTeacherRoleLabel
} from '@eduforger/shared';

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
  tier: 'trial' | 'basic' | 'normal' | 'pro';
  status: 'active' | 'expired' | 'cancelled' | 'past_due';
  startDate?: string;
  endDate?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  cancelAtPeriodEnd?: boolean;
  schoolId?: string;
  schoolName?: string;
  associatedTeachers?: string[];
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
  subjects: Subject[]; // For teachers - multi-select subjects
  educationalModel: EducationalModel | null;
  teacherRole?: GradeLevel; // For teachers - the grade level they teach (e.g., "grade_6_8")
  subscription?: SubscriptionInfo;
  taskCredits?: number;
  // Future: can add more user preferences here
  // theme?: 'light' | 'dark';
  // notifications?: boolean;
}

/**
 * Grade system helpers based on user's country
 */
export interface GradeSystemHelpers {
  /** All grade levels available for the user's country */
  availableGrades: GradeConfig[];
  /** Get configuration for a specific grade level */
  getGrade: (gradeLevel: GradeLevel) => GradeConfig | undefined;
  /** Get teacher role for a grade level */
  getRole: (gradeLevel: GradeLevel) => TeacherRole | undefined;
  /** Get localized teacher role label */
  getRoleLabel: (gradeLevel: GradeLevel) => string | undefined;
  /** Get all grade level values as array */
  gradeValues: GradeLevel[];
}

/**
 * User context interface
 */
interface UserContextType {
  user: UserState;
  authInitialized: boolean;
  /** Grade system information based on user's country */
  gradeSystem: GradeSystemHelpers;
  setCountry: (country: CountryCode) => void;
  setIdentity: (identity: UserIdentity) => void;
  setSubjects: (subjects: Subject[]) => void;
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
  // Initialize country from cookie IMMEDIATELY (synchronous) to ensure translations work from the start
  const initialCountry = (typeof window !== 'undefined' ? getCookie(COOKIE_NAMES.COUNTRY) as CountryCode : undefined) || DEFAULT_COUNTRY;

  const [user, setUser] = useState<UserState>({
    country: initialCountry,
    isFirstVisit: true,
    hasCompletedOnboarding: false,
    isRegistered: false,
    profile: null,
    identity: null,
    role: 'guest',
    subjects: [],
    educationalModel: null,
  });

  const [mounted, setMounted] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);

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

          // IMPORTANT: Use country from Firestore user profile (logged-in user's preference takes precedence over IP detection)
          const userCountry = userData.country;

          // Normalize backend role to frontend UserIdentity (backend uses 'general_user', frontend uses 'non-teacher')
          const backendRole = userData.role as string;
          const normalizedIdentity: UserIdentity = backendRole === 'general_user' ? 'non-teacher' : backendRole as UserIdentity;

          // Convert subscription from Firestore to frontend format
          let subscription: SubscriptionInfo | undefined;
          if (userData.subscription) {
            // Firestore uses 'plan' field, map it to 'tier' for frontend
            const subscriptionData = userData.subscription as any;
            const tier = subscriptionData.tier || subscriptionData.plan || 'trial';

            subscription = {
              tier: tier as 'trial' | 'basic' | 'normal' | 'pro',
              status: subscriptionData.status,
              startDate: subscriptionData.startDate?.toDate?.()?.toISOString() || subscriptionData.trialStartDate?.toDate?.()?.toISOString(),
              endDate: subscriptionData.endDate?.toDate?.()?.toISOString() || subscriptionData.trialEndDate?.toDate?.()?.toISOString(),
              stripeCustomerId: subscriptionData.stripeCustomerId,
              stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
              stripePriceId: subscriptionData.stripePriceId,
              cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
              schoolId: subscriptionData.schoolId,
              schoolName: subscriptionData.schoolName,
              associatedTeachers: subscriptionData.associatedTeachers,
            };
          }

          // Update context state - use user's saved country preference (NOT cookie)
          setUser((prev) => ({
            ...prev,
            isRegistered: true,
            profile,
            role: 'registered',
            identity: normalizedIdentity,
            subjects: userData.subjects || [],
            educationalModel: (userData.educationalModel as EducationalModel) || null,
            teacherRole: (userData.teacherRole as GradeLevel) || undefined,
            country: userCountry || cookieCountry, // Fallback to cookie only if user has no country saved
            hasCompletedOnboarding: true, // If they're in Firestore, they've completed onboarding
            isFirstVisit: false,
            subscription,
            taskCredits: userData.taskCredits,
          }));

          // Update cookies to match user's preference
          setCookie(COOKIE_NAMES.IS_REGISTERED, 'true');
          setCookie(COOKIE_NAMES.USER_PROFILE, JSON.stringify(profile));
          setCookie(COOKIE_NAMES.ROLE, 'registered');
          // IMPORTANT: Always set country cookie to user's preference (overrides IP-detected country)
          if (userCountry) {
            console.log('[UserContext] Setting country from user profile:', userCountry);
            setCookie(COOKIE_NAMES.COUNTRY, userCountry);
          }
          if (normalizedIdentity) {
            setCookie(COOKIE_NAMES.IDENTITY, normalizedIdentity);
          }
          if (userData.subjects && userData.subjects.length > 0) {
            setCookie(COOKIE_NAMES.SUBJECT, JSON.stringify(userData.subjects));
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
            const subjectsCookie = getCookie(COOKIE_NAMES.SUBJECT);
            const subjects: Subject[] = subjectsCookie ? JSON.parse(subjectsCookie) : [];
            const savedCountry = (getCookie(COOKIE_NAMES.COUNTRY) as CountryCode) || DEFAULT_COUNTRY;

            console.log('[UserContext] Restoring session from localStorage/cookies, fetching fresh user data...');

            // Fetch fresh user data from backend to get subscription and credits
            try {
              const response = await apiService.getCurrentUser(authToken);

              if (response.success && response.data?.user) {
                const userData = response.data.user;
                const backendRole = (userData as any).role as string | undefined;
                const userIdentity: UserIdentity | undefined = backendRole === 'general_user' ? 'non-teacher' : backendRole as UserIdentity | undefined;
                const userSubscription = (userData as any).subscription as any;
                const userTaskCredits = (userData as any).taskCredits as number | undefined;
                const userSubjects = (userData as any).subjects as Subject[] | undefined;
                const userEducationalModel = (userData as any).educationalModel as EducationalModel | undefined;
                const userTeacherRole = (userData as any).teacherRole as GradeLevel | undefined;
                // IMPORTANT: Get country from user profile (logged-in user's preference takes precedence)
                const userCountry = (userData as any).country as CountryCode | undefined;

                // Convert subscription to frontend format
                let subscription: SubscriptionInfo | undefined;
                if (userSubscription) {
                  subscription = {
                    tier: userSubscription.tier || 'trial',
                    status: userSubscription.status,
                    startDate: userSubscription.startDate,
                    endDate: userSubscription.endDate,
                    stripeCustomerId: userSubscription.stripeCustomerId,
                    stripeSubscriptionId: userSubscription.stripeSubscriptionId,
                    stripePriceId: userSubscription.stripePriceId,
                    cancelAtPeriodEnd: userSubscription.cancelAtPeriodEnd,
                    schoolId: userSubscription.schoolId,
                    schoolName: userSubscription.schoolName,
                    associatedTeachers: userSubscription.associatedTeachers,
                  };
                }

                // Restore user state with fresh subscription data
                // IMPORTANT: Use user's country preference (NOT cookie) - logged-in user's preference dominates
                const finalCountry = userCountry || savedCountry;
                setUser((prev) => ({
                  ...prev,
                  isRegistered: true,
                  profile: { ...profile, token: authToken },
                  role: 'registered',
                  identity: userIdentity || identity || null,
                  subjects: userSubjects || subjects || [],
                  educationalModel: userEducationalModel || null,
                  teacherRole: userTeacherRole,
                  country: finalCountry,
                  hasCompletedOnboarding: true,
                  isFirstVisit: false,
                  subscription,
                  taskCredits: userTaskCredits,
                }));

                // IMPORTANT: Update country cookie to match user's preference (overrides IP-detected country)
                if (userCountry) {
                  console.log('[UserContext] Setting country from user profile (JWT login):', userCountry);
                  setCookie(COOKIE_NAMES.COUNTRY, userCountry);
                }
              } else {
                // Clear invalid session
                console.warn('[UserContext] Invalid token response, clearing session');
                clearAuthCookies();
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('authToken');
                  window.dispatchEvent(new Event('authTokenChanged'));
                }
              }
            } catch (error: any) {
              // Check if error is due to invalid token (401)
              const errorMessage = error?.message || '';
              if (errorMessage.includes('Invalid token') || errorMessage.includes('Unauthorized')) {
                console.log('[UserContext] Token is invalid or expired, clearing session');
                // Clear invalid session data
                clearAuthCookies();
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('authToken');
                  window.dispatchEvent(new Event('authTokenChanged'));
                }
              } else {
                console.error('[UserContext] Error fetching fresh user data:', error);
                // For other errors, fallback to cookies to allow offline access
                setUser((prev) => ({
                  ...prev,
                  isRegistered: true,
                  profile: { ...profile, token: authToken },
                  role: 'registered',
                  identity: identity || null,
                  subjects: subjects || [],
                  country: savedCountry,
                  hasCompletedOnboarding: true,
                  isFirstVisit: false,
                }));
              }
            }
          } catch (error) {
            console.error('[UserContext] Error parsing stored user data:', error);
            // Clear corrupted session data
            clearAuthCookies();
            if (typeof window !== 'undefined') {
              localStorage.removeItem('authToken');
              window.dispatchEvent(new Event('authTokenChanged'));
            }
          }
        } else {
          console.log('[UserContext] No stored session found');
          // For guest users, mark as ready (not first visit anymore)
          setUser((prev) => ({
            ...prev,
            isFirstVisit: false,
            hasCompletedOnboarding: true,
          }));
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

    if (savedCountry && (savedCountry as string) !== 'UNSUPPORTED') {
      // Restore valid country preference (auth state is managed by Firebase listener)
      setUser((prev) => ({
        ...prev,
        country: savedCountry,
      }));
    } else if (!savedCountry) {
      // No country cookie detected - middleware didn't detect IP
      // This means we're on localhost OR IP detection failed
      // Show country selection modal for user to choose
      console.log('[UserContext] No country cookie, showing country selection modal');
      setShowCountryModal(true);

      // Keep default country until user selects
      // No browser language detection - user must choose explicitly
    }
    // If savedCountry === 'UNSUPPORTED', user is already on /country-not-supported page
  }, []);

  // Check if we should show country modal on every render (handles refresh case)
  useEffect(() => {
    if (!mounted) return;

    const savedCountry = getCookie(COOKIE_NAMES.COUNTRY) as CountryCode | undefined;

    // If there's no country cookie and modal is not already showing, show it
    if (!savedCountry && !showCountryModal) {
      console.log('[UserContext] No country cookie detected on check, showing modal');
      setShowCountryModal(true);
    }
  }, [mounted, showCountryModal]);

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

  // Set subjects and save to cookie
  const setSubjects = useCallback((newSubjects: Subject[]) => {
    setUser((prev) => ({ ...prev, subjects: newSubjects }));
    setCookie(COOKIE_NAMES.SUBJECT, JSON.stringify(newSubjects));
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

      // Store auth token and notify listeners
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', token);
        // Dispatch custom event to notify useFirebaseToken hook
        window.dispatchEvent(new Event('authTokenChanged'));
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
      const userSubjects = (userData as any).subjects as Subject[] | undefined;
      const userEducationalModel = (userData as any).educationalModel as EducationalModel | undefined;
      const userTeacherRole = (userData as any).teacherRole as GradeLevel | undefined;
      const userSubscription = (userData as any).subscription as any;
      const userTaskCredits = (userData as any).taskCredits as number | undefined;

      // Convert subscription to frontend format
      let subscription: SubscriptionInfo | undefined;
      if (userSubscription) {
        subscription = {
          tier: userSubscription.tier || 'trial',
          status: userSubscription.status,
          // Backend returns ISO strings, not Firestore Timestamps
          startDate: userSubscription.startDate,
          endDate: userSubscription.endDate,
          stripeCustomerId: userSubscription.stripeCustomerId,
          stripeSubscriptionId: userSubscription.stripeSubscriptionId,
          stripePriceId: userSubscription.stripePriceId,
          cancelAtPeriodEnd: userSubscription.cancelAtPeriodEnd,
          schoolId: userSubscription.schoolId,
          schoolName: userSubscription.schoolName,
          associatedTeachers: userSubscription.associatedTeachers,
        };
      }

      // IMPORTANT: Use country from user profile (logged-in user's preference takes precedence over IP-detected country)
      // Fallback to cookie only if user has no country saved, then to default
      const finalCountry = userCountry || (getCookie(COOKIE_NAMES.COUNTRY) as CountryCode) || DEFAULT_COUNTRY;

      // Update local context state
      setUser((prev) => ({
        ...prev,
        isRegistered: true,
        profile,
        role: 'registered',
        identity: userRole || prev.identity,
        subjects: userSubjects || prev.subjects,
        educationalModel: userEducationalModel || prev.educationalModel,
        teacherRole: userTeacherRole,
        country: finalCountry,
        hasCompletedOnboarding: true,
        isFirstVisit: false,
        subscription,
        taskCredits: userTaskCredits,
      }));

      // Save to cookies
      setCookie(COOKIE_NAMES.IS_REGISTERED, 'true');
      setCookie(COOKIE_NAMES.USER_PROFILE, JSON.stringify(profile));
      setCookie(COOKIE_NAMES.ROLE, 'registered');
      // IMPORTANT: Always set country cookie to user's preference (overrides IP-detected country)
      if (userCountry) {
        console.log('[UserContext] Setting country from user profile (loginUser):', userCountry);
      }
      setCookie(COOKIE_NAMES.COUNTRY, finalCountry);
      if (userRole) {
        setCookie(COOKIE_NAMES.IDENTITY, userRole);
      }
      if (userSubjects && userSubjects.length > 0) {
        setCookie(COOKIE_NAMES.SUBJECT, JSON.stringify(userSubjects));
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
      subjects: [],
      educationalModel: null,
      hasCompletedOnboarding: false,
      isFirstVisit: true,
    }));

    // Clear all auth cookies (keeps country preference)
    clearAuthCookies();

    // Clear localStorage authToken and notify listeners
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      // Clear last unpublished task on logout
      localStorage.removeItem('eduforger_last_unpublished_task');
      // Clear guest task views on logout
      localStorage.removeItem('eduforger_guest_task_views');
      // Dispatch custom event to notify useFirebaseToken hook
      window.dispatchEvent(new Event('authTokenChanged'));
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
      subjects: [],
      educationalModel: null,
    });
  }, []);

  // Handle country selection from modal
  const handleCountrySelect = useCallback((selectedCountry: CountryCode) => {
    console.log('[UserContext] User selected country:', selectedCountry);
    setCountry(selectedCountry);
    setShowCountryModal(false);
  }, [setCountry]);

  // Check if country is selected (either from cookie or user selection)
  const hasCountry = Boolean(getCookie(COOKIE_NAMES.COUNTRY));
  const isCountryReady = hasCountry || !mounted;

  /**
   * Grade system helpers - automatically updates when user's country changes
   * Provides country-specific grade information and utilities
   */
  const gradeSystem: GradeSystemHelpers = useMemo(() => {
    const availableGrades = getGradesForCountry(user.country);

    return {
      availableGrades,
      getGrade: (gradeLevel: GradeLevel) => getGradeConfig(user.country, gradeLevel),
      getRole: (gradeLevel: GradeLevel) => getTeacherRole(user.country, gradeLevel),
      getRoleLabel: (gradeLevel: GradeLevel) => getTeacherRoleLabel(user.country, gradeLevel),
      gradeValues: availableGrades.map(g => g.value),
    };
  }, [user.country]);

  return (
    <UserContext.Provider value={{ user, authInitialized, gradeSystem, setCountry, setIdentity, setSubjects, setEducationalModel, registerUser, loginUser, logoutUser, completeOnboarding, resetUser }}>
      {/* Only render children when country is selected - prevents API calls and content rendering */}
      {isCountryReady ? children : null}

      {/* Show country selection modal when IP detection fails */}
      <CountrySelectionModal
        open={showCountryModal}
        onSelect={handleCountrySelect}
        detectedCountry={user.country}
      />
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
