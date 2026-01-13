/**
 * ============================================================================
 * USER TYPES - SINGLE SOURCE OF TRUTH
 * ============================================================================
 * This file contains all user-related types and constants shared between
 * frontend and backend. DO NOT duplicate these definitions elsewhere.
 */

import { Subject } from './subjects';
import { CountryCode } from './countries';
import { GradeLevel } from './grades';

/**
 * User Role (backend perspective)
 * - teacher: Educator creating content
 * - general_user: Student, parent, or other non-teacher
 *
 * Note: Frontend uses UserIdentity which maps to this
 */
export type UserRole = 'teacher' | 'general_user';

/**
 * User Identity (frontend perspective)
 * - teacher: Educator creating content
 * - non-teacher: Student, parent, or other
 *
 * Note: Maps to UserRole on backend (non-teacher -> general_user)
 */
export type UserIdentity = 'teacher' | 'non-teacher';

/**
 * Map frontend identity to backend role
 */
export function identityToRole(identity: UserIdentity): UserRole {
  return identity === 'teacher' ? 'teacher' : 'general_user';
}

/**
 * Map backend role to frontend identity
 */
export function roleToIdentity(role: UserRole): UserIdentity {
  return role === 'teacher' ? 'teacher' : 'non-teacher';
}

/**
 * Educational Model - Teaching philosophy/approach
 */
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

/**
 * User Status
 */
export type UserStatus = 'active' | 'inactive' | 'banned';

/**
 * Subscription Tier
 */
export type SubscriptionTier = 'trial' | 'basic' | 'normal' | 'pro';

/**
 * Subscription Status
 */
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'past_due';

/**
 * User Profile (minimal info for frontend state)
 */
export interface UserProfile {
  email: string;
  name: string;
  registeredAt: string;
  token?: string; // JWT token for authentication
}

/**
 * Subscription Information
 */
export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
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
 * Complete User Data (for API responses)
 */
export interface UserData {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  country: CountryCode;
  subjects?: Subject[]; // For teachers only
  educationalModel?: EducationalModel; // For teachers only
  teacherRole?: GradeLevel; // For teachers only - the grade level they teach
  subscription?: SubscriptionInfo;
  taskCredits?: number; // Remaining task generation credits (for teachers)
  emailVerified?: boolean;
  status?: UserStatus;
}

/**
 * Registration Request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  country: CountryCode;
  subjects?: Subject[]; // For teachers only
  educationalModel?: EducationalModel; // For teachers only
  teacherRole?: GradeLevel; // For teachers only
  recaptchaToken?: string; // reCAPTCHA verification token
}

/**
 * Login Request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Verification Code Request
 */
export interface VerificationCodeRequest {
  email: string;
}

/**
 * Verify Email Request
 */
export interface VerifyEmailRequest {
  email: string;
  code: string;
}

/**
 * Auth Response
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: UserData;
    token?: string;
  };
  error?: string;
}

/**
 * Options for mock user setup (for testing)
 */
export interface MockUserOptions {
  name?: string;
  email?: string;
  identity?: UserIdentity;
  subjects?: Subject[];
  country?: CountryCode;
  shouldFail?: boolean;
}
