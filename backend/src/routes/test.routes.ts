import { Router } from "express";
import * as testController from "../controllers/test.controller";
import { requireAuthenticatedTeacher } from "../middleware/auth.middleware";
import {
  requireTeacher,
  requireActiveSubscription,
} from "../middleware/role.middleware";

const router = Router();

/**
 * Test/Worksheet Management Routes
 * All routes require teacher authentication
 */

// Apply teacher authentication to all routes
router.use(requireAuthenticatedTeacher);

/**
 * @swagger
 * /api/v2/tests:
 *   get:
 *     summary: Get all tests for current user
 *     description: Returns a list of tests/worksheets created by the authenticated teacher
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: Filter by subject
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, name, taskCount]
 *         description: Sort order
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of tests to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: List of tests
 *       401:
 *         description: Unauthorized
 */
router.get("/tests", testController.getUserTests);

/**
 * @swagger
 * /api/v2/tests:
 *   post:
 *     summary: Create a new test
 *     description: Creates a new test/worksheet for the teacher
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - subject
 *             properties:
 *               name:
 *                 type: string
 *                 description: Test name (must be unique per teacher)
 *               subject:
 *                 type: string
 *                 description: Subject (e.g., mathematics, physics)
 *               gradeLevel:
 *                 type: string
 *                 description: Grade level (e.g., grade_9_10)
 *               description:
 *                 type: string
 *                 description: Optional description
 *     responses:
 *       201:
 *         description: Test created successfully
 *       409:
 *         description: Test name already exists
 *       401:
 *         description: Unauthorized
 */
router.post("/tests", testController.createTest);

/**
 * @swagger
 * /api/v2/tests/{testId}:
 *   get:
 *     summary: Get a test by ID
 *     description: Returns a test with all its tasks
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test with tasks
 *       404:
 *         description: Test not found
 *       401:
 *         description: Unauthorized
 */
router.get("/tests/:testId", testController.getTestById);

/**
 * @swagger
 * /api/v2/tests/{testId}:
 *   put:
 *     summary: Update test metadata
 *     description: Updates test name, description, subject, or grade level
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               subject:
 *                 type: string
 *               gradeLevel:
 *                 type: string
 *     responses:
 *       200:
 *         description: Test updated successfully
 *       409:
 *         description: Test name already exists
 *       404:
 *         description: Test not found
 *       401:
 *         description: Unauthorized
 */
router.put("/tests/:testId", testController.updateTest);

/**
 * @swagger
 * /api/v2/tests/{testId}:
 *   delete:
 *     summary: Delete a test
 *     description: Deletes a test and all its tasks
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test deleted successfully
 *       404:
 *         description: Test not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/tests/:testId", testController.deleteTest);

/**
 * @swagger
 * /api/v2/tests/{testId}/tasks:
 *   post:
 *     summary: Add a task to a test
 *     description: Adds a task from library or creates a custom task
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskId:
 *                 type: string
 *                 description: Library task ID (omit for custom task)
 *               customTitle:
 *                 type: string
 *                 description: Custom task title (required if no taskId)
 *               customText:
 *                 type: string
 *                 description: Custom task text (required if no taskId)
 *               customQuestions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                     score:
 *                       type: number
 *               overrideTitle:
 *                 type: string
 *                 description: Override library task title
 *               overrideText:
 *                 type: string
 *                 description: Override library task text
 *               showImage:
 *                 type: boolean
 *                 description: Show/hide task image
 *               score:
 *                 type: number
 *                 description: Total score for task
 *               questionScores:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionIndex:
 *                       type: number
 *                     score:
 *                       type: number
 *     responses:
 *       201:
 *         description: Task added successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Test not found
 *       401:
 *         description: Unauthorized
 */
router.post("/tests/:testId/tasks", testController.addTaskToTest);

/**
 * @swagger
 * /api/v2/tests/{testId}/tasks/{testTaskId}:
 *   put:
 *     summary: Update a task in a test
 *     description: Updates task properties like title, text, image visibility, score
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: testTaskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       404:
 *         description: Test or task not found
 *       401:
 *         description: Unauthorized
 */
router.put("/tests/:testId/tasks/:testTaskId", testController.updateTestTask);

/**
 * @swagger
 * /api/v2/tests/{testId}/tasks/{testTaskId}:
 *   delete:
 *     summary: Remove a task from a test
 *     description: Removes a task from the test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: testTaskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task removed successfully
 *       404:
 *         description: Test or task not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/tests/:testId/tasks/:testTaskId",
  testController.deleteTestTask
);

/**
 * @swagger
 * /api/v2/tests/{testId}/tasks/reorder:
 *   put:
 *     summary: Reorder tasks in a test
 *     description: Changes the order of tasks in the test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskOrders
 *             properties:
 *               taskOrders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     testTaskId:
 *                       type: string
 *                     orderIndex:
 *                       type: number
 *     responses:
 *       200:
 *         description: Tasks reordered successfully
 *       404:
 *         description: Test not found
 *       401:
 *         description: Unauthorized
 */
router.put("/tests/:testId/tasks/reorder", testController.reorderTestTasks);

/**
 * @swagger
 * /api/v2/tests/{testId}/publish:
 *   post:
 *     summary: Publish or unpublish a test
 *     description: Publishes or unpublishes a test
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isPublished
 *             properties:
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Test published/unpublished successfully
 *       404:
 *         description: Test not found
 *       401:
 *         description: Unauthorized
 */
router.post("/tests/:testId/publish", testController.publishTest);

/**
 * @swagger
 * /api/v2/tests/{testId}/upload-pdf:
 *   post:
 *     summary: Upload test PDF to Firebase Storage
 *     description: Uploads a generated test PDF and returns the storage URL
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pdfData
 *             properties:
 *               pdfData:
 *                 type: string
 *                 description: Base64-encoded PDF data
 *               testTitle:
 *                 type: string
 *                 description: Test title for filename
 *     responses:
 *       200:
 *         description: PDF uploaded successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Test not found
 *       401:
 *         description: Unauthorized
 */
router.post("/tests/:testId/upload-pdf", testController.uploadPDFToStorage);

/**
 * @swagger
 * /api/v2/tests/{testId}/pdf:
 *   put:
 *     summary: Update PDF URL for a test
 *     description: Updates the PDF URL after PDF generation
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pdfUrl
 *             properties:
 *               pdfUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: PDF URL updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Test not found
 *       401:
 *         description: Unauthorized
 */
router.put("/tests/:testId/pdf", testController.updateTestPdfUrl);

/**
 * @swagger
 * /api/v2/tests/{testId}/publish-public:
 *   post:
 *     summary: Publish test to public collection
 *     description: |
 *       Creates a snapshot of the test in the public collection with a shareable link.
 *       Resolves all task overrides and generates a 6-character public ID.
 *       Can be called multiple times to republish (updates existing public test).
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test published successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 publicLink:
 *                   type: string
 *                   description: Public URL path (e.g., /published-tests/ABC123)
 *                 publicId:
 *                   type: string
 *                   description: 6-character public ID
 *       404:
 *         description: Test not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/tests/:testId/publish-public",
  testController.publishTestToPublic
);

/**
 * @swagger
 * /api/v2/published-tests/{publicId}:
 *   get:
 *     summary: Get a published test (public access)
 *     description: Fetches a published test by its public ID. No authentication required.
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Public ID of the test (6-character alphanumeric)
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Country code (defaults to US)
 *     responses:
 *       200:
 *         description: Published test retrieved successfully
 *       404:
 *         description: Test not found
 */
export const publicTestRouter = Router();
publicTestRouter.get(
  "/published-tests/:publicId",
  testController.getPublishedTest
);

export default router;
