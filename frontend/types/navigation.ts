import { GradeLevel } from '@eduforger/shared';

/**
 * Navigation topic structure
 * Represents a hierarchical topic that can contain sub-topics
 */
export interface NavigationTopic {
  key: string; // Machine-readable key (e.g., "literatura_grecolatina")
  name: string; // Human-readable name (e.g., "Literatura Grecolatina")
  sub_topics?: NavigationTopic[];
}

/**
 * Grade level type - imported from shared
 * Re-export for backward compatibility
 */
export type { GradeLevel };

/**
 * Complete navigation mapping structure
 * Dynamic record type that supports all grade levels from all countries
 */
export type NavigationMapping = Record<GradeLevel, NavigationTopic[]>;

/**
 * Selection path item - represents a single selection in the cascade
 */
export interface SelectionPathItem {
  level: number;
  topic: NavigationTopic;
  key: string; // The key from the topic (for curriculum path)
  displayName: string; // The name from the topic (for display)
}

/**
 * Current state of the cascading selection
 */
export interface CascadeState {
  gradeLevel: GradeLevel | null;
  selectionPath: SelectionPathItem[];
  availableOptions: NavigationTopic[][];
}
