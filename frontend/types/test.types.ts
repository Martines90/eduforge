/**
 * Frontend types for Test/Worksheet system
 */

export interface Test {
  id: string;
  name: string;
  subject: string;
  gradeLevel?: string;
  description?: string;
  createdBy: string;
  creatorName: string;
  country: string;
  isPublished: boolean;
  publicLink?: string;
  publishedTestId?: string;
  lastPublishedAt?: string;
  pdfUrl?: string;
  lastPdfGeneratedAt?: string;
  totalScore?: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TestTask {
  id: string;
  taskId: string | null;

  // Custom task content
  customTitle?: string;
  customText?: string;
  customQuestions?: Array<{
    question: string;
    score?: number;
  }>;

  // Overrides for library tasks
  overrideTitle?: string;
  overrideText?: string;
  showImage: boolean;

  // Scoring
  score?: number;
  questionScores?: Array<{
    questionIndex: number;
    score: number;
  }>;

  // Ordering
  orderIndex: number;
  addedAt: string;
}

export interface TestWithTasks {
  test: Test;
  tasks: TestTask[];
}

export interface CreateTestRequest {
  name: string;
  subject: string;
  gradeLevel?: string;
  description?: string;
}

export interface UpdateTestRequest {
  name?: string;
  description?: string;
  subject?: string;
  gradeLevel?: string;
}

export interface AddTaskToTestRequest {
  taskId?: string;

  // Custom task
  customTitle?: string;
  customText?: string;
  customQuestions?: Array<{
    question: string;
    score?: number;
  }>;

  // Overrides
  overrideTitle?: string;
  overrideText?: string;
  showImage?: boolean;

  // Scoring
  score?: number;
  questionScores?: Array<{
    questionIndex: number;
    score: number;
  }>;
}

export interface UpdateTestTaskRequest {
  customTitle?: string;
  customText?: string;
  customQuestions?: Array<{
    question: string;
    score?: number;
  }>;
  overrideTitle?: string;
  overrideText?: string;
  showImage?: boolean;
  score?: number;
  questionScores?: Array<{
    questionIndex: number;
    score: number;
  }>;
  orderIndex?: number;
}

export interface ReorderTasksRequest {
  taskOrders: Array<{
    testTaskId: string;
    orderIndex: number;
  }>;
}

export interface PublishedTest {
  originalTestId: string;
  publicId: string;
  name: string;
  subject: string;
  gradeLevel?: string;
  description?: string;
  createdBy: string;
  creatorName: string;
  country: string;
  tasks: PublishedTestTask[];
  pdfUrl?: string;
  totalScore?: number;
  taskCount: number;
  viewCount: number;
  downloadCount: number;
  publishedAt: string;
  lastUpdatedAt: string;
}

export interface PublishedTestTask {
  originalTaskId?: string | null;
  title: string;
  text: string;
  imageUrl?: string;
  questions?: Array<{
    question: string;
    score?: number;
  }>;
  score?: number;
  orderIndex: number;
}
