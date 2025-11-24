/**
 * Navigation topic structure
 * Represents a hierarchical topic that can contain sub-topics
 */
export interface NavigationTopic {
  name: string;
  sub_topics?: NavigationTopic[];
}

/**
 * Grade level type
 */
export type GradeLevel = 'grade_9_10' | 'grade_11_12';

/**
 * Complete navigation mapping structure
 */
export interface NavigationMapping {
  grade_9_10: NavigationTopic[];
  grade_11_12: NavigationTopic[];
}

/**
 * Selection path item - represents a single selection in the cascade
 */
export interface SelectionPathItem {
  level: number;
  topic: NavigationTopic;
  displayName: string;
}

/**
 * Current state of the cascading selection
 */
export interface CascadeState {
  gradeLevel: GradeLevel | null;
  selectionPath: SelectionPathItem[];
  availableOptions: NavigationTopic[][];
}
