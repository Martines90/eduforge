import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getFirestore, admin } from '../config/firebase.config';
import crypto from 'crypto';

const FieldValue = admin.firestore.FieldValue;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const GUEST_TOKEN_EXPIRY = '24h'; // Guest tokens expire after 24 hours
const MAX_GUEST_GENERATIONS = 3; // Maximum free generations for guests

export interface GuestTokenPayload {
  sessionId: string;
  generationsUsed: number;
  maxGenerations: number;
  createdAt: Date;
  type: 'guest';
}

export interface GuestSession {
  sessionId: string;
  generationsUsed: number;
  maxGenerations: number;
  createdAt: Date;
  lastGenerationAt?: Date;
  ipAddress?: string;
  browserFingerprint?: string;
  userAgent?: string;
  lastTaskId?: string; // Store the last generated task ID
  convertedToUser?: boolean; // Track if this guest converted to registered user
  convertedUserId?: string; // User ID if converted
}

export interface BrowserFingerprint {
  userAgent: string;
  acceptLanguage?: string;
  acceptEncoding?: string;
  ipAddress: string;
}

/**
 * Generate a fingerprint hash from browser characteristics
 * This helps track users across sessions even if they clear cookies/incognito
 */
export function generateFingerprint(data: BrowserFingerprint): string {
  const fingerprintString = `${data.userAgent}|${data.acceptLanguage || ''}|${data.acceptEncoding || ''}|${data.ipAddress}`;
  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
}

/**
 * Get Firestore collection for guest sessions
 */
function getGuestSessionsCollection() {
  const db = getFirestore();
  return db.collection('guestSessions');
}

/**
 * Check if a browser fingerprint has already used all free generations
 * This prevents abuse via incognito mode / clearing cookies
 */
export async function checkFingerprintLimit(fingerprint: string): Promise<{
  canGenerate: boolean;
  totalGenerations: number;
  existingSessionId?: string;
}> {
  const sessionsRef = getGuestSessionsCollection();

  // Query all sessions with this fingerprint
  const snapshot = await sessionsRef
    .where('browserFingerprint', '==', fingerprint)
    .get();

  let totalGenerations = 0;
  let mostRecentSession: string | undefined;
  let mostRecentTime = 0;

  snapshot.forEach(doc => {
    const session = doc.data() as GuestSession;
    totalGenerations += session.generationsUsed;

    const sessionTime = session.lastGenerationAt
      ? new Date(session.lastGenerationAt).getTime()
      : new Date(session.createdAt).getTime();

    if (sessionTime > mostRecentTime) {
      mostRecentTime = sessionTime;
      mostRecentSession = session.sessionId;
    }
  });

  return {
    canGenerate: totalGenerations < MAX_GUEST_GENERATIONS,
    totalGenerations,
    existingSessionId: mostRecentSession,
  };
}

/**
 * Create a new guest session and return a JWT token
 * Enforces fingerprint-based limits to prevent abuse
 */
export async function createGuestToken(
  ipAddress: string,
  fingerprint: BrowserFingerprint
): Promise<{ token: string; sessionId: string; canGenerate: boolean; message?: string }> {
  const fingerprintHash = generateFingerprint(fingerprint);

  // Check if this fingerprint has already used all free generations
  const fingerprintCheck = await checkFingerprintLimit(fingerprintHash);

  if (!fingerprintCheck.canGenerate) {
    // Fingerprint has reached limit - return existing session with limit message
    return {
      token: '', // No new token
      sessionId: fingerprintCheck.existingSessionId || '',
      canGenerate: false,
      message: `This device has already used ${MAX_GUEST_GENERATIONS} free generations. Please register to continue.`,
    };
  }

  const sessionId = uuidv4();

  const guestSession: GuestSession = {
    sessionId,
    generationsUsed: 0,
    maxGenerations: MAX_GUEST_GENERATIONS,
    createdAt: new Date(),
    ipAddress,
    browserFingerprint: fingerprintHash,
    userAgent: fingerprint.userAgent,
  };

  // Store session in Firestore (survives server restart, incognito, etc.)
  const sessionsRef = getGuestSessionsCollection();
  await sessionsRef.doc(sessionId).set({
    ...guestSession,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Create JWT token
  const payload: GuestTokenPayload = {
    sessionId,
    generationsUsed: 0,
    maxGenerations: MAX_GUEST_GENERATIONS,
    createdAt: new Date(),
    type: 'guest',
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: GUEST_TOKEN_EXPIRY,
  });

  console.log(`✅ Guest token created: ${sessionId} (Fingerprint: ${fingerprintHash.substring(0, 8)}..., IP: ${ipAddress})`);

  return { token, sessionId, canGenerate: true };
}

/**
 * Verify and decode a guest token
 */
export async function verifyGuestToken(token: string): Promise<GuestTokenPayload> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as GuestTokenPayload;

    if (decoded.type !== 'guest') {
      throw new Error('Invalid guest token: not a guest type');
    }

    // Check if session exists in Firestore
    const sessionDoc = await getGuestSessionsCollection().doc(decoded.sessionId).get();

    if (!sessionDoc.exists) {
      throw new Error('Guest session not found or expired');
    }

    const session = sessionDoc.data() as GuestSession;

    // Return the current session data from Firestore (source of truth)
    return {
      sessionId: session.sessionId,
      generationsUsed: session.generationsUsed,
      maxGenerations: session.maxGenerations,
      createdAt: session.createdAt,
      type: 'guest',
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid guest token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Guest token expired');
    }
    throw error;
  }
}

/**
 * Increment the generation count for a guest session
 * Also checks fingerprint-based global limit
 */
export async function incrementGuestGeneration(
  sessionId: string,
  taskId: string
): Promise<GuestSession> {
  const sessionRef = getGuestSessionsCollection().doc(sessionId);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists) {
    throw new Error('Guest session not found');
  }

  const session = sessionDoc.data() as GuestSession;

  // Check fingerprint-based limit (global across all sessions)
  if (session.browserFingerprint) {
    const fingerprintCheck = await checkFingerprintLimit(session.browserFingerprint);

    if (!fingerprintCheck.canGenerate) {
      throw new Error(
        `Generation limit reached (${fingerprintCheck.totalGenerations}/${MAX_GUEST_GENERATIONS}). ` +
        `Please register to get 100 free task generation credits!`
      );
    }
  }

  // Check individual session limit
  if (session.generationsUsed >= session.maxGenerations) {
    throw new Error(
      `Guest generation limit reached (${session.maxGenerations}/${session.maxGenerations}). ` +
      `Please register to continue.`
    );
  }

  // Increment counter and store last task ID
  const updatedSession: Partial<GuestSession> = {
    generationsUsed: session.generationsUsed + 1,
    lastGenerationAt: new Date(),
    lastTaskId: taskId, // Store the task ID so we can restore it after registration
  };

  await sessionRef.update({
    ...updatedSession,
    lastGenerationAt: FieldValue.serverTimestamp(),
  });

  console.log(`📊 Guest generation incremented: ${sessionId} (${updatedSession.generationsUsed}/${session.maxGenerations})`);

  return { ...session, ...updatedSession } as GuestSession;
}

/**
 * Get the current state of a guest session
 */
export async function getGuestSession(sessionId: string): Promise<GuestSession | null> {
  const sessionDoc = await getGuestSessionsCollection().doc(sessionId).get();

  if (!sessionDoc.exists) {
    return null;
  }

  return sessionDoc.data() as GuestSession;
}

/**
 * Check if a guest session can generate more tasks
 */
export async function canGuestGenerate(sessionId: string): Promise<boolean> {
  const session = await getGuestSession(sessionId);
  if (!session) return false;

  // Check individual session limit
  if (session.generationsUsed >= session.maxGenerations) {
    return false;
  }

  // Check fingerprint-based global limit
  if (session.browserFingerprint) {
    const fingerprintCheck = await checkFingerprintLimit(session.browserFingerprint);
    return fingerprintCheck.canGenerate;
  }

  return true;
}

/**
 * Get remaining generations for a guest session
 */
export async function getRemainingGenerations(sessionId: string): Promise<number> {
  const session = await getGuestSession(sessionId);
  if (!session) return 0;

  // Check fingerprint-based global limit
  if (session.browserFingerprint) {
    const fingerprintCheck = await checkFingerprintLimit(session.browserFingerprint);
    const remaining = MAX_GUEST_GENERATIONS - fingerprintCheck.totalGenerations;
    return Math.max(0, remaining);
  }

  return Math.max(0, session.maxGenerations - session.generationsUsed);
}

/**
 * Get the last generated task for a guest session
 * Used to restore task after registration
 */
export async function getGuestLastTask(sessionId: string): Promise<string | null> {
  const session = await getGuestSession(sessionId);
  return session?.lastTaskId || null;
}

/**
 * Mark a guest session as converted to registered user
 * This prevents the session from being used again
 */
export async function markGuestConverted(sessionId: string, userId: string): Promise<void> {
  await getGuestSessionsCollection().doc(sessionId).update({
    convertedToUser: true,
    convertedUserId: userId,
    convertedAt: FieldValue.serverTimestamp(),
  });

  console.log(`✅ Guest session ${sessionId} marked as converted to user ${userId}`);
}

/**
 * Clean up expired guest sessions (run periodically)
 * Removes sessions older than 7 days
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const now = new Date();
  const expiryTime = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const expiryDate = new Date(now.getTime() - expiryTime);

  const sessionsRef = getGuestSessionsCollection();
  const snapshot = await sessionsRef
    .where('createdAt', '<', expiryDate)
    .get();

  let cleanedCount = 0;

  // Delete expired sessions in batches
  const batch = getFirestore().batch();
  snapshot.forEach(doc => {
    batch.delete(doc.ref);
    cleanedCount++;
  });

  await batch.commit();

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired guest session(s)`);
  }

  return cleanedCount;
}

/**
 * Rate limiting: Check if IP + fingerprint has exceeded generation limit
 */
export async function checkRateLimit(
  fingerprint: string,
  ipAddress: string,
  limit: number = 10,
  timeWindowMs: number = 60 * 60 * 1000
): Promise<{ allowed: boolean; generationsInWindow: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - timeWindowMs);

  const sessionsRef = getGuestSessionsCollection();

  // Query sessions with matching fingerprint OR IP within time window
  const snapshot = await sessionsRef
    .where('lastGenerationAt', '>=', windowStart)
    .get();

  let generationsInWindow = 0;

  snapshot.forEach(doc => {
    const session = doc.data() as GuestSession;
    if (
      session.browserFingerprint === fingerprint ||
      session.ipAddress === ipAddress
    ) {
      generationsInWindow += session.generationsUsed;
    }
  });

  return {
    allowed: generationsInWindow < limit,
    generationsInWindow,
  };
}
