import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

let firebaseApp: admin.app.App;
let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

/**
 * Initialize Firebase Admin SDK
 * Uses service account JSON file for authentication
 */
export function initializeFirebase(): void {
  try {
    // Try multiple paths for service account key (dev vs production)
    const serviceAccountFilename = 'eduforge-d29d9-firebase-adminsdk-fbsvc-744c4f4757.json';
    const possiblePaths = [
      path.join(__dirname, serviceAccountFilename), // dist/config/ (production)
      path.join(__dirname, '../../dist/config', serviceAccountFilename), // from src/config/ to dist/config/
      path.join(process.cwd(), 'src/config', serviceAccountFilename), // absolute from project root
    ];

    let serviceAccountPath: string | null = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        serviceAccountPath = testPath;
        break;
      }
    }

    // Check if service account file exists
    if (!serviceAccountPath) {
      console.warn('⚠️  Firebase service account file not found!');
      console.warn('📝 Tried the following paths:');
      possiblePaths.forEach(p => console.warn(`   - ${p}`));
      console.warn('');
      console.warn('For now, using project ID from environment variable...');

      // Fallback: initialize with project ID only (limited functionality)
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'eduforge-d29d9',
      });
    } else {
      // Initialize with service account
      const serviceAccount = require(serviceAccountPath);

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log(`✅ Firebase Admin SDK initialized successfully (using ${serviceAccountPath})`);
    }

    // Get Firestore and Auth instances
    db = admin.firestore();
    auth = admin.auth();

    // Configure Firestore settings
    db.settings({
      ignoreUndefinedProperties: true,
    });

  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    throw error;
  }
}

/**
 * Get Firebase Admin app instance
 */
export function getFirebaseApp(): admin.app.App {
  if (!firebaseApp) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  return firebaseApp;
}

/**
 * Get Firestore instance
 */
export function getFirestore(): admin.firestore.Firestore {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
}

/**
 * Get Firebase Auth instance
 */
export function getAuth(): admin.auth.Auth {
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }
  return auth;
}

export { admin };
