import { Timestamp } from "firebase-admin/firestore";
import { Subject } from "@eduforge/shared";

/**
 * ============================================================================
 * TEST/WORKSHEET SYSTEM TYPES
 * ============================================================================
 */

/**
 * Test Document
 * Main collection: countries/{countryCode}/tests/{testId}
 */
export interface TestDocument {
  // Basic Info
  name: string; // Unique per teacher
  subject: Subject; // "mathematics", "physics", etc.

  // Ownership
  createdBy: string; // User UID
  creatorName: string; // Denormalized
  country: string; // Country code

  // Metadata
  gradeLevel?: string; // Optional: "grade_9_10", etc.
  description?: string;

  // Status
  isPublished: boolean;

  // Publishing
  publicLink?: string; // Public shareable link (e.g., /published-tests/ABC123)
  publishedTestId?: string; // Reference to published test document
  lastPublishedAt?: Timestamp;

  // PDF Storage
  pdfUrl?: string; // Firebase Storage URL
  lastPdfGeneratedAt?: Timestamp;

  // Statistics
  totalScore?: number; // Sum of all task scores
  taskCount: number;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Test Task Document
 * Subcollection: countries/{countryCode}/tests/{testId}/testTasks/{testTaskId}
 */
export interface TestTaskDocument {
  // Task Reference
  taskId: string | null; // NULL for custom tasks, otherwise reference to library task

  // Custom Task Content (only if taskId is null)
  customTitle?: string;
  customText?: string;
  customQuestions?: Array<{
    question: string;
    score?: number;
  }>;

  // Task Overrides (for library tasks when taskId is not null)
  overrideTitle?: string; // Override original title
  overrideText?: string; // Override original description/content
  showImage: boolean; // Toggle image visibility

  // Scoring
  score?: number; // Total points for this task
  questionScores?: Array<{
    questionIndex: number;
    score: number;
  }>;

  // Ordering
  orderIndex: number; // Position in test (0-based)

  // Timestamps
  addedAt: Timestamp;
}

/**
 * ============================================================================
 * API REQUEST/RESPONSE TYPES
 * ============================================================================
 */

/**
 * Create Test Request
 */
export interface CreateTestRequest {
  name: string;
  subject: Subject;
  gradeLevel?: string;
  description?: string;
}

/**
 * Update Test Request
 */
export interface UpdateTestRequest {
  name?: string;
  description?: string;
  subject?: Subject;
  gradeLevel?: string;
}

/**
 * Get Tests Query
 */
export interface GetTestsQuery {
  subject?: Subject;
  sort?: "recent" | "name" | "taskCount";
  limit?: number;
  offset?: number;
}

/**
 * Get Tests Response
 */
export interface GetTestsResponse {
  tests: (TestDocument & { id: string })[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Add Task to Test Request
 */
export interface AddTaskToTestRequest {
  taskId?: string; // NULL/undefined for custom task

  // Custom task fields (if taskId is null/undefined)
  customTitle?: string;
  customText?: string;
  customQuestions?: Array<{
    question: string;
    score?: number;
  }>;

  // Overrides (if taskId exists)
  overrideTitle?: string;
  overrideText?: string;
  showImage?: boolean; // Default: true

  // Scoring
  score?: number;
  questionScores?: Array<{
    questionIndex: number;
    score: number;
  }>;
}

/**
 * Update Test Task Request
 */
export interface UpdateTestTaskRequest {
  // Custom task updates
  customTitle?: string;
  customText?: string;
  customQuestions?: Array<{
    question: string;
    score?: number;
  }>;

  // Override updates
  overrideTitle?: string;
  overrideText?: string;
  showImage?: boolean;

  // Scoring updates
  score?: number;
  questionScores?: Array<{
    questionIndex: number;
    score: number;
  }>;

  // Order update
  orderIndex?: number;
}

/**
 * Reorder Tasks Request
 */
export interface ReorderTasksRequest {
  taskOrders: Array<{
    testTaskId: string;
    orderIndex: number;
  }>;
}

/**
 * Test with Tasks Response (detailed view)
 */
export interface TestWithTasksResponse {
  test: TestDocument & { id: string };
  tasks: (TestTaskDocument & { id: string })[];
}

/**
 * Publish Test Request
 */
export interface PublishTestRequest {
  isPublished: boolean;
}

/**
 * ============================================================================
 * PUBLISHED TESTS (PUBLIC) TYPES
 * ============================================================================
 */

/**
 * Published Test Document
 * Public collection: countries/{countryCode}/published_tests/{subject}/{publishedTestId}
 * This is a snapshot of the test at the time of publishing
 */
export interface PublishedTestDocument {
  // Reference
  originalTestId: string; // Reference to original test in teacher's collection
  publicId: string; // Short ID for public URL (e.g., "ABC123")

  // Basic Info
  name: string;
  subject: Subject;
  gradeLevel?: string;
  description?: string;

  // Creator Info
  createdBy: string; // User UID
  creatorName: string;
  country: string;

  // Content - Snapshot of tasks at time of publishing
  tasks: PublishedTestTaskDocument[];

  // PDF
  pdfUrl?: string;

  // Statistics
  totalScore?: number;
  taskCount: number;

  // View tracking
  viewCount: number;
  downloadCount: number;

  // Timestamps
  publishedAt: Timestamp;
  lastUpdatedAt: Timestamp; // Updated when republished
}

/**
 * Published Test Task (embedded in PublishedTestDocument)
 */
export interface PublishedTestTaskDocument {
  // Original reference (for tracking)
  originalTaskId?: string | null; // Reference to library task or null for custom

  // Content snapshot (resolved - no overrides, just final content)
  title: string;
  text: string; // Full description/content
  imageUrl?: string; // Image URL if showImage was true
  questions?: Array<{
    question: string;
    score?: number;
  }>;

  // Scoring
  score?: number;

  // Ordering
  orderIndex: number;
}

/**
 * Publish to Public Request
 */
export interface PublishToPublicRequest {
  generateNewPdf?: boolean; // Whether to generate a new PDF before publishing
}

/**
 * Get Published Tests Query
 */
export interface GetPublishedTestsQuery {
  subject?: Subject;
  gradeLevel?: string;
  search?: string; // Search by name
  sort?: "recent" | "views" | "downloads";
  limit?: number;
  offset?: number;
}

/**
 * Get Published Tests Response
 */
export interface GetPublishedTestsResponse {
  tests: (PublishedTestDocument & { id: string })[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
