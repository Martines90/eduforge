import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth';
import { auth } from './config';
import { createUser, getUserById, markEmailAsVerified } from './users';
import { createVerificationCode, verifyCode } from './verification';
import { UserIdentity, Subject, CountryCode } from '@/types/i18n';

/**
 * Registration data structure
 */
export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  role: UserIdentity;
  subject?: Subject;
  country: CountryCode;
}

/**
 * Register a new user with Firebase Auth and create Firestore document
 */
export async function registerUser(data: RegistrationData): Promise<User> {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const user = userCredential.user;

    // Update display name
    await updateProfile(user, {
      displayName: data.name,
    });

    // Create Firestore user document
    await createUser({
      uid: user.uid,
      email: data.email.toLowerCase(),
      name: data.name,
      role: data.role,
      subjects: data.subject ? [data.subject] : [],
      country: data.country,
    });

    console.log('User registered successfully:', user.uid);

    return user;
  } catch (error: any) {
    console.error('Error registering user:', error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    }

    throw error;
  }
}

/**
 * Send verification code to email
 * In production, this would trigger a Cloud Function to send email
 */
export async function sendVerificationCode(email: string, country: CountryCode): Promise<void> {
  try {
    const code = await createVerificationCode(email, country);

    // TODO: In production, trigger Cloud Function to send email
    // For now, just log it
    console.log('='.repeat(50));
    console.log('VERIFICATION CODE FOR:', email);
    console.log('CODE:', code);
    console.log('(In production, this would be sent via email)');
    console.log('='.repeat(50));

    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
}

/**
 * Verify email with code
 */
export async function verifyEmail(email: string, code: string, country: CountryCode): Promise<boolean> {
  try {
    const isValid = await verifyCode(email, code, country);

    if (isValid && auth.currentUser) {
      // Mark user as verified in Firestore
      await markEmailAsVerified(auth.currentUser.uid, country);
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying email:', error);
    throw error;
  }
}

/**
 * Sign in existing user
 */
export async function loginUser(email: string, password: string): Promise<User> {
  try {
    console.log('[Firebase Auth] Attempting login for:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('[Firebase Auth] User logged in successfully:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error('[Firebase Auth] Error logging in:', error);
    console.error('[Firebase Auth] Error code:', error.code);
    console.error('[Firebase Auth] Error message:', error.message);

    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    } else if (error.code === 'auth/invalid-credential') {
      throw new Error('Invalid email or password');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed login attempts. Please try again later.');
    }

    throw error;
  }
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
    console.log('User logged out successfully');
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (typeof window === 'undefined' || !auth) {
    console.warn('[onAuthChange] Auth not available (SSR or not initialized)');
    return () => {}; // Return no-op unsubscribe function
  }
  console.log('[onAuthChange] Setting up Firebase auth listener');
  return onAuthStateChanged(auth, callback);
}
