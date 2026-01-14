'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { NavigationTopic, SelectionPathItem, GradeLevel } from '@/types/navigation';

export interface UseCascadingSelectProps {
  data: NavigationTopic[];
  initialPath?: string[]; // Array of topic keys to pre-select
}

export interface UseCascadingSelectReturn {
  selectionPath: SelectionPathItem[];
  availableOptions: NavigationTopic[][];
  selectOption: (level: number, topicName: string) => void;
  resetFrom: (level: number) => void;
  reset: () => void;
  isComplete: boolean;
  finalSelection: NavigationTopic | null;
}

/**
 * Custom hook for managing cascading select logic
 * Handles hierarchical navigation through topics and sub-topics
 */
export const useCascadingSelect = ({ data, initialPath }: UseCascadingSelectProps): UseCascadingSelectReturn => {
  const [selectionPath, setSelectionPath] = useState<SelectionPathItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize with preset path from URL params
  useEffect(() => {
    if (initialPath && initialPath.length > 0 && !initialized && data.length > 0) {
      const buildPath = (keys: string[], currentData: NavigationTopic[], level: number = 0): SelectionPathItem[] => {
        if (keys.length === 0 || !currentData) return [];

        const currentKey = keys[0];
        // Try to match by key first (exact match), then fall back to name (case-insensitive)
        const found = currentData.find(topic =>
          topic.key === currentKey || topic.name.toLowerCase() === currentKey.toLowerCase()
        );

        if (!found) {
          console.warn(`Topic with key or name "${currentKey}" not found at level ${level}`);
          return [];
        }

        const pathItem: SelectionPathItem = {
          level,
          topic: found,
          key: found.key, // Machine-readable key for curriculum path
          displayName: found.name, // Human-readable name for display
        };

        if (keys.length === 1) {
          return [pathItem];
        }

        const subPath = buildPath(keys.slice(1), found.sub_topics || [], level + 1);
        return [pathItem, ...subPath];
      };

      const builtPath = buildPath(initialPath, data);
      if (builtPath.length > 0) {
        setSelectionPath(builtPath);
      }
      setInitialized(true);
    }
  }, [data, initialPath, initialized]);

  // Calculate available options for each level based on current selection path
  const availableOptions = useMemo(() => {
    const options: NavigationTopic[][] = [];

    // First level is always the root data
    options.push(data);

    // For each subsequent level, get sub_topics from the previous selection
    selectionPath.forEach((pathItem) => {
      if (pathItem.topic.sub_topics && pathItem.topic.sub_topics.length > 0) {
        options.push(pathItem.topic.sub_topics);
      }
    });

    return options;
  }, [data, selectionPath]);

  // Select an option at a specific level
  const selectOption = useCallback((level: number, topicName: string) => {
    const currentOptions = availableOptions[level];
    const selectedTopic = currentOptions?.find((topic) => topic.name === topicName);

    if (!selectedTopic) return;

    // Update selection path up to and including this level
    setSelectionPath((prev) => {
      const newPath = prev.slice(0, level);
      newPath.push({
        level,
        topic: selectedTopic,
        key: selectedTopic.key, // Machine-readable key for curriculum path
        displayName: selectedTopic.name, // Human-readable name for display
      });
      return newPath;
    });
  }, [availableOptions]);

  // Reset selections from a specific level onwards
  const resetFrom = useCallback((level: number) => {
    setSelectionPath((prev) => prev.slice(0, level));
  }, []);

  // Reset all selections
  const reset = useCallback(() => {
    setSelectionPath([]);
  }, []);

  // Check if selection is complete (no more sub_topics available)
  const isComplete = useMemo(() => {
    if (selectionPath.length === 0) return false;
    const lastSelection = selectionPath[selectionPath.length - 1];
    return !lastSelection.topic.sub_topics || lastSelection.topic.sub_topics.length === 0;
  }, [selectionPath]);

  // Get the final selected topic
  const finalSelection = useMemo(() => {
    if (selectionPath.length === 0) return null;
    return selectionPath[selectionPath.length - 1].topic;
  }, [selectionPath]);

  return {
    selectionPath,
    availableOptions,
    selectOption,
    resetFrom,
    reset,
    isComplete,
    finalSelection,
  };
};

export default useCascadingSelect;
