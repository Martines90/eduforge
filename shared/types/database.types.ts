/**
 * Complete Firestore Database Schema
 * Single Source of Truth for EduForger Database Structure
 *
 * This file documents the entire Firestore database structure.
 * Can be imported by both frontend and backend for type safety.
 *
 * Last Updated: 2026-01-11
 */

import { Subject } from './subjects';
import { GradeLevel } from './grades';

// ============================================
// ROOT DATABASE STRUCTURE
// ============================================

export interface FirestoreDatabase {
  users: Collection<User>;
  verificationCodes: Collection<VerificationCode>;
  tasks: Collection<Task>;
  countries: Collection<Country>;
  userProgress: Collection<UserProgress>;
  analytics: Collection<AnalyticsDocument>;
}

// ============================================
// USER COLLECTION
// Path: /users/{userId}
// ============================================

export interface User {
  uid: string;                    // Firebase Auth UID (also document ID)
  email: string;
  name: string;
  role: 'student' | 'teacher';
  emailVerified: boolean;
  country: string;                // Country code (e.g., "HU", "US", "UK")
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Subscription info (for teachers)
  subscriptionTier?: 'free' | 'basic' | 'premium';
  subscriptionStatus?: 'active' | 'cancelled' | 'expired';
  subscriptionEndDate?: Timestamp;

  // Credits system
  taskGenerationCredits?: number;

  // School affiliation (optional)
  schoolId?: string;
  schoolName?: string;
}

// ============================================
// VERIFICATION CODES COLLECTION
// Path: /verificationCodes/{email}
// ============================================

export interface VerificationCode {
  email: string;                  // Also the document ID
  code: string;                   // 6-digit verification code
  createdAt: Timestamp;
  expiresAt: Timestamp;
  verified: boolean;
}

// ============================================
// TASKS COLLECTION (Global)
// Path: /tasks/{taskId}
// ============================================

export interface Task {
  id: string;
  title: string;
  subject: string;
  gradeLevel?: string;
  difficultyLevel?: 'easy' | 'medium' | 'hard';

  // Content
  content: {
    description: string;          // HTML content with LaTeX
    images?: Array<{
      id: string;
      url: string;
    }>;
    questions?: Array<{
      question: string;
      score?: number;
    }>;
  };

  // Curriculum mapping
  subjectMappingId?: string;      // Links to SubjectMapping in country
  curriculum_path?: string;       // e.g., "mathematics/algebra/equations"

  // Publishing
  isPublished: boolean;
  publishedAt?: Timestamp;

  // Creator info
  createdBy: string;              // User UID
  creatorName: string;
  country: string;

  // PDF
  pdfUrl?: string;
  pdfGeneratedAt?: string;

  // Engagement metrics
  viewCount: number;
  completionCount: number;
  ratingAverage?: number;
  ratingCount?: number;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Task Ratings Subcollection
// Path: /tasks/{taskId}/ratings/{userId}
export interface TaskRating {
  userId: string;                 // Also the document ID
  rating: number;                 // 0-5 stars
  ratedAt: Timestamp;
}

// ============================================
// COUNTRIES COLLECTION (Multi-tenant)
// Path: /countries/{countryCode}
// ============================================

export interface Country {
  countryCode: string;            // Document ID (e.g., "HU", "US", "UK")

  // Nested collections
  subjectMappings: {
    [subject: string]: {          // e.g., "mathematics", "physics"
      [gradeLevel: string]: Collection<SubjectMapping>;  // e.g., "grade_9_10"
    };
  };
  tests: Collection<Test>;
  published_tests: Collection<PublishedTest>;
}

// ============================================
// SUBJECT MAPPINGS COLLECTION (Per Country)
// Path: /countries/{country}/subjectMappings/{subject}/{gradeLevel}/{mappingId}
// Example: /countries/HU/subjectMappings/mathematics/grade_9_10/grade_9_10_mathematics_grade_9_10_algebrai_kifejezesek_azonossagok
// ============================================

export interface SubjectMapping {
  id: string;                     // Complex document ID with prefix
  name: string;                   // Display name (e.g., "Algebrai kifejezések, azonosságok")
  subject: Subject;               // Use Subject type from single source of truth
  gradeLevel: GradeLevel;         // Use GradeLevel type from single source of truth
  level: number;                  // Depth in tree (0 = root)
  orderIndex: number;             // Order among siblings
  parentId: string | null;        // Parent node ID
  path: string;                   // Full path in tree (e.g., "algebra/linear_equations")
  isLeaf: boolean;                // True if this is a terminal node (can have tasks)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// TESTS COLLECTION (Per Country)
// Path: /countries/{country}/tests/{testId}
// ============================================

export interface Test {
  id: string;
  name: string;
  subject: string;
  gradeLevel?: string;
  description?: string;

  // Creator info
  createdBy: string;              // User UID
  creatorName: string;
  country: string;

  // Publishing status
  isPublished: boolean;
  publishedAt?: Timestamp;

  // Public sharing
  publicLink?: string;            // e.g., "/published-tests/ABC123"
  publishedTestId?: string;       // Public ID (6-char alphanumeric)
  lastPublishedAt?: Timestamp;

  // PDF
  pdfUrl?: string;
  lastPdfGeneratedAt?: Timestamp;

  // Metrics
  totalScore?: number;            // Sum of all task scores
  taskCount: number;              // Number of tasks in test

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Test Tasks Subcollection
// Path: /countries/{country}/tests/{testId}/test_tasks/{testTaskId}
export interface TestTask {
  id: string;

  // Reference to library task (or null for custom tasks)
  taskId: string | null;

  // Custom task fields (if taskId is null)
  customTitle?: string;
  customText?: string;            // HTML content
  customQuestions?: Array<{
    question: string;
    score?: number;
  }>;

  // Override fields (if taskId is set, these override library task)
  overrideTitle?: string;
  overrideText?: string;

  // Display settings
  showImage: boolean;             // Whether to show task image

  // Scoring
  score?: number;                 // Total score for this task
  questionScores?: Array<{
    questionIndex: number;
    score: number;
  }>;

  // Ordering
  orderIndex: number;             // Position in test

  // Timestamp
  addedAt: Timestamp;
}

// ============================================
// PUBLISHED TESTS COLLECTION (Per Country)
// Path: /countries/{country}/published_tests/{publicId}
// ============================================

export interface PublishedTest {
  // Public identifier (6-char alphanumeric)
  publicId: string;               // Also the document ID

  // Reference to original
  originalTestId: string;

  // Snapshot of test at publish time
  name: string;
  subject: string;
  gradeLevel?: string;
  description?: string;

  // Creator info (from original)
  createdBy: string;
  creatorName: string;
  country: string;                // Country code

  // Resolved tasks (complete snapshot - no references)
  tasks: Array<PublishedTestTask>;

  // PDF
  pdfUrl?: string;

  // Metrics
  totalScore?: number;
  taskCount: number;
  viewCount: number;
  downloadCount: number;

  // Timestamps
  publishedAt: Timestamp;
  lastUpdatedAt: Timestamp;       // When republished
}

export interface PublishedTestTask {
  // Original reference (for tracking)
  originalTaskId?: string | null;

  // Resolved task data (no references, complete copy)
  title: string;
  text: string;                   // HTML content
  imageUrl?: string;              // Single image URL if showImage was true
  questions?: Array<{
    question: string;
    score?: number;
  }>;

  // Scoring
  score?: number;

  // Ordering
  orderIndex: number;
}

// ============================================
// USER PROGRESS COLLECTION
// Path: /userProgress/{userId}
// ============================================

export interface UserProgress {
  userId: string;                 // Also the document ID

  // Overall stats
  totalTasksCompleted: number;
  totalScore: number;
  lastActivityAt: Timestamp;
}

// Task Completions Subcollection
// Path: /userProgress/{userId}/taskCompletions/{taskId}
export interface TaskCompletion {
  taskId: string;                 // Also the document ID
  completedAt: Timestamp;
  score?: number;
  timeSpentSeconds?: number;
}

// ============================================
// ANALYTICS COLLECTION
// Path: /analytics/{document}
// ============================================

export interface AnalyticsDocument {
  // Generic structure for various analytics
  // Can include daily stats, aggregations, etc.
  [key: string]: any;
}

// ============================================
// HELPER TYPES
// ============================================

/**
 * Represents a Firestore collection
 */
export type Collection<T> = Record<string, T>;

/**
 * Firestore Timestamp
 */
export type Timestamp = {
  seconds: number;
  nanoseconds: number;
};

// ============================================
// PATH HELPERS (for type-safe document paths)
// ============================================

export const DB_PATHS = {
  users: (userId: string) => `/users/${userId}`,

  verificationCodes: (email: string) => `/verificationCodes/${email}`,

  tasks: (taskId: string) => `/tasks/${taskId}`,
  taskRating: (taskId: string, userId: string) => `/tasks/${taskId}/ratings/${userId}`,

  country: (country: string) => `/countries/${country}`,

  subjectMapping: (country: string, subject: string, gradeLevel: string, mappingId: string) =>
    `/countries/${country}/subjectMappings/${subject}/${gradeLevel}/${mappingId}`,

  test: (country: string, testId: string) => `/countries/${country}/tests/${testId}`,
  testTask: (country: string, testId: string, testTaskId: string) =>
    `/countries/${country}/tests/${testId}/test_tasks/${testTaskId}`,

  publishedTest: (country: string, publicId: string) => `/countries/${country}/published_tests/${publicId}`,

  userProgress: (userId: string) => `/userProgress/${userId}`,
  taskCompletion: (userId: string, taskId: string) => `/userProgress/${userId}/taskCompletions/${taskId}`,

  analytics: (documentId: string) => `/analytics/${documentId}`,
} as const;

// ============================================
// VISUAL STRUCTURE (for documentation)
// ============================================

/**
 * Complete Firestore Database Tree:
 *
 * /
 * ├── users/{userId}
 * │   └── (User document)
 * │
 * ├── verificationCodes/{email}
 * │   └── (VerificationCode document)
 * │
 * ├── tasks/{taskId}
 * │   ├── (Task document - GLOBAL)
 * │   └── ratings/{userId}
 * │       └── (TaskRating document)
 * │
 * ├── countries/{countryCode}              // e.g., "HU", "US", "UK"
 * │   │
 * │   ├── subjectMappings/{subject}        // e.g., "mathematics", "physics"
 * │   │   └── {gradeLevel}                 // e.g., "grade_9_10", "grade_11_12"
 * │   │       └── {mappingId}              // e.g., "grade_9_10_mathematics_grade_9_10_algebrai_kifejezesek_azonossagok"
 * │   │           └── (SubjectMapping document)
 * │   │
 * │   ├── tests/{testId}
 * │   │   ├── (Test document)
 * │   │   └── test_tasks/{testTaskId}
 * │   │       └── (TestTask document)
 * │   │
 * │   └── published_tests/{publicId}       // 6-char alphanumeric ID
 * │       └── (PublishedTest document with embedded tasks array)
 * │
 * ├── userProgress/{userId}
 * │   ├── (UserProgress document)
 * │   └── taskCompletions/{taskId}
 * │       └── (TaskCompletion document)
 * │
 * └── analytics/{document}
 *     └── (AnalyticsDocument)
 */
