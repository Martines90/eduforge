'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/context';
import { UserIdentity } from '@/types/i18n';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { useTranslation } from '@/lib/i18n';

export interface AuthenticatedPageProps {
  children: ReactNode;
  /**
   * Whether authentication is required to view this page
   * @default true
   */
  requireAuth?: boolean;
  /**
   * Require specific user identity (teacher or non-teacher)
   * If specified, users without this identity will be redirected
   */
  requireIdentity?: UserIdentity;
  /**
   * Where to redirect unauthorized users
   * @default '/unauthorized'
   */
  redirectTo?: string;
  /**
   * Whether to show a loading spinner while checking auth
   * @default false - returns null by default for cleaner UX
   */
  showLoadingSpinner?: boolean;
  /**
   * Custom loading message
   */
  loadingMessage?: string;
}

/**
 * AuthenticatedPage Component
 *
 * A wrapper component that handles authentication and authorization logic for protected pages.
 * Prevents content from rendering behind the login modal for non-authenticated users.
 * Supports role-based access control (teacher vs non-teacher).
 *
 * @example
 * // Simple usage - blocks non-authenticated users
 * export default function TasksPage() {
 *   return (
 *     <AuthenticatedPage>
 *       <Container>Your content here</Container>
 *     </AuthenticatedPage>
 *   );
 * }
 *
 * @example
 * // Teacher-only page
 * export default function TaskCreatorPage() {
 *   return (
 *     <AuthenticatedPage requireIdentity="teacher" showLoadingSpinner>
 *       <Container>Teacher content here</Container>
 *     </AuthenticatedPage>
 *   );
 * }
 *
 * @example
 * // With custom redirect
 * export default function AdminPage() {
 *   return (
 *     <AuthenticatedPage requireIdentity="teacher" redirectTo="/">
 *       <Container>Admin content</Container>
 *     </AuthenticatedPage>
 *   );
 * }
 */
export const AuthenticatedPage: React.FC<AuthenticatedPageProps> = ({
  children,
  requireAuth = true,
  requireIdentity,
  redirectTo = '/unauthorized',
  showLoadingSpinner = false,
  loadingMessage,
}) => {
  const { user } = useUser();
  const { t } = useTranslation();
  const router = useRouter();

  // Handle redirect for unauthorized users (must be before early returns)
  useEffect(() => {
    if (requireAuth && requireIdentity && user.isRegistered && user.identity !== requireIdentity) {
      console.log(`[AuthenticatedPage] User lacks required identity: ${requireIdentity}. Redirecting to ${redirectTo}`);
      router.push(redirectTo);
    }
  }, [requireAuth, requireIdentity, user.isRegistered, user.identity, redirectTo, router]);

  // If authentication is not required, render children immediately
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Block content rendering for non-authenticated users
  // The OnboardingHandler will show the login modal
  if (!user.isRegistered) {
    if (showLoadingSpinner) {
      return (
        <LoadingSpinner
          message={loadingMessage || t('Loading...')}
          fullScreen
        />
      );
    }
    return null;
  }

  // Check role-based access if required
  if (requireIdentity && user.identity !== requireIdentity) {
    // Show loading while redirecting (redirect happens in useEffect above)
    return (
      <LoadingSpinner
        message={t('Redirecting...')}
        fullScreen
      />
    );
  }

  // User is authenticated and authorized - render the page content
  return <>{children}</>;
};

export default AuthenticatedPage;
