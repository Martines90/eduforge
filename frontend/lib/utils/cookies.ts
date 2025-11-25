import Cookies from 'js-cookie';

export const COOKIE_NAMES = {
  COUNTRY: 'eduforge_country',
  FIRST_VISIT: 'eduforge_first_visit',
  IDENTITY: 'eduforge_identity',
  ROLE: 'eduforge_role',
  SUBJECT: 'eduforge_subject',
  USER_PROFILE: 'eduforge_user_profile',
  IS_REGISTERED: 'eduforge_is_registered',
} as const;

// Cookie expiration: 365 days (1 year)
const COOKIE_OPTIONS = {
  expires: 365,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

/**
 * Get a cookie value
 */
export function getCookie(name: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return Cookies.get(name);
}

/**
 * Set a cookie value with long expiration (1 year)
 */
export function setCookie(name: string, value: string): void {
  if (typeof window === 'undefined') return;
  Cookies.set(name, value, COOKIE_OPTIONS);
}

/**
 * Remove a cookie
 */
export function removeCookie(name: string): void {
  if (typeof window === 'undefined') return;
  Cookies.remove(name);
}

/**
 * Check if this is user's first visit (no country cookie set)
 */
export function isFirstVisit(): boolean {
  return !getCookie(COOKIE_NAMES.COUNTRY);
}

/**
 * Mark that user has completed first visit setup
 */
export function markVisitComplete(): void {
  setCookie(COOKIE_NAMES.FIRST_VISIT, 'true');
}
