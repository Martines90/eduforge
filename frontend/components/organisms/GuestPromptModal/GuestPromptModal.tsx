'use client';

import React, { useState } from 'react';
import { LoginModal } from '@/components/organisms/LoginModal';
import { RegistrationModal } from '@/components/organisms/RegistrationModal';
import { useUser } from '@/lib/context';
import { CountryCode, UserIdentity, Subject, UserProfile } from '@/types/i18n';
import { useSnackbar } from 'notistack';

export interface GuestPromptModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean;
  /**
   * Callback when the modal is closed
   */
  onClose: () => void;
  /**
   * Message to show to the user explaining why they need to register
   */
  promptMessage?: string;
  /**
   * Callback after successful registration
   * Receives the new user profile
   */
  onRegistrationComplete?: (profile: UserProfile) => void;
  /**
   * Which modal to show first: 'login' or 'register'
   * Default: 'register' (assuming most guests will be new users)
   */
  initialMode?: 'login' | 'register';
}

/**
 * GuestPromptModal Component
 *
 * Shows login/registration flow when a guest user tries to perform an action
 * that requires authentication (save task, generate more than 3 tasks, etc.)
 *
 * Features:
 * - Starts with registration form (can switch to login)
 * - Shows custom prompt message
 * - Handles full registration flow
 * - Calls onRegistrationComplete after successful registration
 *
 * Usage:
 * ```tsx
 * const [showModal, setShowModal] = useState(false);
 *
 * <GuestPromptModal
 *   open={showModal}
 *   onClose={() => setShowModal(false)}
 *   promptMessage="Register to save this task and get 100 free credits!"
 *   onRegistrationComplete={(profile) => {
 *     // Restore guest task, enable save button, etc.
 *   }}
 * />
 * ```
 */
export const GuestPromptModal: React.FC<GuestPromptModalProps> = ({
  open,
  onClose,
  promptMessage = 'Register (FREE) to save and download tasks, plus get 100 free task generation credits!',
  onRegistrationComplete,
  initialMode = 'register',
}) => {
  const { user, setCountry, setIdentity, setSubject, setEducationalModel, registerUser, loginUser } = useUser();
  const { enqueueSnackbar } = useSnackbar();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [isTeacher, setIsTeacher] = useState(false);

  // Reset mode when modal opens
  React.useEffect(() => {
    if (open) {
      setMode(initialMode);
      // Show toast with prompt message
      enqueueSnackbar(promptMessage, {
        variant: 'info',
        autoHideDuration: 6000,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'center',
        },
      });
    }
  }, [open, initialMode, promptMessage, enqueueSnackbar]);

  const handleLogin = async (email: string, password: string) => {
    try {
      await loginUser(email, password);

      // Login successful - call completion callback
      if (onRegistrationComplete && user.profile) {
        onRegistrationComplete(user.profile);
      }

      onClose();

      enqueueSnackbar('Welcome back! You can now save your task.', {
        variant: 'success',
      });
    } catch (error: any) {
      // Error is handled in loginUser
      throw error;
    }
  };

  const handleRegister = async (
    profile: UserProfile & {
      password: string;
      country: CountryCode;
      identity: UserIdentity;
      subject?: Subject;
      educationalModel?: any;
    }
  ) => {
    try {
      // Registration is handled in RegistrationModal
      // Token is already stored in localStorage
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

      // Call completion callback
      if (onRegistrationComplete) {
        onRegistrationComplete(userProfile);
      }

      onClose();

      enqueueSnackbar(`Welcome! You now have 100 free task generation credits.`, {
        variant: 'success',
        autoHideDuration: 5000,
      });
    } catch (error: any) {
      console.error('Error during registration:', error);
      throw error;
    }
  };

  const handleCreateAccountClick = (isTeacherAccount: boolean) => {
    setIsTeacher(isTeacherAccount);
    setMode('register');
  };

  const handleBackToLogin = () => {
    setMode('login');
  };

  if (!open) {
    return null;
  }

  return (
    <>
      {/* Login Modal */}
      <LoginModal
        open={mode === 'login'}
        onLogin={handleLogin}
        onCreateAccount={handleCreateAccountClick}
      />

      {/* Registration Modal */}
      <RegistrationModal
        open={mode === 'register'}
        onRegister={handleRegister}
        onBack={handleBackToLogin}
        detectedCountry={user.country}
        isTeacher={isTeacher}
      />
    </>
  );
};

export default GuestPromptModal;
