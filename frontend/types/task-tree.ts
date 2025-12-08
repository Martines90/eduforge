/**
 * Task Tree Types
 * Defines the hierarchical structure for organizing educational tasks
 */

export interface TaskItem {
  id: string;
  title: string;
  subject: string;
  educationalModel: string;
  rating: number; // 0-5 stars
  views: number;
  description?: string;
  createdAt?: string;
  gradeLevel?: string;
}

export interface TreeNode {
  key: string;
  name: string;
  short_description?: string;
  level: number; // 0 = subject, 1 = grade, 2+ = categories/subcategories
  subTopics?: TreeNode[];
  tasks?: TaskItem[]; // Only leaf nodes have tasks
  isExpanded?: boolean;
  parentPath?: string; // Path from root (e.g., "mathematics/grade_9_10/halmazok")
}

export interface SubjectMapping {
  subject: string; // "mathematics", "physics", etc.
  displayName: string;
  grades: {
    [key: string]: TreeNode[]; // "grade_9_10", "grade_11_12"
  };
}
