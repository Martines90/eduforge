import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { UserIdentity, Subject, CountryCode } from '@/types/i18n';

/**
 * User document structure in Firestore
 */
export interface FirebaseUser {
  uid: string;
  email: string;
  name: string;
  role: UserIdentity;
  subject?: Subject;
  country: CountryCode;
  emailVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Create a new user in Firestore
 */
export async function createUser(userData: {
  uid: string;
  email: string;
  name: string;
  role: UserIdentity;
  subject?: Subject;
  country: CountryCode;
}): Promise<void> {
  try {
    const userRef = doc(db, 'users', userData.uid);

    await setDoc(userRef, {
      ...userData,
      emailVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('User created successfully in Firestore:', userData.uid);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Get user by UID
 */
export async function getUserById(uid: string): Promise<FirebaseUser | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as FirebaseUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<FirebaseUser | null> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as FirebaseUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

/**
 * Update user email verification status
 */
export async function markEmailAsVerified(uid: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      emailVerified: true,
      updatedAt: serverTimestamp(),
    });

    console.log('User email marked as verified:', uid);
  } catch (error) {
    console.error('Error marking email as verified:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Omit<FirebaseUser, 'uid' | 'createdAt'>>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log('User profile updated:', uid);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}
