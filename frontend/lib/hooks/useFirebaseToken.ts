import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Hook to get the current auth token
 * Tries Firebase token first, falls back to localStorage JWT
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
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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

    return () => unsubscribe();
  }, []);

  return { token, loading, error };
}
