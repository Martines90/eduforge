import * as testService from "../../services/test.service";
import * as testController from "../../controllers/test.controller";
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";

// Mock dependencies
jest.mock("../../services/test.service");
jest.mock("../../services/pdf-storage.service");

describe("Test Routes - API Endpoints", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock request with authenticated user
    mockRequest = {
      user: {
        uid: "teacher123",
        email: "teacher@school.edu",
        role: "teacher",
        country: "HU",
      } as any,
      params: {},
      query: {},
      body: {},
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Setup mock next function
    mockNext = jest.fn();
  });

  describe("POST /api/v2/tests - Create Test", () => {
    it("should create a test successfully with valid data", async () => {
      const testData = {
        name: "Algebra Mid-term",
        subject: "mathematics",
        gradeLevel: "grade_9_10",
        description: "Test covering algebraic expressions",
      };

      mockRequest.body = testData;

      const mockCreatedTest = {
        id: "test123",
        test: {
          ...testData,
          createdBy: "teacher123",
          creatorName: "Test Teacher",
          country: "HU",
          taskCount: 0,
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      (testService.createTest as jest.Mock).mockResolvedValue(mockCreatedTest);

      await testController.createTest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(testService.createTest).toHaveBeenCalledWith(
        "teacher123",
        "HU",
        testData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Test created successfully",
        test: {
          id: "test123",
          ...mockCreatedTest.test,
        },
      });
    });

    it("should return 409 for duplicate test name", async () => {
      mockRequest.body = {
        name: "Duplicate Test",
        subject: "mathematics",
      };

      (testService.createTest as jest.Mock).mockRejectedValue(
        new Error("Test name already exists for this user")
      );

      await testController.createTest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Duplicate test name",
        message: "Test name already exists for this user",
      });
    });

    it("should validate required fields", async () => {
      mockRequest.body = {
        name: "Test without subject",
        // missing subject
      };

      (testService.createTest as jest.Mock).mockRejectedValue(
        new Error("Subject is required")
      );

      await testController.createTest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("GET /api/v2/tests - Get User Tests", () => {
    it("should return all tests for user", async () => {
      const mockTests = {
        tests: [
          {
            id: "test1",
            name: "Test 1",
            subject: "mathematics",
            taskCount: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "test2",
            name: "Test 2",
            subject: "physics",
            taskCount: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        count: 2,
      };

      (testService.getUserTests as jest.Mock).mockResolvedValue(mockTests);

      await testController.getUserTests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(testService.getUserTests).toHaveBeenCalledWith(
        "teacher123",
        "HU",
        expect.any(Object)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        ...mockTests,
      });
    });

    it("should filter tests by subject", async () => {
      mockRequest.query = { subject: "mathematics" };

      const mockFilteredTests = {
        tests: [
          {
            id: "test1",
            name: "Math Test",
            subject: "mathematics",
            taskCount: 5,
          },
        ],
        count: 1,
      };

      (testService.getUserTests as jest.Mock).mockResolvedValue(
        mockFilteredTests
      );

      await testController.getUserTests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(testService.getUserTests).toHaveBeenCalledWith(
        "teacher123",
        "HU",
        expect.objectContaining({
          subject: "mathematics",
        })
      );
    });

    it("should sort tests by different criteria", async () => {
      mockRequest.query = { sort: "name" };

      await testController.getUserTests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(testService.getUserTests).toHaveBeenCalledWith(
        "teacher123",
        "HU",
        expect.objectContaining({
          sort: "name",
        })
      );
    });

    it("should handle pagination", async () => {
      mockRequest.query = { limit: "10", offset: "20" };

      await testController.getUserTests(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(testService.getUserTests).toHaveBeenCalledWith(
        "teacher123",
        "HU",
        expect.objectContaining({
          limit: 10,
          offset: 20,
        })
      );
    });
  });

  describe("GET /api/v2/tests/:testId - Get Test By ID", () => {
    it("should return test with all tasks", async () => {
      mockRequest.params = { testId: "test123" };

      const mockTestWithTasks = {
        test: {
          id: "test123",
          name: "Test with Tasks",
          subject: "mathematics",
          taskCount: 2,
        },
        tasks: [
          {
            id: "task1",
            taskId: "library-task-1",
            orderIndex: 0,
            score: 10,
          },
          {
            id: "task2",
            customTitle: "Custom Task",
            orderIndex: 1,
            score: 15,
          },
        ],
      };

      (testService.getTestWithTasks as jest.Mock).mockResolvedValue(
        mockTestWithTasks
      );

      await testController.getTestById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(testService.getTestWithTasks).toHaveBeenCalledWith(
        "test123",
        "teacher123",
        "HU"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        ...mockTestWithTasks,
      });
    });

    it("should return 404 for non-existent test", async () => {
      mockRequest.params = { testId: "non-existent" };

      (testService.getTestWithTasks as jest.Mock).mockRejectedValue(
        new Error("Test not found")
      );

      await testController.getTestById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Test not found",
        message: "Test not found",
      });
    });

    it("should enforce ownership - only creator can access", async () => {
      mockRequest.params = { testId: "test123" };

      (testService.getTestWithTasks as jest.Mock).mockRejectedValue(
        new Error("User does not have permission to access this test")
      );

      await testController.getTestById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe("PUT /api/v2/tests/:testId - Update Test", () => {
    it("should update test metadata", async () => {
      mockRequest.params = { testId: "test123" };
      mockRequest.body = {
        name: "Updated Test Name",
        description: "Updated description",
      };

      (testService.updateTest as jest.Mock).mockResolvedValue({});

      await testController.updateTest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(testService.updateTest).toHaveBeenCalledWith(
        "test123",
        "teacher123",
        "HU",
        mockRequest.body
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Test updated successfully",
      });
    });

    it("should return 409 if new name conflicts", async () => {
      mockRequest.params = { testId: "test123" };
      mockRequest.body = { name: "Existing Test Name" };

      (testService.updateTest as jest.Mock).mockRejectedValue(
        new Error("Test name already exists")
      );

      await testController.updateTest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
    });
  });

  describe("DELETE /api/v2/tests/:testId - Delete Test", () => {
    it("should delete test and all its tasks", async () => {
      mockRequest.params = { testId: "test123" };

      (testService.deleteTest as jest.Mock).mockResolvedValue({});

      await testController.deleteTest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(testService.deleteTest).toHaveBeenCalledWith(
        "test123",
        "teacher123",
        "HU"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Test deleted successfully",
      });
    });
  });

  describe("POST /api/v2/tests/:testId/tasks - Add Task to Test", () => {
    it("should add library task to test", async () => {
      mockRequest.params = { testId: "test123" };
      mockRequest.body = {
        taskId: "library-task-123",
        showImage: true,
        score: 10,
      };

      const mockAddedTask = {
        id: "test-task-1",
        testTask: {
          taskId: "library-task-123",
          orderIndex: 0,
          showImage: true,
          score: 10,
          addedAt: new Date(),
        },
      };

      (testService.addTaskToTest as jest.Mock).mockResolvedValue(mockAddedTask);

      await testController.addTaskToTest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(testService.addTaskToTest).toHaveBeenCalledWith(
        "test123",
        "teacher123",
        "HU",
        mockRequest.body
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Task added to test successfully",
        testTask: {
          id: "test-task-1",
          ...mockAddedTask.testTask,
        },
      });
    });

    it("should add custom task to test", async () => {
      mockRequest.params = { testId: "test123" };
      mockRequest.body = {
        customTitle: "Custom Problem",
        customText: "Solve the following equation",
        customQuestions: [
          { question: "a) x + 5 = 10", score: 5 },
          { question: "b) 2x = 12", score: 5 },
        ],
        showImage: false,
      };

      const mockAddedTask = {
        id: "test-task-2",
        testTask: {
          taskId: null,
          customTitle: "Custom Problem",
          customText: "Solve the following equation",
          customQuestions: mockRequest.body.customQuestions,
          orderIndex: 1,
          showImage: false,
          score: 10,
          addedAt: new Date(),
        },
      };

      (testService.addTaskToTest as jest.Mock).mockResolvedValue(mockAddedTask);

      await testController.addTaskToTest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(testService.addTaskToTest).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it("should reject invalid task (missing both taskId and custom fields)", async () => {
      mockRequest.params = { testId: "test123" };
      mockRequest.body = {
        showImage: true,
        // missing taskId and custom fields
      };

      (testService.addTaskToTest as jest.Mock).mockRejectedValue(
        new Error("Task must have either taskId or custom task data")
      );

      await testController.addTaskToTest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Invalid request",
        message: "Task must have either taskId or custom task data",
      });
    });
  });

  describe("PUT /api/v2/tests/:testId/tasks/:testTaskId - Update Test Task", () => {
    it("should update task properties", async () => {
      mockRequest.params = { testId: "test123", testTaskId: "task1" };
      mockRequest.body = {
        overrideTitle: "New Title",
        overrideText: "New text content",
        score: 20,
      };

      (testService.updateTestTask as jest.Mock).mockResolvedValue({});

      await testController.updateTestTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(testService.updateTestTask).toHaveBeenCalledWith(
        "test123",
        "task1",
        "teacher123",
        "HU",
        mockRequest.body
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe("DELETE /api/v2/tests/:testId/tasks/:testTaskId - Remove Task", () => {
    it("should remove task from test", async () => {
      mockRequest.params = { testId: "test123", testTaskId: "task1" };

      (testService.deleteTestTask as jest.Mock).mockResolvedValue({});

      await testController.deleteTestTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(testService.deleteTestTask).toHaveBeenCalledWith(
        "test123",
        "task1",
        "teacher123",
        "HU"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe("PUT /api/v2/tests/:testId/tasks/reorder - Reorder Tasks", () => {
    it("should reorder tasks with new indexes", async () => {
      mockRequest.params = { testId: "test123" };
      mockRequest.body = {
        taskOrders: [
          { testTaskId: "task1", orderIndex: 2 },
          { testTaskId: "task2", orderIndex: 0 },
          { testTaskId: "task3", orderIndex: 1 },
        ],
      };

      (testService.reorderTestTasks as jest.Mock).mockResolvedValue({});

      await testController.reorderTestTasks(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(testService.reorderTestTasks).toHaveBeenCalledWith(
        "test123",
        "teacher123",
        "HU",
        mockRequest.body
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Tasks reordered successfully",
      });
    });

    it("should handle bulk reorder operations", async () => {
      mockRequest.params = { testId: "test123" };
      mockRequest.body = {
        taskOrders: Array.from({ length: 10 }, (_, i) => ({
          testTaskId: `task${i}`,
          orderIndex: 9 - i, // Reverse order
        })),
      };

      (testService.reorderTestTasks as jest.Mock).mockResolvedValue({});

      await testController.reorderTestTasks(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(testService.reorderTestTasks).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe("POST /api/v2/tests/:testId/publish-public - Publish Test", () => {
    it("should publish test and return public link", async () => {
      mockRequest.params = { testId: "test123" };

      const mockPublishResult = {
        publicLink: "/published-tests/ABC123",
        publicId: "ABC123",
      };

      (testService.publishTestToPublic as jest.Mock).mockResolvedValue(
        mockPublishResult
      );

      await testController.publishTestToPublic(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(testService.publishTestToPublic).toHaveBeenCalledWith(
        "test123",
        "teacher123",
        "HU"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Test published to public successfully",
        publicLink: "/published-tests/ABC123",
        publicId: "ABC123",
      });
    });

    it("should allow republishing (updating published test)", async () => {
      mockRequest.params = { testId: "test123" };

      const mockRepublishResult = {
        publicLink: "/published-tests/ABC123",
        publicId: "ABC123",
      };

      (testService.publishTestToPublic as jest.Mock).mockResolvedValue(
        mockRepublishResult
      );

      await testController.publishTestToPublic(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should use same public ID if already published
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe("GET /api/v2/published-tests/:publicId - Get Published Test", () => {
    it("should return published test without authentication", async () => {
      // No user in request (public access)
      mockRequest.user = undefined;
      mockRequest.params = { publicId: "ABC123" };
      mockRequest.query = { country: "HU" };

      const mockPublishedTest = {
        id: "ABC123",
        name: "Public Test",
        subject: "mathematics",
        gradeLevel: "grade_9_10",
        description: "Public test description",
        tasks: [
          {
            title: "Task 1",
            text: "Task content",
            questions: ["Question 1"],
            score: 10,
            orderIndex: 0,
          },
        ],
        totalScore: 10,
        taskCount: 1,
        viewCount: 5,
        publishedAt: new Date(),
      };

      (testService.getPublishedTest as jest.Mock).mockResolvedValue(
        mockPublishedTest
      );

      await testController.getPublishedTest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(testService.getPublishedTest).toHaveBeenCalledWith("ABC123", "HU");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        test: mockPublishedTest,
      });
    });

    it("should return 404 for non-existent public ID", async () => {
      mockRequest.params = { publicId: "INVALID" };
      mockRequest.query = { country: "HU" };

      (testService.getPublishedTest as jest.Mock).mockRejectedValue(
        new Error("Published test not found")
      );

      await testController.getPublishedTest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "Test not found",
        message: "Published test not found",
      });
    });

    it("should default to US country if not specified", async () => {
      mockRequest.params = { publicId: "ABC123" };
      mockRequest.query = {}; // No country specified

      (testService.getPublishedTest as jest.Mock).mockResolvedValue({});

      await testController.getPublishedTest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(testService.getPublishedTest).toHaveBeenCalledWith("ABC123", "US");
    });
  });
});
