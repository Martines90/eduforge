import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { getFirestore, getAuth } from '../config/firebase.config';
import {
  RegisterRequest,
  LoginRequest,
  UserDocument,
  VerificationCodeDocument,
} from '../types/auth.types';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = '7d';

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create verification code and store in temporary collection (not in users yet)
 */
export async function createVerificationCode(email: string, userData: RegisterRequest): Promise<string> {
  const db = getFirestore();
  const code = generateVerificationCode();

  // Create expiration time (15 minutes from now)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  const codeData: VerificationCodeDocument = {
    email: email.toLowerCase(),
    code,
    createdAt: new Date() as any,
    expiresAt: expiresAt as any,
    attempts: 0,
  };

  // Store verification code with pending registration data
  await db.collection('pendingRegistrations').doc(email.toLowerCase()).set({
    ...codeData,
    pendingUserData: {
      name: userData.name,
      password: await bcrypt.hash(userData.password, SALT_ROUNDS),
      role: userData.role,
      country: userData.country,
    },
  });

  console.log('=' .repeat(50));
  console.log(`VERIFICATION CODE FOR: ${email}`);
  console.log(`CODE: ${code}`);
  console.log('(In production, this would be sent via email)');
  console.log('='.repeat(50));

  return code;
}

/**
 * Verify code and create user account
 */
export async function verifyCodeAndCreateUser(email: string, code: string): Promise<{ uid: string; token: string }> {
  const db = getFirestore();
  const auth = getAuth();

  // Get pending registration
  const pendingDoc = await db.collection('pendingRegistrations').doc(email.toLowerCase()).get();

  if (!pendingDoc.exists) {
    throw new Error('No pending registration found for this email');
  }

  const pendingData = pendingDoc.data();

  // Check if code exists
  if (!pendingData?.code || !pendingData?.expiresAt) {
    throw new Error('Invalid verification code');
  }

  // Check if expired
  const now = new Date();
  const expiresAt = pendingData.expiresAt.toDate();

  if (now > expiresAt) {
    // Delete expired pending registration
    await db.collection('pendingRegistrations').doc(email.toLowerCase()).delete();
    throw new Error('Verification code has expired');
  }

  // Check max attempts
  if (pendingData.attempts >= 5) {
    throw new Error('Too many failed attempts');
  }

  // Verify code
  if (pendingData.code !== code) {
    // Increment attempts
    await db.collection('pendingRegistrations').doc(email.toLowerCase()).update({
      attempts: pendingData.attempts + 1,
    });
    throw new Error('Invalid verification code');
  }

  // Code is valid - create the user now
  const userData = pendingData.pendingUserData;

  // Check if Firebase Auth user already exists (from previous failed attempt)
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email.toLowerCase());
    console.log(`Firebase Auth user already exists for ${email}, reusing UID: ${userRecord.uid}`);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      // Create new Firebase Auth user
      userRecord = await auth.createUser({
        email: email.toLowerCase(),
        password: Math.random().toString(36), // Random password (we store hashed version separately)
        displayName: userData.name,
        emailVerified: true, // Email is verified since they confirmed the code
      });
    } else {
      throw error;
    }
  }

  // Create user document in Firestore
  const userDoc: UserDocument = {
    uid: userRecord.uid,
    email: email.toLowerCase(),
    name: userData.name,
    role: userData.role,
    country: userData.country,
    status: 'active', // User is active immediately after verification
    emailVerified: true,
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
  };

  await db.collection('users').doc(userRecord.uid).set(userDoc);

  // Store hashed password separately
  await db.collection('userCredentials').doc(userRecord.uid).set({
    hashedPassword: userData.password, // Already hashed when stored in pending
    updatedAt: new Date(),
  });

  // Delete pending registration
  await db.collection('pendingRegistrations').doc(email.toLowerCase()).delete();

  // Generate JWT token
  const token = jwt.sign(
    {
      uid: userRecord.uid,
      email: email.toLowerCase(),
      role: userData.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    uid: userRecord.uid,
    token,
  };
}

/**
 * Initiate registration - store verification code only (no user created yet)
 */
export async function initiateRegistration(data: RegisterRequest): Promise<string> {
  const db = getFirestore();
  const auth = getAuth();

  // Check if user already exists in Firestore
  const existingUser = await db.collection('users').where('email', '==', data.email.toLowerCase()).get();

  if (!existingUser.empty) {
    throw new Error('Email already registered');
  }

  // Check if user exists in Firebase Auth (from previous failed registration)
  try {
    const authUser = await auth.getUserByEmail(data.email.toLowerCase());
    // User exists in Auth but not in Firestore - delete the orphaned auth user
    await auth.deleteUser(authUser.uid);
    console.log(`Deleted orphaned Firebase Auth user: ${data.email}`);
  } catch (error: any) {
    // User doesn't exist in Auth, which is fine
    if (error.code !== 'auth/user-not-found') {
      console.error('Error checking Firebase Auth user:', error);
    }
  }

  // Check if there's already a pending registration
  const pendingDoc = await db.collection('pendingRegistrations').doc(data.email.toLowerCase()).get();
  if (pendingDoc.exists) {
    // Delete old pending registration
    await db.collection('pendingRegistrations').doc(data.email.toLowerCase()).delete();
  }

  // Create and store verification code
  const code = await createVerificationCode(data.email, data);

  return code;
}

/**
 * Login user
 */
export async function loginUser(data: LoginRequest): Promise<{ user: UserDocument; token: string }> {
  const db = getFirestore();

  // Get user by email
  const userSnapshot = await db.collection('users').where('email', '==', data.email.toLowerCase()).get();

  if (userSnapshot.empty) {
    throw new Error('Invalid email or password');
  }

  const userDoc = userSnapshot.docs[0];
  const user = userDoc.data() as UserDocument;

  // Check if user is banned
  if (user.status === 'banned') {
    throw new Error('Account has been banned');
  }

  // Get stored password hash
  const credDoc = await db.collection('userCredentials').doc(user.uid).get();

  if (!credDoc.exists) {
    throw new Error('Invalid email or password');
  }

  const { hashedPassword } = credDoc.data() as { hashedPassword: string };

  // Verify password
  const isValidPassword = await bcrypt.compare(data.password, hashedPassword);

  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      uid: user.uid,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { user, token };
}

/**
 * Get user by UID
 */
export async function getUserById(uid: string): Promise<UserDocument | null> {
  const db = getFirestore();
  const userDoc = await db.collection('users').doc(uid).get();

  if (!userDoc.exists) {
    return null;
  }

  return userDoc.data() as UserDocument;
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): { uid: string; email: string; role: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { uid: string; email: string; role: string };
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
