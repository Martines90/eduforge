import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Hook to get the current auth token
 * Tries localStorage JWT first (backend login), falls back to Firebase token
 * Automatically refreshes when auth state changes
 */
export function useFirebaseToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    let firebaseUnsubscribe: (() => void) | undefined;

    const checkToken = async () => {
      // Check for backend JWT token in localStorage first
      const backendToken = localStorage.getItem('authToken');
      if (backendToken) {
        console.log('[useFirebaseToken] Using backend JWT token from localStorage');
        setToken(backendToken);
        setError(null);
        setLoading(false);
        return;
      }

      // If no backend token, try Firebase Auth
      if (!auth) {
        console.log('[useFirebaseToken] No backend token and Firebase not available');
        setToken(null);
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // Set up Firebase Auth listener
      firebaseUnsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const idToken = await user.getIdToken();
            console.log('[useFirebaseToken] Using Firebase ID token');
            setToken(idToken);
            setError(null);
          } catch (err) {
            console.error('[useFirebaseToken] Error getting Firebase token:', err);
            setError(err instanceof Error ? err.message : 'Failed to get token');
            setToken(null);
          }
        } else {
          console.log('[useFirebaseToken] No Firebase user and no backend token');
          setToken(null);
          setError('Not authenticated');
        }
        setLoading(false);
      });
    };

    checkToken();

    // Listen for storage events to detect when authToken is added/removed in other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken') {
        console.log('[useFirebaseToken] authToken changed in localStorage, re-checking...');
        checkToken();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom event dispatched in the same tab
    const handleAuthTokenChange = () => {
      console.log('[useFirebaseToken] authToken changed (same tab), re-checking...');
      checkToken();
    };

    window.addEventListener('authTokenChanged', handleAuthTokenChange);

    return () => {
      if (firebaseUnsubscribe) {
        firebaseUnsubscribe();
      }
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authTokenChanged', handleAuthTokenChange);
    };
  }, []);

  return { token, loading, error };
}
