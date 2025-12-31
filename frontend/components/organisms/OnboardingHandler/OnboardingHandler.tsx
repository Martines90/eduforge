'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LoginModal } from '@/components/organisms/LoginModal';
import { RegistrationModal } from '@/components/organisms/RegistrationModal';
import { useUser } from '@/lib/context';
import { CountryCode, UserIdentity, Subject, UserProfile } from '@/types/i18n';

type OnboardingStep = 'login' | 'register' | 'country' | 'role' | 'subject' | 'complete';

/**
 * OnboardingHandler Component
 * Manages the complete authentication and onboarding flow
 *
 * FLOW:
 * 1. Login (if not authenticated)
 * 2. Registration (if creating new account)
 * 3. Complete - redirect to home page
 *    - Teachers see both "Create Task" and "Search Tasks" options
 *    - Non-teachers see only "Search Tasks" option
 *
 * PUBLIC PAGES:
 * - Task detail pages (/tasks/[id]) are publicly accessible and do not require login
 */
export const OnboardingHandler: React.FC = () => {
  const { user, authInitialized, setCountry, setIdentity, setSubject, setEducationalModel, registerUser, loginUser, completeOnboarding } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState<OnboardingStep>('login');
  const [isTeacherAccount, setIsTeacherAccount] = useState(false);

  // Check if current page is a public page (doesn't require login)
  const isPublicPage = pathname?.startsWith('/tasks/task_');

  useEffect(() => {
    // Skip onboarding on public pages
    if (isPublicPage) {
      return;
    }

    // Wait for auth to initialize before determining step
    if (!authInitialized) {
      return;
    }

    // Determine starting step based on user state
    // Note: We no longer force login modal for guests - they can browse freely
    if (user.isRegistered && user.isFirstVisit && !user.hasCompletedOnboarding) {
      // Logged in but hasn't completed onboarding
      setStep('country');
    } else {
      // Mark as complete to not show any modals
      setStep('complete');
    }
  }, [authInitialized, user.isRegistered, user.isFirstVisit, user.hasCompletedOnboarding, isPublicPage, pathname]);

  // ===== LOGIN FLOW =====

  const handleLogin = async (email: string, password: string) => {
    await loginUser(email, password);
    // After login, go to country selection
    setStep('country');
  };

  const handleCreateAccountClick = (isTeacher: boolean) => {
    setIsTeacherAccount(isTeacher);
    setStep('register');
  };

  // ===== REGISTRATION FLOW =====

  const handleRegister = async (profile: UserProfile & { password: string; country: CountryCode; identity: UserIdentity; subject?: Subject; educationalModel?: unknown }) => {
    try {
      // User is already registered and verified at this point (done in RegistrationModal)
      // The token was already stored in localStorage by RegistrationModal
      // Just update the local user context with the profile data

      const userProfile: UserProfile = {
        name: profile.name,
        email: profile.email,
        registeredAt: new Date().toISOString(),
        token: localStorage.getItem('authToken') || '',
      };

      registerUser(userProfile);
      setCountry(profile.country);
      setIdentity(profile.identity);

      if (profile.subject) {
        setSubject(profile.subject);
      }

      if (profile.educationalModel) {
        setEducationalModel(profile.educationalModel);
      }

      // Add a small delay to allow RegistrationModal to fully close and release focus
      // before opening the next modal. This prevents focus trap conflicts.
      await new Promise(resolve => setTimeout(resolve, 100));

      // All users complete onboarding and redirect to home page
      // Home page will show appropriate options based on user identity
      completeOnboarding();
      setStep('complete');
      router.push('/');
    } catch (error) {
      console.error('Error during registration:', error);
      // Error is already handled in RegistrationModal
      // Just re-throw to prevent navigation
      throw error;
    }
  };

  const handleBackToLogin = () => {
    setStep('login');
  };


  // Don't render anything if:
  // - Auth is still initializing (prevents flash of login modal)
  // - Onboarding is complete
  // - On public pages
  if (!authInitialized || user.hasCompletedOnboarding || step === 'complete' || isPublicPage) {
    return null;
  }

  return (
    <>
      {/* Step 1: Login */}
      <LoginModal
        open={step === 'login' && !user.isRegistered}
        onLogin={handleLogin}
        onCreateAccount={handleCreateAccountClick}
        onClose={() => setStep('complete')}
      />

      {/* Step 2: Registration (includes country, subject for teachers, personal info) */}
      <RegistrationModal
        open={step === 'register'}
        onRegister={handleRegister}
        onBack={handleBackToLogin}
        onClose={() => setStep('complete')}
        detectedCountry={user.country}
        isTeacher={isTeacherAccount}
      />

    </>
  );
};

export default OnboardingHandler;
