'use client';

import { useState, useCallback, useMemo } from 'react';
import { NavigationTopic, SelectionPathItem, GradeLevel } from '@/types/navigation';

export interface UseCascadingSelectProps {
  data: NavigationTopic[];
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
export const useCascadingSelect = ({ data }: UseCascadingSelectProps): UseCascadingSelectReturn => {
  const [selectionPath, setSelectionPath] = useState<SelectionPathItem[]>([]);

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
        displayName: selectedTopic.name,
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
