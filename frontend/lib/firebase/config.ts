import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSDVt79o65rIM1bhk36A7bPRlxpwTjST8",
  authDomain: "eduforge-d29d9.firebaseapp.com",
  projectId: "eduforge-d29d9",
  storageBucket: "eduforge-d29d9.firebasestorage.app",
  messagingSenderId: "44732850530",
  appId: "1:44732850530:web:16adc6df5ff2804858cc3b"
};

// Initialize Firebase (only once)
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (typeof window !== 'undefined') {
  // Only initialize on client side
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  db = getFirestore(app);
  auth = getAuth(app);

  // Set persistence to LOCAL (browser localStorage)
  // This ensures the user stays logged in after page reloads
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('[Firebase] Auth persistence set to LOCAL');
    })
    .catch((error) => {
      console.error('[Firebase] Error setting auth persistence:', error);
    });
}

export { app, db, auth };
