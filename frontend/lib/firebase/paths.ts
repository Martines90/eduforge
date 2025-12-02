import { CountryCode } from '@/types/i18n';

/**
 * Firestore Database Structure Helpers
 *
 * Database structure with country as first level:
 *
 * countries/
 *   {countryCode}/
 *     users/
 *       {userId}/
 *     tasks/
 *       {taskId}/
 *     verificationCodes/
 *       {email}/
 */

/**
 * Get the base country collection path
 */
export function getCountryPath(country: CountryCode): string {
  return `countries/${country}`;
}

/**
 * Get the users collection path for a specific country
 */
export function getUsersCollectionPath(country: CountryCode): string {
  return `${getCountryPath(country)}/users`;
}

/**
 * Get a specific user document path
 */
export function getUserPath(country: CountryCode, userId: string): string {
  return `${getUsersCollectionPath(country)}/${userId}`;
}

/**
 * Get the verification codes collection path for a specific country
 */
export function getVerificationCodesPath(country: CountryCode): string {
  return `${getCountryPath(country)}/verificationCodes`;
}

/**
 * Get a specific verification code document path
 */
export function getVerificationCodePath(country: CountryCode, email: string): string {
  return `${getVerificationCodesPath(country)}/${email.toLowerCase()}`;
}

/**
 * Get the tasks collection path for a specific country
 */
export function getTasksCollectionPath(country: CountryCode): string {
  return `${getCountryPath(country)}/tasks`;
}

/**
 * Get a specific task document path
 */
export function getTaskPath(country: CountryCode, taskId: string): string {
  return `${getTasksCollectionPath(country)}/${taskId}`;
}
