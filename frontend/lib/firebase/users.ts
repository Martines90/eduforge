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
import { getUserPath, getUsersCollectionPath } from './paths';

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
 * Now stores users under their country: countries/{country}/users/{uid}
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
    const userPath = getUserPath(userData.country, userData.uid);
    const userRef = doc(db, userPath);

    await setDoc(userRef, {
      ...userData,
      emailVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log(`User created successfully in Firestore: ${userPath}`);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Get user by UID
 * Note: Since we need the country to construct the path, we must know the user's country
 * In practice, this will be called after authentication when we have the country info
 */
export async function getUserById(uid: string, country: CountryCode): Promise<FirebaseUser | null> {
  try {
    const userPath = getUserPath(country, uid);
    const userRef = doc(db, userPath);
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
 * Get user by email within a specific country
 */
export async function getUserByEmail(email: string, country: CountryCode): Promise<FirebaseUser | null> {
  try {
    const usersPath = getUsersCollectionPath(country);
    const usersRef = collection(db, usersPath);
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
export async function markEmailAsVerified(uid: string, country: CountryCode): Promise<void> {
  try {
    const userPath = getUserPath(country, uid);
    const userRef = doc(db, userPath);
    await updateDoc(userRef, {
      emailVerified: true,
      updatedAt: serverTimestamp(),
    });

    console.log(`User email marked as verified: ${userPath}`);
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
  country: CountryCode,
  updates: Partial<Omit<FirebaseUser, 'uid' | 'createdAt'>>
): Promise<void> {
  try {
    const userPath = getUserPath(country, uid);
    const userRef = doc(db, userPath);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log(`User profile updated: ${userPath}`);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}
