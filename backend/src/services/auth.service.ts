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
      subject: userData.subject,
      educationalModel: userData.educationalModel,
    },
  });

  // Send verification email via Firebase Extension
  await db.collection('mail').add({
    to: email.toLowerCase(),
    message: {
      subject: 'EduForge - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1976d2;">Welcome to EduForge!</h2>
          <p>Hello ${userData.name},</p>
          <p>Thank you for registering with EduForge. To complete your registration, please use the following verification code:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #1976d2; margin: 0; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this verification code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message from EduForge. Please do not reply to this email.</p>
        </div>
      `,
      text: `Welcome to EduForge!\n\nYour verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this code, please ignore this email.`,
    },
  });

  console.log('=' .repeat(50));
  console.log(`VERIFICATION CODE EMAIL QUEUED FOR: ${email}`);
  console.log(`CODE: ${code}`);
  console.log('Email will be sent by Firebase Extension');
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
    subject: userData.subject,
    educationalModel: userData.educationalModel,
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
      name: userData.name,
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

  console.log(`[Auth Service] Login attempt for email: ${data.email.toLowerCase()}`);

  // Get user by email
  const userSnapshot = await db.collection('users').where('email', '==', data.email.toLowerCase()).get();

  if (userSnapshot.empty) {
    console.error(`[Auth Service] User not found in 'users' collection for email: ${data.email}`);
    throw new Error('Invalid email or password');
  }

  const userDoc = userSnapshot.docs[0];
  const user = userDoc.data() as UserDocument;
  console.log(`[Auth Service] User found with UID: ${user.uid}`);

  // Check if user is banned
  if (user.status === 'banned') {
    console.error(`[Auth Service] User is banned: ${user.uid}`);
    throw new Error('Account has been banned');
  }

  // Get stored password hash
  const credDoc = await db.collection('userCredentials').doc(user.uid).get();

  if (!credDoc.exists) {
    console.error(`[Auth Service] No credentials found in 'userCredentials' collection for UID: ${user.uid}`);
    throw new Error('Invalid email or password');
  }

  const { hashedPassword } = credDoc.data() as { hashedPassword: string };
  console.log(`[Auth Service] Found hashed password for user: ${user.uid}`);

  // Verify password
  const isValidPassword = await bcrypt.compare(data.password, hashedPassword);
  console.log(`[Auth Service] Password validation result: ${isValidPassword}`);

  if (!isValidPassword) {
    console.error(`[Auth Service] Password mismatch for user: ${user.uid}`);
    throw new Error('Invalid email or password');
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      uid: user.uid,
      email: user.email,
      role: user.role,
      name: user.name,
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
export function verifyToken(token: string): { uid: string; email: string; role: string; name: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { uid: string; email: string; role: string; name: string };
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
