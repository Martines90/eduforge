import { Timestamp } from "firebase-admin/firestore";
import { Subject, GradeLevel } from "@eduforger/shared";

// Legacy types - kept for backward compatibility with storage service
export interface LegacyTaskImage {
  id: string;
  url: string;
}

export interface LegacyTask {
  id: string;
  description: string;
  images: LegacyTaskImage[];
}

// TaskGenerationResult is now defined in task-generator.types.ts
// Re-export it for backward compatibility
export type { TaskGenerationResult } from "./task-generator.types";

/**
 * ============================================================================
 * NEW FIRESTORE TASK SYSTEM
 * ============================================================================
 */

/**
 * Subject Mapping Document
 * Represents a node in the curriculum hierarchy
 *
 * NOTE: This should match the SubjectMapping interface in @eduforger/shared
 * Additional fields like taskCount are denormalized stats not in the shared type
 */
export interface SubjectMappingDocument {
  // Identity
  id: string; // Document ID
  name: string; // Display name (e.g., "Algebrai kifejezések, azonosságok")

  // Classification (typed to match shared types)
  subject: Subject; // Use Subject type from single source of truth
  gradeLevel: GradeLevel; // Use GradeLevel type from single source of truth

  // Hierarchy
  level: number; // Depth in tree (0 = root)
  orderIndex: number; // Order among siblings
  parentId: string | null; // Parent node ID
  path: string; // Full path in tree (e.g., "algebra/linear_equations")
  isLeaf: boolean; // True if this is a terminal node (can have tasks)

  // Additional fields (not in shared type but used in backend)
  shortDescription?: string;
  taskCount?: number; // Denormalized stat

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Question Block for task content
 */
export interface QuestionBlock {
  id?: string;
  type: "multiple_choice" | "true_false" | "open_ended" | "fill_in_blank";
  text: string;
  imageUrl?: string;
  options?: string[]; // For multiple choice
  correctAnswer?: number | string | boolean;
  points?: number;
}

/**
 * Solution Block for task content
 */
export interface SolutionBlock {
  questionId?: string;
  explanation: string;
  steps?: string[];
  imageUrl?: string;
}

/**
 * Task Content Structure
 */
export interface TaskContent {
  type: "multiple_choice" | "open_ended" | "problem_solving" | "mixed";
  questions: QuestionBlock[];
  solutions?: SolutionBlock[];
  hints?: string[];
  resources?: {
    title: string;
    url: string;
    type: "video" | "article" | "pdf";
  }[];
}

/**
 * Task Document
 */
export interface TaskDocument {
  // Basic Info
  title: string;
  description?: string;

  // Content
  content: TaskContent;

  // Curriculum Mapping
  subjectMappingId: string;
  subjectMappingPath: string; // Denormalized
  subject: string; // Denormalized
  gradeLevel: string; // Denormalized

  // Metadata
  educationalModel: string;
  difficultyLevel?: "easy" | "medium" | "hard";
  estimatedDurationMinutes?: number;
  tags?: string[];

  // Engagement Metrics
  ratingAverage: number; // 0.00 to 5.00
  ratingCount: number;
  viewCount: number;
  completionCount: number;

  // Ownership & Status
  createdBy: string; // User UID
  creatorName: string; // Denormalized
  isPublished: boolean;
  publishedAt?: Timestamp;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Task Rating Document (subcollection under tasks)
 */
export interface TaskRatingDocument {
  userId: string;
  rating: number; // 0-5 (integers only)
  reviewText?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Task View Document (for analytics)
 */
export interface TaskViewDocument {
  taskId: string;
  userId: string | null; // NULL for anonymous
  viewedAt: Timestamp;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Request/Response types for API
 */

export interface CreateTaskRequest {
  title: string;
  description?: string;
  content: TaskContent;
  subjectMappingId: string;
  subject?: string; // Subject key (e.g., 'mathematics', 'physics')
  country_code?: string; // ISO country code (e.g., 'HU', 'US', 'MX')
  educationalModel?: string;
  difficultyLevel?: "easy" | "medium" | "hard";
  estimatedDurationMinutes?: number;
  tags?: string[];
  isPublished?: boolean;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  content?: TaskContent;
  educationalModel?: string;
  difficultyLevel?: "easy" | "medium" | "hard";
  estimatedDurationMinutes?: number;
  tags?: string[];
  isPublished?: boolean;
}

export interface GetTasksQuery {
  subject?: string;
  gradeLevel?: string;
  subjectMappingId?: string;
  curriculum_path?: string; // Full path like "math:grade_9_10:Halmazok:..."
  search?: string;
  difficultyLevel?: "easy" | "medium" | "hard";
  tags?: string[];
  sort?: "rating" | "views" | "recent" | "popular";
  limit?: number;
  offset?: number;
  createdBy?: string;
  isPublished?: boolean;
}

export interface GetTasksResponse {
  tasks: (TaskDocument & { id: string })[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SubmitRatingRequest {
  rating: number; // 0-5
  reviewText?: string;
}

/**
 * Tree Node Response (for frontend)
 */
export interface SubjectMappingTreeNode extends SubjectMappingDocument {
  id: string;
  children?: SubjectMappingTreeNode[];
}
