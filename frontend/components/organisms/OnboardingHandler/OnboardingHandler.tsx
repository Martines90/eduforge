'use client';

import React, { useEffect, useState } from 'react';
import { CountrySelectionModal } from '@/components/organisms/CountrySelectionModal';
import { useUser } from '@/lib/context';
import { CountryCode } from '@/types/i18n';

/**
 * OnboardingHandler Component
 * Manages the first-visit onboarding flow
 * Shows country selection modal for new users
 */
export const OnboardingHandler: React.FC = () => {
  const { user, setCountry, completeOnboarding } = useUser();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Only show modal on first visit after component mounts
    if (user.isFirstVisit && !user.hasCompletedOnboarding) {
      setModalOpen(true);
    }
  }, [user.isFirstVisit, user.hasCompletedOnboarding]);

  const handleCountrySelect = (country: CountryCode) => {
    setCountry(country);
    completeOnboarding();
    setModalOpen(false);
  };

  return (
    <CountrySelectionModal
      open={modalOpen}
      onSelect={handleCountrySelect}
      detectedCountry={user.country}
    />
  );
};

export default OnboardingHandler;
