import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

/**
 * Verification code document structure
 */
export interface VerificationCode {
  email: string;
  code: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  attempts: number;
}

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store verification code in Firestore
 * Expires after 15 minutes
 */
export async function createVerificationCode(email: string): Promise<string> {
  try {
    const code = generateVerificationCode();
    const codeRef = doc(db, 'verificationCodes', email.toLowerCase());

    // Create expiration time (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await setDoc(codeRef, {
      email: email.toLowerCase(),
      code,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      attempts: 0,
    });

    console.log('Verification code created for:', email);
    console.log('Code (for testing):', code); // In production, send via email

    return code;
  } catch (error) {
    console.error('Error creating verification code:', error);
    throw error;
  }
}

/**
 * Verify the code entered by user
 */
export async function verifyCode(email: string, code: string): Promise<boolean> {
  try {
    const codeRef = doc(db, 'verificationCodes', email.toLowerCase());
    const codeSnap = await getDoc(codeRef);

    if (!codeSnap.exists()) {
      console.log('No verification code found for:', email);
      return false;
    }

    const data = codeSnap.data() as VerificationCode;

    // Check if code has expired
    const now = new Date();
    const expiresAt = data.expiresAt.toDate();

    if (now > expiresAt) {
      console.log('Verification code expired');
      await deleteDoc(codeRef); // Clean up expired code
      return false;
    }

    // Check if too many attempts (max 5)
    if (data.attempts >= 5) {
      console.log('Too many verification attempts');
      return false;
    }

    // Verify the code
    if (data.code === code) {
      // Success - delete the code
      await deleteDoc(codeRef);
      console.log('Verification code valid for:', email);
      return true;
    } else {
      // Failed attempt - increment counter
      await setDoc(
        codeRef,
        { attempts: data.attempts + 1 },
        { merge: true }
      );
      console.log('Invalid verification code');
      return false;
    }
  } catch (error) {
    console.error('Error verifying code:', error);
    throw error;
  }
}

/**
 * Delete verification code (cleanup)
 */
export async function deleteVerificationCode(email: string): Promise<void> {
  try {
    const codeRef = doc(db, 'verificationCodes', email.toLowerCase());
    await deleteDoc(codeRef);
    console.log('Verification code deleted for:', email);
  } catch (error) {
    console.error('Error deleting verification code:', error);
    throw error;
  }
}

/**
 * Resend verification code (generates new code)
 */
export async function resendVerificationCode(email: string): Promise<string> {
  try {
    // Delete old code if exists
    await deleteVerificationCode(email);

    // Create new code
    const newCode = await createVerificationCode(email);

    return newCode;
  } catch (error) {
    console.error('Error resending verification code:', error);
    throw error;
  }
}
