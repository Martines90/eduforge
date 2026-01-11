// Mock firebase-admin BEFORE any imports
jest.mock("firebase-admin", () => ({
  firestore: Object.assign(
    jest.fn(() => ({
      collection: jest.fn(),
    })),
    {
      FieldValue: {
        serverTimestamp: jest.fn(() => new Date()),
        increment: jest.fn((n: number) => n),
        delete: jest.fn(() => undefined),
        arrayUnion: jest.fn((...elements: any[]) => elements),
        arrayRemove: jest.fn((...elements: any[]) => elements),
      },
      Timestamp: {
        now: jest.fn(() => ({ toDate: () => new Date() })),
        fromDate: jest.fn((date: Date) => ({ toDate: () => date })),
      },
    }
  ),
  auth: jest.fn(() => ({
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    deleteUser: jest.fn(),
  })),
  credential: {
    cert: jest.fn(),
  },
  initializeApp: jest.fn(),
}));

import { Request, Response, NextFunction } from "express";
import { TaskController } from "../task.controller";
import { deductTaskCredit } from "../../services/auth.service";
import { getFirestore } from "../../config/firebase.config";
import { AuthRequest } from "../../middleware/auth.middleware";

// Mock dependencies
jest.mock("../../services/task-generator.service");
jest.mock("../../services/task-storage.service");
jest.mock("../../services/task-selection.service");
jest.mock("../../services/auth.service");
jest.mock("../../config/firebase.config");

describe("TaskController", () => {
  let taskController: TaskController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockFirestore: any;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create controller instance
    taskController = new TaskController();

    // Mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock next function
    mockNext = jest.fn();

    // Mock Firestore with proper chaining
    const mockDoc = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue({ exists: false }),
    };

    const mockCollection = {
      doc: jest.fn().mockReturnValue(mockDoc),
    };

    mockFirestore = {
      collection: jest.fn().mockReturnValue(mockCollection),
      doc: mockDoc,
      set: mockDoc.set,
    };

    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
  });

  describe("saveTask", () => {
    const mockTaskId = "task_abc123";
    const mockUserId = "user_teacher_123";
    const mockUserName = "John Teacher";
    const mockUserEmail = "teacher@example.com";

    const mockTaskData = {
      description: "<h1>Test Task</h1><p>This is a test task description</p>",
      solution: "<p>This is the solution</p>",
      images: ["https://example.com/image1.png"],
      metadata: {
        curriculum_path: "math:grade_9_10:algebra:linear_equations",
        difficulty_level: "medium",
        educational_model: "secular",
        country_code: "US",
      },
    };

    beforeEach(() => {
      mockRequest = {
        body: {
          task_id: mockTaskId,
          task_data: mockTaskData,
          curriculum_path: "math:grade_9_10:algebra:linear_equations",
          country_code: "US",
        },
        user: {
          uid: mockUserId,
          name: mockUserName,
          email: mockUserEmail,
          role: "teacher",
        },
      } as AuthRequest;
    });

    it("should successfully save task and deduct credit", async () => {
      // Mock deductTaskCredit to return remaining credits
      (deductTaskCredit as jest.Mock).mockResolvedValue(99);

      await taskController.saveTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verify Firestore was called correctly
      const mockCollection = mockFirestore.collection();
      expect(mockFirestore.collection).toHaveBeenCalledWith("tasks");
      expect(mockCollection.doc).toHaveBeenCalledWith(mockTaskId);

      const mockDoc = mockCollection.doc();
      expect(mockDoc.set).toHaveBeenCalledWith(
        expect.objectContaining({
          task_id: mockTaskId,
          task_data: mockTaskData,
          curriculum_path: "math:grade_9_10:algebra:linear_equations",
          subject: "math",
          gradeLevel: "grade_9_10",
          subjectMappingPath: "algebra > linear_equations",
          country_code: "US",
          educationalModel: "secular",
          created_by: mockUserId,
          creatorName: mockUserName,
          isPublished: true,
          title: "Test Task",
        })
      );

      // Verify credit deduction was called
      expect(deductTaskCredit).toHaveBeenCalledWith(mockUserId);

      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Task saved successfully",
        task_id: mockTaskId,
        public_share_link: expect.stringContaining(mockTaskId),
        remaining_credits: 99,
      });

      // Verify next was not called (no errors)
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should save task even if credit deduction fails", async () => {
      // Mock deductTaskCredit to throw an error
      (deductTaskCredit as jest.Mock).mockRejectedValue(
        new Error("Credit deduction failed")
      );

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await taskController.saveTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verify task was still saved to Firestore
      expect(mockFirestore.set).toHaveBeenCalled();

      // Verify response still succeeds but with 0 credits
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Task saved successfully",
        task_id: mockTaskId,
        public_share_link: expect.stringContaining(mockTaskId),
        remaining_credits: 0,
      });

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "⚠️ Failed to deduct task credit:",
        "Credit deduction failed"
      );

      consoleErrorSpy.mockRestore();
    });

    it("should return 400 if task_id is missing", async () => {
      mockRequest.body = {
        task_data: mockTaskData,
      };

      await taskController.saveTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Missing required fields: task_id and task_data are required",
      });

      // Credit should not be deducted
      expect(deductTaskCredit).not.toHaveBeenCalled();

      // Firestore should not be called
      expect(mockFirestore.set).not.toHaveBeenCalled();
    });

    it("should return 400 if task_data is missing", async () => {
      mockRequest.body = {
        task_id: mockTaskId,
      };

      await taskController.saveTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Missing required fields: task_id and task_data are required",
      });

      expect(deductTaskCredit).not.toHaveBeenCalled();
      expect(mockFirestore.set).not.toHaveBeenCalled();
    });

    it("should return 401 if user is not authenticated", async () => {
      // Remove user from request
      (mockRequest as any).user = undefined;

      await taskController.saveTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Authentication required to save tasks",
      });

      expect(deductTaskCredit).not.toHaveBeenCalled();
      expect(mockFirestore.set).not.toHaveBeenCalled();
    });

    it("should use email as creator name if name is not available", async () => {
      // Remove name from user
      (mockRequest as any).user = {
        uid: mockUserId,
        email: mockUserEmail,
        role: "teacher",
      };

      (deductTaskCredit as jest.Mock).mockResolvedValue(99);

      await taskController.saveTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verify creatorName uses email
      expect(mockFirestore.set).toHaveBeenCalledWith(
        expect.objectContaining({
          creatorName: mockUserEmail,
        })
      );
    });

    it('should use "Unknown Teacher" as creator name if name and email are not available', async () => {
      // Remove name and email from user
      (mockRequest as any).user = {
        uid: mockUserId,
        role: "teacher",
      };

      (deductTaskCredit as jest.Mock).mockResolvedValue(99);

      await taskController.saveTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verify creatorName uses fallback
      expect(mockFirestore.set).toHaveBeenCalledWith(
        expect.objectContaining({
          creatorName: "Unknown Teacher",
        })
      );
    });

    it("should correctly parse curriculum path with multiple levels", async () => {
      mockRequest.body.curriculum_path =
        "math:grade_11_12:geometry:circles:arc_length:advanced";

      (deductTaskCredit as jest.Mock).mockResolvedValue(99);

      await taskController.saveTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockFirestore.set).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "math",
          gradeLevel: "grade_11_12",
          subjectMappingPath: "geometry > circles > arc_length > advanced",
        })
      );
    });

    it("should handle missing curriculum path gracefully", async () => {
      mockRequest.body.curriculum_path = undefined;

      (deductTaskCredit as jest.Mock).mockResolvedValue(99);

      await taskController.saveTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockFirestore.set).toHaveBeenCalledWith(
        expect.objectContaining({
          curriculum_path: "unknown",
          subject: "mathematics",
          gradeLevel: "grade_9_10",
          subjectMappingPath: "",
        })
      );
    });

    it("should call next with error if Firestore save fails", async () => {
      const firestoreError = new Error("Firestore connection failed");
      mockFirestore.set.mockRejectedValue(firestoreError);

      await taskController.saveTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Verify next was called with the error
      expect(mockNext).toHaveBeenCalledWith(firestoreError);

      // Response should not be sent
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it("should extract title from description HTML correctly", async () => {
      mockRequest.body.task_data = {
        ...mockTaskData,
        description: "<h1>Linear Equations Practice</h1><p>Solve for x</p>",
      };

      (deductTaskCredit as jest.Mock).mockResolvedValue(99);

      await taskController.saveTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockFirestore.set).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Linear Equations Practice",
        })
      );
    });

    it("should truncate title if no h1 tag found", async () => {
      const longDescription = "<p>" + "a".repeat(100) + "</p>";
      mockRequest.body.task_data = {
        ...mockTaskData,
        description: longDescription,
      };

      (deductTaskCredit as jest.Mock).mockResolvedValue(99);

      await taskController.saveTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockFirestore.set).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "a".repeat(50) + "...",
        })
      );
    });

    it("should set default values for missing metadata fields", async () => {
      mockRequest.body.task_data = {
        description: "<h1>Test</h1>",
        solution: "<p>Solution</p>",
        metadata: {}, // Empty metadata
      };

      (deductTaskCredit as jest.Mock).mockResolvedValue(99);

      await taskController.saveTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockFirestore.set).toHaveBeenCalledWith(
        expect.objectContaining({
          educationalModel: "secular",
          difficultyLevel: "medium",
          estimatedDurationMinutes: 30,
          tags: [],
        })
      );
    });

    it("should generate correct public share link", async () => {
      process.env.FRONTEND_URL = "https://eduforger.app";

      (deductTaskCredit as jest.Mock).mockResolvedValue(99);

      await taskController.saveTask(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          public_share_link: "https://eduforger.app/tasks/task_abc123",
        })
      );
    });
  });
});
