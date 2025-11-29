'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginModal } from '@/components/organisms/LoginModal';
import { CountrySelectionModal } from '@/components/organisms/CountrySelectionModal';
import { RegistrationModal } from '@/components/organisms/RegistrationModal';
import { RoleSelectionModal } from '@/components/organisms/RoleSelectionModal';
import { SubjectSelectionModal } from '@/components/organisms/SubjectSelectionModal';
import { ActionSelectionModal } from '@/components/organisms/ActionSelectionModal';
import { useUser } from '@/lib/context';
import { CountryCode, UserIdentity, Subject, UserProfile } from '@/types/i18n';
import * as apiService from '@/lib/services/api.service';

type OnboardingStep = 'login' | 'register' | 'country' | 'role' | 'subject' | 'action' | 'complete';

/**
 * OnboardingHandler Component
 * Manages the complete authentication and onboarding flow
 *
 * FLOW:
 * 1. Login (if not authenticated)
 * 2. Registration (if creating new account)
 * 3. Country selection
 * 4. Role selection (teacher/non-teacher)
 * 5. Subject selection (teachers only)
 * 6. Action selection (teachers only: create/search)
 * 7. Complete - redirect to appropriate page
 */
export const OnboardingHandler: React.FC = () => {
  const { user, setCountry, setIdentity, setSubject, registerUser, loginUser, completeOnboarding } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('login');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isTeacherAccount, setIsTeacherAccount] = useState(false);

  useEffect(() => {
    // Determine starting step based on user state
    if (!user.isRegistered) {
      // Not logged in - show login
      setStep('login');
    } else if (user.isFirstVisit && !user.hasCompletedOnboarding) {
      // Logged in but hasn't completed onboarding
      setStep('country');
    }
  }, [user.isRegistered, user.isFirstVisit, user.hasCompletedOnboarding]);

  // ===== LOGIN FLOW =====

  const handleLogin = async (email: string, password: string) => {
    await loginUser(email, password);
    // After login, go to country selection
    setStep('country');
  };

  const handleCreateAccountClick = (isTeacher: boolean) => {
    setIsCreatingAccount(true);
    setIsTeacherAccount(isTeacher);
    setStep('register');
  };

  // ===== REGISTRATION FLOW =====

  const handleRegister = async (profile: UserProfile & { password: string; country: CountryCode; identity: UserIdentity; subject?: Subject }) => {
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
        setSelectedSubject(profile.subject);
      }

      setIsCreatingAccount(false);

      // Add a small delay to allow RegistrationModal to fully close and release focus
      // before opening the next modal. This prevents focus trap conflicts.
      await new Promise(resolve => setTimeout(resolve, 100));

      // Determine next step based on identity
      if (profile.identity === 'teacher' && profile.subject) {
        // Teachers with subject go to action selection
        setStep('action');
      } else {
        // Non-teachers complete onboarding
        completeOnboarding();
        setStep('complete');
        router.push('/');
      }
    } catch (error: any) {
      console.error('Error during registration:', error);
      // Error is already handled in RegistrationModal
      // Just re-throw to prevent navigation
      throw error;
    }
  };

  const handleBackToLogin = () => {
    setIsCreatingAccount(false);
    setStep('login');
  };

  // ===== ONBOARDING FLOW =====

  const handleCountrySelect = (country: CountryCode) => {
    setCountry(country);
    setStep('role');
  };

  const handleRoleSelect = (identity: UserIdentity) => {
    setIdentity(identity);

    if (identity === 'teacher') {
      setStep('subject');
    } else {
      // Non-teachers complete onboarding and go to home
      completeOnboarding();
      setStep('complete');
    }
  };

  const handleSubjectSelect = (subject: Subject) => {
    setSubject(subject);
    setSelectedSubject(subject);
    setStep('action');
  };

  const handleActionSelect = (action: 'create' | 'search') => {
    completeOnboarding();
    setStep('complete');

    // Navigate based on action
    if (action === 'create') {
      router.push('/task_creator');
    } else {
      router.push('/tasks');
    }
  };

  // Don't render anything if onboarding is complete
  if (user.hasCompletedOnboarding || step === 'complete') {
    return null;
  }

  return (
    <>
      {/* Step 1: Login */}
      <LoginModal
        open={step === 'login' && !user.isRegistered}
        onLogin={handleLogin}
        onCreateAccount={handleCreateAccountClick}
      />

      {/* Step 2: Registration (includes country, subject for teachers, personal info) */}
      <RegistrationModal
        open={step === 'register'}
        onRegister={handleRegister}
        onBack={handleBackToLogin}
        detectedCountry={user.country}
        isTeacher={isTeacherAccount}
      />

      {/* Step 3: Action Selection (teachers only) */}
      {selectedSubject && (
        <ActionSelectionModal
          open={step === 'action'}
          subject={selectedSubject}
          onSelect={handleActionSelect}
        />
      )}
    </>
  );
};

export default OnboardingHandler;
