import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as testService from "../services/test.service";
import { uploadTestPDF } from "../services/pdf-storage.service";
import {
  CreateTestRequest,
  UpdateTestRequest,
  GetTestsQuery,
  AddTaskToTestRequest,
  UpdateTestTaskRequest,
  ReorderTasksRequest,
} from "../types/test.types";

/**
 * Test Controller
 * Handles HTTP requests for test/worksheet management
 */

/**
 * Helper to get user info from authenticated request
 */
function getUserFromRequest(
  req: Request
): { userId: string; country: string } {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    throw new Error("User not authenticated");
  }
  // Extract country from user token or default to US
  const country = (authReq.user as any).country || "US";
  return {
    userId: authReq.user.uid,
    country,
  };
}

/**
 * POST /api/v2/tests
 * Create a new test
 */
export const createTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, country } = getUserFromRequest(req);
    const data: CreateTestRequest = req.body;

    console.log(`📥 Create test request from user ${userId}`);
    console.log(`   Name: ${data.name}`);
    console.log(`   Subject: ${data.subject}`);

    const result = await testService.createTest(userId, country, data);

    res.status(201).json({
      success: true,
      message: "Test created successfully",
      test: {
        id: result.id,
        ...result.test,
      },
    });
  } catch (error: any) {
    console.error("❌ Error creating test:", error);
    if (
      error.message.includes("already exists") ||
      error.message.includes("duplicate")
    ) {
      res.status(409).json({
        success: false,
        error: "Duplicate test name",
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

/**
 * GET /api/v2/tests
 * Get all tests for current user
 */
export const getUserTests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, country } = getUserFromRequest(req);
    const query: GetTestsQuery = {
      subject: req.query.subject as string,
      sort: req.query.sort as "recent" | "name" | "taskCount",
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset
        ? parseInt(req.query.offset as string)
        : undefined,
    };

    console.log(`📥 Get tests request from user ${userId}`);

    const result = await testService.getUserTests(userId, country, query);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("❌ Error getting tests:", error);
    next(error);
  }
};

/**
 * GET /api/v2/tests/:testId
 * Get a single test with all its tasks
 */
export const getTestById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, country } = getUserFromRequest(req);
    const { testId } = req.params;

    console.log(`📥 Get test ${testId} request from user ${userId}`);

    const result = await testService.getTestWithTasks(testId, userId, country);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("❌ Error getting test:", error);
    if (
      error.message.includes("not found") ||
      error.message.includes("not have permission")
    ) {
      res.status(404).json({
        success: false,
        error: "Test not found",
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

/**
 * PUT /api/v2/tests/:testId
 * Update test metadata
 */
export const updateTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, country } = getUserFromRequest(req);
    const { testId } = req.params;
    const data: UpdateTestRequest = req.body;

    console.log(`📥 Update test ${testId} request from user ${userId}`);

    await testService.updateTest(testId, userId, country, data);

    res.status(200).json({
      success: true,
      message: "Test updated successfully",
    });
  } catch (error: any) {
    console.error("❌ Error updating test:", error);
    if (error.message.includes("already exists")) {
      res.status(409).json({
        success: false,
        error: "Duplicate test name",
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

/**
 * DELETE /api/v2/tests/:testId
 * Delete a test
 */
export const deleteTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, country } = getUserFromRequest(req);
    const { testId } = req.params;

    console.log(`📥 Delete test ${testId} request from user ${userId}`);

    await testService.deleteTest(testId, userId, country);

    res.status(200).json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting test:", error);
    next(error);
  }
};

/**
 * POST /api/v2/tests/:testId/tasks
 * Add a task to a test
 */
export const addTaskToTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, country } = getUserFromRequest(req);
    const { testId } = req.params;
    const data: AddTaskToTestRequest = req.body;

    console.log(`📥 Add task to test ${testId} request from user ${userId}`);
    console.log(
      `   Task ID: ${data.taskId || "Custom task (no library reference)"}`
    );

    const result = await testService.addTaskToTest(testId, userId, country, data);

    res.status(201).json({
      success: true,
      message: "Task added to test successfully",
      testTask: {
        id: result.id,
        ...result.testTask,
      },
    });
  } catch (error: any) {
    console.error("❌ Error adding task to test:", error);
    if (error.message.includes("must have")) {
      res.status(400).json({
        success: false,
        error: "Invalid request",
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

/**
 * PUT /api/v2/tests/:testId/tasks/:testTaskId
 * Update a task in a test
 */
export const updateTestTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, country } = getUserFromRequest(req);
    const { testId, testTaskId } = req.params;
    const data: UpdateTestTaskRequest = req.body;

    console.log(
      `📥 Update test task ${testTaskId} in test ${testId} from user ${userId}`
    );

    await testService.updateTestTask(
      testId,
      testTaskId,
      userId,
      country,
      data
    );

    res.status(200).json({
      success: true,
      message: "Test task updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating test task:", error);
    next(error);
  }
};

/**
 * DELETE /api/v2/tests/:testId/tasks/:testTaskId
 * Remove a task from a test
 */
export const deleteTestTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, country } = getUserFromRequest(req);
    const { testId, testTaskId } = req.params;

    console.log(
      `📥 Delete test task ${testTaskId} from test ${testId} by user ${userId}`
    );

    await testService.deleteTestTask(testId, testTaskId, userId, country);

    res.status(200).json({
      success: true,
      message: "Task removed from test successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting test task:", error);
    next(error);
  }
};

/**
 * PUT /api/v2/tests/:testId/tasks/reorder
 * Reorder tasks in a test
 */
export const reorderTestTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, country } = getUserFromRequest(req);
    const { testId } = req.params;
    const data: ReorderTasksRequest = req.body;

    console.log(`📥 Reorder tasks in test ${testId} by user ${userId}`);
    console.log(`   Reordering ${data.taskOrders.length} tasks`);

    await testService.reorderTestTasks(testId, userId, country, data);

    res.status(200).json({
      success: true,
      message: "Tasks reordered successfully",
    });
  } catch (error) {
    console.error("❌ Error reordering tasks:", error);
    next(error);
  }
};

/**
 * POST /api/v2/tests/:testId/publish
 * Publish or unpublish a test
 */
export const publishTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, country } = getUserFromRequest(req);
    const { testId } = req.params;
    const { isPublished } = req.body;

    console.log(
      `📥 ${isPublished ? "Publish" : "Unpublish"} test ${testId} by user ${userId}`
    );

    await testService.publishTest(testId, userId, country, isPublished);

    res.status(200).json({
      success: true,
      message: isPublished
        ? "Test published successfully"
        : "Test unpublished successfully",
    });
  } catch (error) {
    console.error("❌ Error publishing test:", error);
    next(error);
  }
};

/**
 * PUT /api/v2/tests/:testId/pdf
 * Update PDF URL for a test (after PDF generation)
 */
export const updateTestPdfUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, country } = getUserFromRequest(req);
    const { testId } = req.params;
    const { pdfUrl } = req.body;

    if (!pdfUrl) {
      res.status(400).json({
        success: false,
        error: "Invalid request",
        message: "pdfUrl is required",
      });
      return;
    }

    console.log(`📥 Update PDF URL for test ${testId} by user ${userId}`);

    await testService.updateTestPdfUrl(testId, userId, country, pdfUrl);

    res.status(200).json({
      success: true,
      message: "PDF URL updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating PDF URL:", error);
    next(error);
  }
};

/**
 * POST /api/v2/tests/:testId/publish-public
 * Publish test to public collection (creates snapshot with public link)
 */
export const publishTestToPublic = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, country } = getUserFromRequest(req);
    const { testId } = req.params;

    console.log(`📥 Publish test ${testId} to public by user ${userId}`);

    const result = await testService.publishTestToPublic(testId, userId, country);

    res.status(200).json({
      success: true,
      message: "Test published to public successfully",
      publicLink: result.publicLink,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error("❌ Error publishing test to public:", error);
    next(error);
  }
};

/**
 * POST /api/v2/tests/:testId/upload-pdf
 * Upload a generated test PDF to Firebase Storage
 */
export const uploadPDFToStorage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { testId } = req.params;
    const { userId, country } = getUserFromRequest(req);

    console.log(`📥 Upload PDF for test ${testId} by user ${userId}`);

    if (!req.body.pdfData) {
      res.status(400).json({
        success: false,
        error: "Invalid request",
        message: "Missing PDF data in request body",
      });
      return;
    }

    const testTitle = req.body.testTitle || req.body.title;
    const pdfBase64 = req.body.pdfData.replace(
      /^data:application\/pdf;[^,]*,/,
      ""
    );
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    console.log(`   PDF buffer size: ${pdfBuffer.length} bytes`);

    const result = await uploadTestPDF(testId, pdfBuffer, testTitle, country);

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: "Upload failed",
        message: result.error || "Failed to upload PDF",
      });
      return;
    }

    console.log(`✅ Test PDF uploaded successfully: ${result.pdfUrl}`);

    res.status(200).json({
      success: true,
      message: "Test PDF uploaded successfully",
      pdfUrl: result.pdfUrl,
    });
  } catch (error) {
    console.error("❌ Error uploading test PDF:", error);
    next(error);
  }
};

/**
 * GET /api/v2/published-tests/:publicId
 * Get a published test by public ID (no authentication required)
 */
export const getPublishedTest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { publicId } = req.params;
    // Extract country from query or default to US
    const country = (req.query.country as string) || "US";

    console.log(`📥 Get published test ${publicId} for country ${country}`);

    const test = await testService.getPublishedTest(publicId, country);

    res.status(200).json({
      success: true,
      test,
    });
  } catch (error: any) {
    console.error("❌ Error getting published test:", error);
    if (error.message.includes("not found")) {
      res.status(404).json({
        success: false,
        error: "Test not found",
        message: error.message,
      });
      return;
    }
    next(error);
  }
};
