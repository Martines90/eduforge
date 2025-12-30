import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/lib/context/UserContext';

const GUEST_TOKEN_KEY = 'eduforge_guest_token';
const GUEST_SESSION_KEY = 'eduforge_guest_session';
const GUEST_LAST_TASK_KEY = 'eduforge_guest_last_task';

// Universal key for last unpublished task (works for both guests and registered users)
export const LAST_UNPUBLISHED_TASK_KEY = 'eduforge_last_unpublished_task';

export interface GuestSessionData {
  token: string;
  sessionId: string;
  generationsUsed: number;
  maxGenerations: number;
  generationsRemaining: number;
  canGenerate: boolean;
}

export interface UseGuestSessionReturn {
  guestToken: string | null;
  guestSession: GuestSessionData | null;
  isGuest: boolean;
  generationsRemaining: number;
  canGenerate: boolean;
  createGuestSession: () => Promise<void>;
  incrementGeneration: () => void;
  clearGuestSession: () => void;
  saveLastTask: (task: any) => void;
  getLastTask: () => any | null;
  clearLastTask: () => void;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to manage guest session for freemium users
 * Handles token creation, storage, and generation tracking
 */
export function useGuestSession(): UseGuestSessionReturn {
  const { user } = useUser();
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [guestSession, setGuestSession] = useState<GuestSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGuest = !user.isRegistered;

  // Load guest session from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // If user is registered, clear any guest session
    if (user.isRegistered) {
      clearGuestSession();
      return;
    }

    // Load guest token and session from localStorage
    const storedToken = localStorage.getItem(GUEST_TOKEN_KEY);
    const storedSession = localStorage.getItem(GUEST_SESSION_KEY);

    if (storedToken) {
      setGuestToken(storedToken);
    }

    if (storedSession) {
      try {
        const session = JSON.parse(storedSession) as GuestSessionData;
        setGuestSession(session);
      } catch (err) {
        console.error('Failed to parse guest session:', err);
        clearGuestSession();
      }
    }
  }, [user.isRegistered]);

  /**
   * Create a new guest session by calling the backend
   */
  const createGuestSession = useCallback(async () => {
    if (user.isRegistered) {
      // User is registered, no need for guest session
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call backend to create guest token
      // Backend automatically extracts browser fingerprint from headers
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/auth/guest-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        // User has already exhausted their free generations
        if (result.data?.limitReached) {
          setError(result.message || 'Generation limit reached. Please register to continue.');
          setGuestSession({
            token: '',
            sessionId: '',
            generationsUsed: 3,
            maxGenerations: 3,
            generationsRemaining: 0,
            canGenerate: false,
          });
          return;
        }

        throw new Error(result.message || 'Failed to create guest session');
      }

      const sessionData: GuestSessionData = {
        token: result.data.token,
        sessionId: result.data.sessionId,
        generationsUsed: result.data.generationsUsed || 0,
        maxGenerations: result.data.maxGenerations || 3,
        generationsRemaining: result.data.generationsRemaining || 3,
        canGenerate: result.data.canGenerate !== false,
      };

      // Store in state
      setGuestToken(sessionData.token);
      setGuestSession(sessionData);

      // Persist in localStorage
      localStorage.setItem(GUEST_TOKEN_KEY, sessionData.token);
      localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(sessionData));

      console.log('✅ Guest session created:', sessionData.sessionId);
    } catch (err) {
      console.error('Failed to create guest session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create guest session');
    } finally {
      setIsLoading(false);
    }
  }, [user.isRegistered]);

  /**
   * Increment generation count locally (backend handles the actual increment)
   * Call this after a successful task generation
   */
  const incrementGeneration = useCallback(() => {
    if (!guestSession) return;

    const updatedSession: GuestSessionData = {
      ...guestSession,
      generationsUsed: guestSession.generationsUsed + 1,
      generationsRemaining: Math.max(0, guestSession.generationsRemaining - 1),
      canGenerate: guestSession.generationsRemaining > 1, // Can still generate if remaining > 1
    };

    setGuestSession(updatedSession);
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(updatedSession));
  }, [guestSession]);

  /**
   * Save last generated task to localStorage
   * Called after successful task generation
   */
  const saveLastTask = useCallback((task: any) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(GUEST_LAST_TASK_KEY, JSON.stringify(task));
      console.log('💾 Guest last task saved');
    } catch (err) {
      console.error('Failed to save last task:', err);
    }
  }, []);

  /**
   * Get last generated task from localStorage
   * Returns null if no task exists
   */
  const getLastTask = useCallback((): any | null => {
    if (typeof window === 'undefined') return null;

    try {
      const taskJson = localStorage.getItem(GUEST_LAST_TASK_KEY);
      if (taskJson) {
        return JSON.parse(taskJson);
      }
    } catch (err) {
      console.error('Failed to retrieve last task:', err);
    }
    return null;
  }, []);

  /**
   * Clear last task from localStorage
   * Called after one-time restoration
   */
  const clearLastTask = useCallback(() => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(GUEST_LAST_TASK_KEY);
    console.log('🧹 Guest last task cleared');
  }, []);

  /**
   * Clear guest session from memory and localStorage
   * Called after user registers
   * NOTE: Does NOT clear last task - that's preserved for post-registration restoration
   */
  const clearGuestSession = useCallback(() => {
    setGuestToken(null);
    setGuestSession(null);
    setError(null);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_TOKEN_KEY);
      localStorage.removeItem(GUEST_SESSION_KEY);
      // Note: We intentionally keep GUEST_LAST_TASK_KEY for restoration
    }

    console.log('🧹 Guest session cleared (last task preserved)');
  }, []);

  return {
    guestToken,
    guestSession,
    isGuest,
    generationsRemaining: guestSession?.generationsRemaining || 0,
    canGenerate: guestSession?.canGenerate !== false,
    createGuestSession,
    incrementGeneration,
    clearGuestSession,
    saveLastTask,
    getLastTask,
    clearLastTask,
    isLoading,
    error,
  };
}
