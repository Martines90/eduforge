import { getFirestore } from "../config/firebase.config";
import {
  TestDocument,
  TestTaskDocument,
  CreateTestRequest,
  UpdateTestRequest,
  GetTestsQuery,
  GetTestsResponse,
  AddTaskToTestRequest,
  UpdateTestTaskRequest,
  ReorderTasksRequest,
  TestWithTasksResponse,
  PublishedTestDocument,
  PublishedTestTaskDocument,
} from "../types/test.types";
import { getUserById } from "./auth.service";

/**
 * Test Service
 * Handles all test/worksheet-related business logic
 */

/**
 * Get collection path for tests
 */
function getTestsCollectionPath(country: string): string {
  return `countries/${country}/tests`;
}

/**
 * Get collection path for test tasks
 */
function getTestTasksCollectionPath(country: string, testId: string): string {
  return `${getTestsCollectionPath(country)}/${testId}/testTasks`;
}

/**
 * Create a new test
 */
export async function createTest(
  userId: string,
  country: string,
  data: CreateTestRequest
): Promise<{ id: string; test: TestDocument }> {
  const db = getFirestore();

  // Get user info
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.role !== "teacher") {
    throw new Error("Only teachers can create tests");
  }

  // Check if test name already exists for this teacher
  const existingTests = await db
    .collection(getTestsCollectionPath(country))
    .where("createdBy", "==", userId)
    .where("name", "==", data.name)
    .get();

  if (!existingTests.empty) {
    throw new Error(
      "A test with this name already exists. Please choose a different name."
    );
  }

  // Create test document
  const testDoc: TestDocument = {
    name: data.name,
    subject: data.subject,
    gradeLevel: data.gradeLevel,
    description: data.description,
    createdBy: userId,
    creatorName: user.name,
    country,
    isPublished: false,
    taskCount: 0,
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
  };

  const testRef = await db
    .collection(getTestsCollectionPath(country))
    .add(testDoc);

  return {
    id: testRef.id,
    test: testDoc,
  };
}

/**
 * Get all tests for a user
 */
export async function getUserTests(
  userId: string,
  country: string,
  query: GetTestsQuery = {}
): Promise<GetTestsResponse> {
  const db = getFirestore();

  const { subject, sort = "recent", limit = 50, offset = 0 } = query;

  let testsQuery = db
    .collection(getTestsCollectionPath(country))
    .where("createdBy", "==", userId);

  // Filter by subject if provided
  if (subject) {
    testsQuery = testsQuery.where("subject", "==", subject) as any;
  }

  // Apply sorting
  switch (sort) {
    case "name":
      testsQuery = testsQuery.orderBy("name", "asc") as any;
      break;
    case "taskCount":
      testsQuery = testsQuery.orderBy("taskCount", "desc") as any;
      break;
    case "recent":
    default:
      testsQuery = testsQuery.orderBy("updatedAt", "desc") as any;
      break;
  }

  // Get total count (for pagination)
  const allTests = await testsQuery.get();
  const total = allTests.size;

  // Apply pagination
  const paginatedTests = await testsQuery.limit(limit).offset(offset).get();

  const tests = paginatedTests.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as (TestDocument & { id: string })[];

  return {
    tests,
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore: offset + limit < total,
  };
}

/**
 * Get a single test by ID
 */
export async function getTestById(
  testId: string,
  userId: string,
  country: string
): Promise<TestDocument & { id: string }> {
  const db = getFirestore();

  const testDoc = await db
    .collection(getTestsCollectionPath(country))
    .doc(testId)
    .get();

  if (!testDoc.exists) {
    throw new Error("Test not found");
  }

  const test = testDoc.data() as TestDocument;

  // Verify ownership
  if (test.createdBy !== userId) {
    throw new Error("You do not have permission to access this test");
  }

  return {
    id: testDoc.id,
    ...test,
  };
}

/**
 * Get test with all its tasks
 */
export async function getTestWithTasks(
  testId: string,
  userId: string,
  country: string
): Promise<TestWithTasksResponse> {
  const db = getFirestore();

  // Get test
  const test = await getTestById(testId, userId, country);

  // Get all tasks for this test
  const tasksSnapshot = await db
    .collection(getTestTasksCollectionPath(country, testId))
    .orderBy("orderIndex", "asc")
    .get();

  const tasks = tasksSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as (TestTaskDocument & { id: string })[];

  return {
    test,
    tasks,
  };
}

/**
 * Update test metadata
 */
export async function updateTest(
  testId: string,
  userId: string,
  country: string,
  data: UpdateTestRequest
): Promise<void> {
  const db = getFirestore();

  // Verify ownership
  await getTestById(testId, userId, country);

  // If name is being updated, check for duplicates
  if (data.name) {
    const existingTests = await db
      .collection(getTestsCollectionPath(country))
      .where("createdBy", "==", userId)
      .where("name", "==", data.name)
      .get();

    // Allow if no duplicates or if the only match is the current test
    const hasDuplicate = existingTests.docs.some((doc) => doc.id !== testId);
    if (hasDuplicate) {
      throw new Error(
        "A test with this name already exists. Please choose a different name."
      );
    }
  }

  await db
    .collection(getTestsCollectionPath(country))
    .doc(testId)
    .update({
      ...data,
      updatedAt: new Date(),
    });
}

/**
 * Delete a test
 */
export async function deleteTest(
  testId: string,
  userId: string,
  country: string
): Promise<void> {
  const db = getFirestore();

  // Verify ownership
  await getTestById(testId, userId, country);

  // Delete all test tasks first
  const tasksSnapshot = await db
    .collection(getTestTasksCollectionPath(country, testId))
    .get();

  const batch = db.batch();

  tasksSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // Delete the test document
  batch.delete(db.collection(getTestsCollectionPath(country)).doc(testId));

  await batch.commit();
}

/**
 * Add a task to a test
 */
export async function addTaskToTest(
  testId: string,
  userId: string,
  country: string,
  data: AddTaskToTestRequest
): Promise<{ id: string; testTask: TestTaskDocument }> {
  const db = getFirestore();

  // Verify test ownership
  await getTestById(testId, userId, country);

  // Validate custom task vs library task
  if (!data.taskId && (!data.customTitle || !data.customText)) {
    throw new Error("Custom tasks must have at least a title and text content");
  }

  // Get current task count to set orderIndex
  const tasksSnapshot = await db
    .collection(getTestTasksCollectionPath(country, testId))
    .get();
  const orderIndex = tasksSnapshot.size;

  // Create test task document
  const testTask: TestTaskDocument = {
    taskId: data.taskId || null,
    customTitle: data.customTitle,
    customText: data.customText,
    customQuestions: data.customQuestions,
    overrideTitle: data.overrideTitle,
    overrideText: data.overrideText,
    showImage: data.showImage !== undefined ? data.showImage : true,
    score: data.score,
    questionScores: data.questionScores,
    orderIndex,
    addedAt: new Date() as any,
  };

  const testTaskRef = await db
    .collection(getTestTasksCollectionPath(country, testId))
    .add(testTask);

  // Update test's task count
  await db
    .collection(getTestsCollectionPath(country))
    .doc(testId)
    .update({
      taskCount: orderIndex + 1,
      updatedAt: new Date(),
    });

  return {
    id: testTaskRef.id,
    testTask,
  };
}

/**
 * Update a task in a test
 */
export async function updateTestTask(
  testId: string,
  testTaskId: string,
  userId: string,
  country: string,
  data: UpdateTestTaskRequest
): Promise<void> {
  const db = getFirestore();

  // Verify test ownership
  await getTestById(testId, userId, country);

  // Update test task
  await db
    .collection(getTestTasksCollectionPath(country, testId))
    .doc(testTaskId)
    .update({
      ...data,
    });

  // Update test's updatedAt
  await db.collection(getTestsCollectionPath(country)).doc(testId).update({
    updatedAt: new Date(),
  });
}

/**
 * Delete a task from a test
 */
export async function deleteTestTask(
  testId: string,
  testTaskId: string,
  userId: string,
  country: string
): Promise<void> {
  const db = getFirestore();

  // Verify test ownership
  await getTestById(testId, userId, country);

  // Delete test task
  await db
    .collection(getTestTasksCollectionPath(country, testId))
    .doc(testTaskId)
    .delete();

  // Get remaining tasks and update task count
  const tasksSnapshot = await db
    .collection(getTestTasksCollectionPath(country, testId))
    .get();

  await db.collection(getTestsCollectionPath(country)).doc(testId).update({
    taskCount: tasksSnapshot.size,
    updatedAt: new Date(),
  });
}

/**
 * Reorder tasks in a test
 */
export async function reorderTestTasks(
  testId: string,
  userId: string,
  country: string,
  data: ReorderTasksRequest
): Promise<void> {
  const db = getFirestore();

  // Verify test ownership
  await getTestById(testId, userId, country);

  // Update orderIndex for all affected tasks
  const batch = db.batch();

  data.taskOrders.forEach(({ testTaskId, orderIndex }) => {
    const taskRef = db
      .collection(getTestTasksCollectionPath(country, testId))
      .doc(testTaskId);
    batch.update(taskRef, { orderIndex });
  });

  // Update test's updatedAt
  const testRef = db.collection(getTestsCollectionPath(country)).doc(testId);
  batch.update(testRef, { updatedAt: new Date() });

  await batch.commit();
}

/**
 * Publish/unpublish a test
 */
export async function publishTest(
  testId: string,
  userId: string,
  country: string,
  isPublished: boolean
): Promise<void> {
  const db = getFirestore();

  // Verify test ownership
  await getTestById(testId, userId, country);

  // Update test publication status
  await db.collection(getTestsCollectionPath(country)).doc(testId).update({
    isPublished,
    updatedAt: new Date(),
  });
}

/**
 * Update PDF URL for a test
 */
export async function updateTestPdfUrl(
  testId: string,
  userId: string,
  country: string,
  pdfUrl: string
): Promise<void> {
  const db = getFirestore();

  // Verify test ownership
  await getTestById(testId, userId, country);

  await db.collection(getTestsCollectionPath(country)).doc(testId).update({
    pdfUrl,
    lastPdfGeneratedAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * Generate a short public ID (6 characters, alphanumeric)
 */
function generatePublicId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Publish test to public collection
 * Creates a snapshot of the test and all its tasks in the public collection
 * Returns the public link
 */
export async function publishTestToPublic(
  testId: string,
  userId: string,
  country: string
): Promise<{ publicLink: string; publicId: string }> {
  const db = getFirestore();

  // Get test with all tasks
  const { test, tasks } = await getTestWithTasks(testId, userId, country);

  // If test doesn't have a public ID yet, generate one
  let publicId = test.publishedTestId;
  if (!publicId) {
    publicId = generatePublicId();

    // Verify this ID doesn't exist
    let attempts = 0;
    while (attempts < 10) {
      const existingPublished = await db
        .collection(`countries/${country}/published_tests`)
        .doc(publicId)
        .get();

      if (!existingPublished.exists) {
        break;
      }
      publicId = generatePublicId();
      attempts++;
    }

    if (attempts >= 10) {
      throw new Error("Failed to generate unique public ID");
    }
  }

  // Resolve all tasks (merge library tasks with overrides, or use custom content)
  const resolvedTasks: PublishedTestTaskDocument[] = [];

  for (const testTask of tasks) {
    let resolvedTask: PublishedTestTaskDocument;

    if (testTask.taskId) {
      // Library task - fetch original and merge with overrides
      try {
        // Fetch the original library task from tasks collection
        const libraryTaskDoc = await db
          .collection(`countries/${country}/tasks`)
          .doc(testTask.taskId)
          .get();

        if (libraryTaskDoc.exists) {
          const libraryTask = libraryTaskDoc.data();

          resolvedTask = {
            originalTaskId: testTask.taskId,
            title:
              testTask.overrideTitle || libraryTask?.title || "Untitled Task",
            text:
              testTask.overrideText ||
              libraryTask?.content?.description ||
              libraryTask?.description ||
              "",
            imageUrl:
              testTask.showImage && libraryTask?.content?.images?.[0]
                ? libraryTask.content.images[0]
                : undefined,
            score: testTask.score,
            orderIndex: testTask.orderIndex,
          };
        } else {
          // Library task not found, use overrides only
          resolvedTask = {
            originalTaskId: testTask.taskId,
            title: testTask.overrideTitle || "Task Not Found",
            text: testTask.overrideText || "Original task no longer available",
            score: testTask.score,
            orderIndex: testTask.orderIndex,
          };
        }
      } catch (error) {
        console.error(`Error fetching library task ${testTask.taskId}:`, error);
        // Fallback to overrides
        resolvedTask = {
          originalTaskId: testTask.taskId,
          title: testTask.overrideTitle || "Task Error",
          text: testTask.overrideText || "Error loading original task content",
          score: testTask.score,
          orderIndex: testTask.orderIndex,
        };
      }
    } else {
      // Custom task - use custom content
      resolvedTask = {
        originalTaskId: null,
        title: testTask.customTitle || "Untitled Custom Task",
        text: testTask.customText || "",
        questions: testTask.customQuestions,
        score: testTask.score,
        orderIndex: testTask.orderIndex,
      };
    }

    resolvedTasks.push(resolvedTask);
  }

  // Sort by orderIndex
  resolvedTasks.sort((a, b) => a.orderIndex - b.orderIndex);

  // Create published test document
  const publishedTest: PublishedTestDocument = {
    originalTestId: testId,
    publicId,
    name: test.name,
    subject: test.subject,
    gradeLevel: test.gradeLevel,
    description: test.description,
    createdBy: test.createdBy,
    creatorName: test.creatorName,
    country: test.country,
    tasks: resolvedTasks,
    pdfUrl: test.pdfUrl,
    totalScore: test.totalScore,
    taskCount: test.taskCount,
    viewCount: 0,
    downloadCount: 0,
    publishedAt: new Date() as any,
    lastUpdatedAt: new Date() as any,
  };

  // Save to public collection
  await db
    .collection(`countries/${country}/published_tests`)
    .doc(publicId)
    .set(publishedTest);

  // Generate public link
  const publicLink = `/published-tests/${publicId}`;

  // Update original test with public link and published ID
  await db.collection(getTestsCollectionPath(country)).doc(testId).update({
    publicLink,
    publishedTestId: publicId,
    lastPublishedAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(
    `[Test Service] Test ${testId} published to public with ID: ${publicId}`
  );

  return {
    publicLink,
    publicId,
  };
}

/**
 * Get a published test by public ID (no authentication required)
 */
export async function getPublishedTest(
  publicId: string,
  country: string
): Promise<PublishedTestDocument & { id: string }> {
  const db = getFirestore();

  const publishedDoc = await db
    .collection(`countries/${country}/published_tests`)
    .doc(publicId)
    .get();

  if (!publishedDoc.exists) {
    throw new Error("Published test not found");
  }

  // Increment view count
  await db
    .collection(`countries/${country}/published_tests`)
    .doc(publicId)
    .update({
      viewCount: (publishedDoc.data()?.viewCount || 0) + 1,
    });

  return {
    id: publishedDoc.id,
    ...publishedDoc.data(),
  } as PublishedTestDocument & { id: string };
}
