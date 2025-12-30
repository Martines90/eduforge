import { useState, useEffect, useCallback } from 'react';
import { GeneratedTask } from '@/types/task';

const LAST_UNPUBLISHED_TASK_KEY = 'eduforge_last_unpublished_task';

export interface UseLastUnpublishedTaskReturn {
  lastTask: GeneratedTask | null;
  saveTask: (task: GeneratedTask) => void;
  clearTask: () => void;
  hasTask: boolean;
}

/**
 * Hook to manage the last unpublished task in localStorage
 * Works for both guests and registered users
 * Task persists until it's published to the database
 */
export function useLastUnpublishedTask(): UseLastUnpublishedTaskReturn {
  const [lastTask, setLastTask] = useState<GeneratedTask | null>(null);

  // Load task from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const taskJson = localStorage.getItem(LAST_UNPUBLISHED_TASK_KEY);
      if (taskJson) {
        const task = JSON.parse(taskJson) as GeneratedTask;
        setLastTask(task);
        console.log('📋 Last unpublished task loaded from localStorage');
      }
    } catch (err) {
      console.error('Failed to load last unpublished task:', err);
      localStorage.removeItem(LAST_UNPUBLISHED_TASK_KEY);
    }
  }, []);

  /**
   * Save task to localStorage
   * Called after successful task generation
   */
  const saveTask = useCallback((task: GeneratedTask) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(LAST_UNPUBLISHED_TASK_KEY, JSON.stringify(task));
      setLastTask(task);
      console.log('💾 Last unpublished task saved:', task.id);
    } catch (err) {
      console.error('Failed to save last unpublished task:', err);
    }
  }, []);

  /**
   * Clear task from localStorage
   * Called after task is published to database
   */
  const clearTask = useCallback(() => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(LAST_UNPUBLISHED_TASK_KEY);
    setLastTask(null);
    console.log('🧹 Last unpublished task cleared');
  }, []);

  return {
    lastTask,
    saveTask,
    clearTask,
    hasTask: lastTask !== null,
  };
}
