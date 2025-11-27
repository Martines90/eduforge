'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/context';
import { UserIdentity } from '@/types/i18n';

export interface RouteProtectionOptions {
  requireAuth?: boolean;
  requireIdentity?: UserIdentity;
  redirectTo?: string;
}

/**
 * Hook to protect routes based on authentication and authorization requirements
 *
 * @param options - Protection options
 * @param options.requireAuth - Whether the route requires authentication
 * @param options.requireIdentity - Required user identity (teacher/non-teacher)
 * @param options.redirectTo - Custom redirect path (defaults based on protection type)
 *
 * @returns Object with isAuthorized and isLoading flags
 *
 * @example
 * // Require authentication only
 * const { isAuthorized, isLoading } = useRouteProtection({ requireAuth: true });
 *
 * @example
 * // Require teacher identity
 * const { isAuthorized, isLoading } = useRouteProtection({
 *   requireAuth: true,
 *   requireIdentity: 'teacher'
 * });
 */
export function useRouteProtection(options: RouteProtectionOptions = {}) {
  const { user } = useUser();
  const router = useRouter();
  const { requireAuth = false, requireIdentity, redirectTo } = options;

  useEffect(() => {
    // Wait for user state to be loaded from cookies
    if (user.isFirstVisit && !user.hasCompletedOnboarding) {
      // Still loading/onboarding
      return;
    }

    // Check authentication requirement
    if (requireAuth && !user.isRegistered) {
      // If not authenticated, redirect to home (they need to log in)
      const redirect = redirectTo || '/';
      router.push(redirect);
      return;
    }

    // Check identity/role requirement
    if (requireIdentity && user.identity !== requireIdentity) {
      // If authenticated but wrong role, redirect to unauthorized page
      const redirect = redirectTo || '/unauthorized';
      router.push(redirect);
      return;
    }
  }, [user, requireAuth, requireIdentity, redirectTo, router]);

  const isLoading = user.isFirstVisit && !user.hasCompletedOnboarding;
  const isAuthenticated = user.isRegistered;
  const hasRequiredIdentity = !requireIdentity || user.identity === requireIdentity;
  const isAuthorized = (!requireAuth || isAuthenticated) && hasRequiredIdentity;

  return {
    isAuthorized,
    isLoading,
    user,
  };
}
