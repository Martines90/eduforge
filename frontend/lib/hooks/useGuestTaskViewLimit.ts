import { useState, useEffect, useCallback } from 'react';

const GUEST_TASK_VIEW_KEY = 'eduforger_guest_task_views';
const MAX_GUEST_VIEWS = 3;

export interface UseGuestTaskViewLimitReturn {
  viewsRemaining: number;
  totalViews: number;
  canViewTasks: boolean;
  incrementView: () => Promise<void>;
  clearViews: () => void;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to manage guest task viewing limit
 * Uses backend validation with browser fingerprinting to prevent easy bypassing
 * Guests can view individual task details (/tasks/[id]) 3 times before being prompted to register
 * Task listing page (/tasks) is freely accessible without limits
 */
export function useGuestTaskViewLimit(): UseGuestTaskViewLimitReturn {
  const [totalViews, setTotalViews] = useState<number>(0);
  const [viewsRemaining, setViewsRemaining] = useState<number>(MAX_GUEST_VIEWS);
  const [canViewTasks, setCanViewTasks] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load cached views from localStorage on mount (for UI only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const viewsJson = localStorage.getItem(GUEST_TASK_VIEW_KEY);
      if (viewsJson) {
        const cachedData = JSON.parse(viewsJson);
        setTotalViews(cachedData.totalViews || 0);
        setViewsRemaining(cachedData.viewsRemaining || 0);
        setCanViewTasks(cachedData.canViewTasks !== false);
        console.log('📊 Guest task views loaded from cache:', cachedData);
      }
    } catch (err) {
      console.error('Failed to load cached guest task views:', err);
      localStorage.removeItem(GUEST_TASK_VIEW_KEY);
    }
  }, []);

  /**
   * Increment view count via backend API
   * Backend uses browser fingerprinting to track views across localStorage clears
   * Call this when guest opens an individual task detail page (/tasks/[id])
   */
  const incrementView = useCallback(async () => {
    if (typeof window === 'undefined') return;

    setIsLoading(true);
    setError(null);

    try {
      // Call backend to increment view count
      // Backend automatically extracts browser fingerprint from headers
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/auth/guest-task-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        // User has reached viewing limit
        if (result.data?.limitReached) {
          setError(result.message || 'Task viewing limit reached. Please register to continue.');
          setTotalViews(MAX_GUEST_VIEWS);
          setViewsRemaining(0);
          setCanViewTasks(false);

          // Cache in localStorage
          localStorage.setItem(GUEST_TASK_VIEW_KEY, JSON.stringify({
            totalViews: MAX_GUEST_VIEWS,
            viewsRemaining: 0,
            canViewTasks: false,
          }));
          return;
        }

        throw new Error(result.message || 'Failed to track view');
      }

      // Update state with backend response
      const views = result.data.totalViews || 0;
      const remaining = result.data.viewsRemaining || 0;
      const canView = result.data.canViewTasks !== false;

      setTotalViews(views);
      setViewsRemaining(remaining);
      setCanViewTasks(canView);

      // Cache in localStorage for faster UI
      localStorage.setItem(GUEST_TASK_VIEW_KEY, JSON.stringify({
        totalViews: views,
        viewsRemaining: remaining,
        canViewTasks: canView,
      }));

      console.log('📊 Guest task views incremented:', { views, remaining, canView });
    } catch (err) {
      console.error('Failed to increment guest task view:', err);
      setError(err instanceof Error ? err.message : 'Failed to track view');

      // Fallback to localStorage-only tracking if backend fails
      const newViews = totalViews + 1;
      const newRemaining = Math.max(0, MAX_GUEST_VIEWS - newViews);
      const newCanView = newViews < MAX_GUEST_VIEWS;

      setTotalViews(newViews);
      setViewsRemaining(newRemaining);
      setCanViewTasks(newCanView);

      localStorage.setItem(GUEST_TASK_VIEW_KEY, JSON.stringify({
        totalViews: newViews,
        viewsRemaining: newRemaining,
        canViewTasks: newCanView,
      }));
    } finally {
      setIsLoading(false);
    }
  }, [totalViews]);

  /**
   * Clear view count from cache
   * Call this after user registers
   * Note: Backend will still track the fingerprint, but this clears the UI state
   */
  const clearViews = useCallback(() => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(GUEST_TASK_VIEW_KEY);
    setTotalViews(0);
    setViewsRemaining(MAX_GUEST_VIEWS);
    setCanViewTasks(true);
    console.log('🧹 Guest task views cleared from cache');
  }, []);

  return {
    viewsRemaining,
    totalViews,
    canViewTasks,
    incrementView,
    clearViews,
    isLoading,
    error,
  };
}
