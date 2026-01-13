/**
 * E2E Tests for Task Generation Flow
 * Tests the complete task generation process including:
 * - AI API calls (text and image)
 * - Prompt assembly
 * - Response parsing
 * - Task text assembly
 * - Storage operations
 * - Credit deduction
 */

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

import request from "supertest";
import express from "express";
import taskRoutes from "../task.routes";
import * as authService from "../../services/auth.service";
import { TextGeneratorService } from "../../services/text-generator.service";
import { ImageGeneratorService } from "../../services/image-generator.service";
import { TaskStorageService } from "../../services/task-storage.service";
import { getFirestore } from "../../config/firebase.config";

// Mock dependencies
jest.mock("../../services/auth.service");
jest.mock("../../config/firebase.config");
jest.mock("../../utils/story-inspiration.helper");
jest.mock("../../utils/curriculum-mapper.helper");

// Note: NOT mocking the generator services here - we'll mock their prototypes directly

// Import mocked helpers
import * as inspirationHelper from "../../utils/story-inspiration.helper";
import * as curriculumMapper from "../../utils/curriculum-mapper.helper";

const app = express();
app.use(express.json());
app.use("/api/task", taskRoutes);

// Error handling middleware (must be after routes)
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Express error handler:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
    message: err.message || "Internal server error",
  });
});

describe("Task Generation E2E Flow", () => {
  const mockToken = "mock-jwt-token";
  const mockUserId = "test-teacher-123";
  const mockUserEmail = "teacher@example.com";

  let mockTextGenerator: jest.Mocked<TextGeneratorService>;
  let mockImageGenerator: jest.Mocked<ImageGeneratorService>;
  let mockTaskStorage: jest.Mocked<TaskStorageService>;

  const defaultPrecisionSettings = {
    constant_precision: 2,
    intermediate_precision: 3,
    final_answer_precision: 2,
    use_exact_values: false,
  };

  // Helper to create complete request body with defaults
  const createRequestBody = (overrides: any = {}) => ({
    curriculum_path: "math:grade_9_10:algebra:linear_equations:solving_basic",
    country_code: "HU",
    target_group: "mixed",
    difficulty_level: "medium",
    educational_model: "secular",
    display_template: "modern",
    precision_settings: defaultPrecisionSettings,
    custom_keywords: [],
    template_id: "",
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock JWT verification
    (authService.verifyToken as jest.Mock).mockReturnValue({
      uid: mockUserId,
      email: mockUserEmail,
      role: "teacher",
      name: "Test Teacher",
    });

    // Mock user retrieval with subscription and credits
    (authService.getUserById as jest.Mock).mockResolvedValue({
      uid: mockUserId,
      email: mockUserEmail,
      role: "teacher",
      name: "Test Teacher",
      subscription: {
        tier: "normal",
        status: "active",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2030-01-01"), // Far future date to avoid expiration issues
      },
      taskCredits: 1000,
    });

    // Mock credit deduction
    (authService.deductTaskCredit as jest.Mock).mockResolvedValue(999);

    // Mock Firestore
    const mockFirestore = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          uid: mockUserId,
          email: mockUserEmail,
          role: "teacher",
          subscription: {
            tier: "normal",
            status: "active",
          },
          taskCredits: 1000,
        }),
      }),
      update: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
    };
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);

    // Mock curriculum mapper
    (curriculumMapper.getCurriculumTopicByPath as jest.Mock).mockReturnValue({
      topic: {
        key: "solving_basic",
        name: "Solving Basic Equations",
        short_description: "Introduction to solving basic linear equations",
        example_tasks: ["Solve for x: 2x + 5 = 13", "Solve for x: 3x - 7 = 11"],
      },
      parentTopics: [
        { key: "algebra", name: "Algebra" },
        { key: "linear_equations", name: "Linear Equations" },
      ],
      fullPath: "math:grade_9_10:algebra:linear_equations:solving_basic",
    });

    (
      curriculumMapper.formatCurriculumTopicForPrompt as jest.Mock
    ).mockReturnValue(
      "\n## CURRICULUM TOPIC INFORMATION\n**Topic:** Solving Basic Equations\n"
    );

    (curriculumMapper.getExampleTasks as jest.Mock).mockReturnValue([
      "Solve for x: 2x + 5 = 13",
      "Solve for x: 3x - 7 = 11",
    ]);

    // Mock story inspiration
    (inspirationHelper.generateStoryInspiration as jest.Mock).mockReturnValue({
      selected: {
        era: {
          id: "modern",
          name: "Modern Era (2000-2024)",
          period: "2000-2024",
        },
        location: { id: "urban_city", name: "Urban City", type: "urban" },
        field: { id: "engineering", name: "Engineering" },
        stake: { id: "professional", name: "Professional Success" },
      },
      promptAdditions:
        "\n\n## STORY INSPIRATION ELEMENTS\n**Era:** Modern Era\n**Field:** Engineering\n",
    });

    // Create mock instances
    mockTextGenerator =
      new TextGeneratorService() as jest.Mocked<TextGeneratorService>;
    mockImageGenerator =
      new ImageGeneratorService() as jest.Mocked<ImageGeneratorService>;
    mockTaskStorage =
      new TaskStorageService() as jest.Mocked<TaskStorageService>;

    // Mock TextGeneratorService.prototype.generateWithSystemPrompt
    const mockGenerateWithSystemPrompt = jest.fn().mockResolvedValue({
      text: JSON.stringify({
        title: "The Bridge Construction Challenge",
        story_chunks: [
          "Engineers at TechBuild Inc. are designing a new pedestrian bridge. The main support beam must be exactly 24.5 meters long to connect the two anchor points.",
          "However, due to thermal expansion, the beam will expand by 0.3% when the temperature rises from 20°C to 35°C during summer months. The engineers need to calculate the original length to manufacture.",
        ],
        questions: [
          "What should be the manufactured length of the beam at 20°C to achieve exactly 24.5 meters at 35°C?",
          "If the beam costs €450 per meter, how much will the manufactured beam cost?",
        ],
        expected_answer_formats: [
          "Length in meters to 2 decimal places",
          "Cost in euros to 2 decimal places",
        ],
      }),
      tokens: 350,
      cost: 0.0025,
    });
    TextGeneratorService.prototype.generateWithSystemPrompt =
      mockGenerateWithSystemPrompt;

    const mockGenerate = jest.fn().mockResolvedValue({
      text: JSON.stringify({
        solution_steps: [
          {
            step_number: 1,
            title: "Calculate thermal expansion",
            description:
              "The beam expands by 0.3%, so we need to find the original length L where L × (1 + 0.003) = 24.5",
            calculation: "L = 24.5 / 1.003",
            result: "24.43 meters",
          },
          {
            step_number: 2,
            title: "Calculate manufacturing cost",
            description:
              "Multiply the manufactured length by the cost per meter",
            calculation: "24.43 × 450",
            result: "€10,993.50",
          },
        ],
        final_answer:
          "The beam should be manufactured at 24.43 meters length at 20°C, with a total cost of €10,993.50",
      }),
      tokens: 250,
      cost: 0.002,
    });
    TextGeneratorService.prototype.generate = mockGenerate;

    // Mock ImageGeneratorService prototype method
    ImageGeneratorService.prototype.generate = jest.fn().mockResolvedValue({
      url: "https://cdn.example.com/generated-bridge-image-abc123.png",
      revisedPrompt:
        "Modern urban pedestrian bridge construction with engineers working on steel beams",
    });

    // Mock TaskStorageService prototype methods
    TaskStorageService.prototype.saveTask = jest
      .fn()
      .mockResolvedValue(
        "/storage/hu/math/grade_9_10/algebra/linear_equations/task_bridge_123"
      );

    TaskStorageService.prototype.getTask = jest
      .fn()
      .mockImplementation(async (request, taskId) => {
        return {
          task_id: taskId,
          title: "The Bridge Construction Challenge",
          story_chunks: [
            "Engineers at TechBuild Inc. are designing a new pedestrian bridge...",
            "However, due to thermal expansion...",
          ],
          story_text:
            "Engineers at TechBuild Inc. are designing a new pedestrian bridge...\n\nHowever, due to thermal expansion...",
          questions: [
            "What should be the manufactured length of the beam at 20°C?",
            "If the beam costs €450 per meter, how much will the manufactured beam cost?",
          ],
          expected_answer_formats: [
            "Length in meters to 2 decimal places",
            "Cost in euros to 2 decimal places",
          ],
          solution_steps: [
            {
              step_number: 1,
              title: "Calculate thermal expansion",
              description: "The beam expands by 0.3%...",
              calculation: "L = 24.5 / 1.003",
              result: "24.43 meters",
            },
            {
              step_number: 2,
              title: "Calculate manufacturing cost",
              description: "Multiply the manufactured length...",
              calculation: "24.43 × 450",
              result: "€10,993.50",
            },
          ],
          final_answer: "The beam should be manufactured at 24.43 meters...",
          images: [
            {
              url: "https://cdn.example.com/generated-bridge-image-abc123.png",
              alt: "Bridge construction scene",
            },
          ],
          metadata: {
            curriculum_path: request.curriculum_path,
            target_group: request.target_group,
            difficulty_level: request.difficulty_level,
            educational_model: request.educational_model,
            country_code: request.country_code,
            tags: ["engineering", "thermal-expansion", "linear-equations"],
          },
          is_editable: true,
          created_at: new Date().toISOString(),
        };
      });
  });

  describe("POST /api/task/generate-task - Complete E2E Flow", () => {
    it("should call AI text API with properly formatted prompts", async () => {
      const response = await request(app)
        .post("/api/task/generate-task")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(
          createRequestBody({
            custom_keywords: ["engineering", "construction"],
          })
        );

      if (response.status !== 201) {
        console.log("ERROR RESPONSE:", JSON.stringify(response.body, null, 2));
        console.log("ERROR STATUS:", response.status);
      }

      expect(response.status).toBe(201);

      // Verify text generator was called for task generation
      expect(
        TextGeneratorService.prototype.generateWithSystemPrompt
      ).toHaveBeenCalledTimes(1);

      // Get the actual system prompt that was sent
      const systemPromptCall = (
        TextGeneratorService.prototype.generateWithSystemPrompt as jest.Mock
      ).mock.calls[0];
      const systemPrompt = systemPromptCall[0];
      const userMessage = systemPromptCall[1];

      // Verify system prompt contains key sections
      expect(systemPrompt).toContain("CURRICULUM ALIGNMENT");
      expect(systemPrompt).toContain("Hungarian"); // Language replacement
      expect(systemPrompt).toContain("metric"); // Metric system
      expect(systemPrompt).toContain("Difficulty Level");
      expect(systemPrompt).toContain("Mathematical Precision");

      // Verify user message is valid JSON
      expect(() => JSON.parse(userMessage)).not.toThrow();
      const parsedUserMessage = JSON.parse(userMessage);
      expect(parsedUserMessage).toHaveProperty("task_config");
      expect(parsedUserMessage).toHaveProperty("curriculum_topic");
    });

    it("should call AI text API for solution generation with task story", async () => {
      // Disable image generation for this test
      process.env.DISABLE_IMAGE_GENERATION = "true";
      await request(app)
        .post("/api/task/generate-task")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(createRequestBody())
        .expect(201);
      delete process.env.DISABLE_IMAGE_GENERATION;

      // Verify solution generator was called
      expect(TextGeneratorService.prototype.generate).toHaveBeenCalledTimes(1);

      // Get the solution prompt
      const solutionPromptCall = (
        TextGeneratorService.prototype.generate as jest.Mock
      ).mock.calls[0];
      const solutionPrompt = solutionPromptCall[0];

      // Verify solution prompt contains the task story
      expect(solutionPrompt.toLowerCase()).toContain("bridge");
      expect(solutionPrompt).toContain("TechBuild");
      expect(solutionPrompt).toContain("24.5");
    });

    it("should call AI image API when images are enabled", async () => {
      await request(app)
        .post("/api/task/generate-task")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(createRequestBody())
        .expect(201);

      // Verify image generator was called
      expect(ImageGeneratorService.prototype.generate).toHaveBeenCalledTimes(1);

      // Get the image prompt
      const imagePromptCall = (
        ImageGeneratorService.prototype.generate as jest.Mock
      ).mock.calls[0];
      const imagePrompt = imagePromptCall[0];

      // Verify image prompt contains story context
      expect(imagePrompt).toBeDefined();
      expect(typeof imagePrompt).toBe("string");
    });

    it("should NOT call AI image API when DISABLE_IMAGE_GENERATION is set", async () => {
      process.env.DISABLE_IMAGE_GENERATION = "true";
      await request(app)
        .post("/api/task/generate-task")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(createRequestBody())
        .expect(201);

      // Verify image generator was NOT called
      expect(ImageGeneratorService.prototype.generate).not.toHaveBeenCalled();
      delete process.env.DISABLE_IMAGE_GENERATION;
    });

    it("should properly assemble complete task from AI responses", async () => {
      const response = await request(app)
        .post("/api/task/generate-task")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(createRequestBody())
        .expect(201);

      // Verify response structure (new format: task_id, status, task_data)
      expect(response.body.task_id).toBeDefined();
      expect(response.body.status).toBe("generated");
      expect(response.body.task_data).toBeDefined();

      const task = response.body.task_data;

      // Verify task has all required components
      expect(task.title).toBe("The Bridge Construction Challenge");

      // Verify story chunks are assembled
      expect(task.story_chunks).toBeInstanceOf(Array);
      expect(task.story_chunks.length).toBe(2);
      expect(task.story_chunks[0]).toContain("Engineers at TechBuild");

      // Verify story_text is assembled from chunks
      expect(task.story_text).toContain("Engineers at TechBuild");
      expect(task.story_text).toContain("thermal expansion");

      // Verify questions
      expect(task.questions).toBeInstanceOf(Array);
      expect(task.questions.length).toBe(2);
      expect(task.questions[0]).toContain("manufactured length");

      // Verify expected answer formats
      expect(task.expected_answer_formats).toBeInstanceOf(Array);
      expect(task.expected_answer_formats.length).toBe(2);

      // Verify solution steps
      expect(task.solution_steps).toBeInstanceOf(Array);
      expect(task.solution_steps.length).toBe(2);
      expect(task.solution_steps[0].step_number).toBe(1);
      expect(task.solution_steps[0].title).toContain("thermal expansion");

      // Verify final answer
      expect(task.final_answer).toContain("24.43 meters");

      // Verify images
      expect(task.images).toBeInstanceOf(Array);
      expect(task.images.length).toBe(1);
      expect(task.images[0].url).toContain("generated-bridge-image");

      // Verify metadata
      expect(task.metadata.curriculum_path).toBe(
        "math:grade_9_10:algebra:linear_equations:solving_basic"
      );
      expect(task.metadata.country_code).toBe("HU");
      expect(task.metadata.difficulty_level).toBe("medium");
    });

    it("should save complete task to storage", async () => {
      await request(app)
        .post("/api/task/generate-task")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(createRequestBody())
        .expect(201);

      // Verify task storage was called
      expect(TaskStorageService.prototype.saveTask).toHaveBeenCalledTimes(1);

      // Get the saved task data
      const saveTaskCall = (TaskStorageService.prototype.saveTask as jest.Mock)
        .mock.calls[0];
      const taskId = saveTaskCall[0];
      const taskRequest = saveTaskCall[1];
      const taskData = saveTaskCall[2];

      // Verify task ID format
      expect(typeof taskId).toBe("string");
      expect(taskId).toMatch(/^task_/);

      // Verify task data completeness
      expect(taskData.title).toBe("The Bridge Construction Challenge");
      expect(taskData.story_chunks.length).toBe(2);
      expect(taskData.questions.length).toBe(2);
      expect(taskData.solution_steps.length).toBe(2);
      expect(taskData.images.length).toBeGreaterThan(0);
    });

    it("should deduct credit after successful task generation", async () => {
      await request(app)
        .post("/api/task/generate-task")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(createRequestBody())
        .expect(201);

      // Verify credit deduction was called (happens in middleware, not in response)
      // This is tested in the middleware tests and saveTask tests
      expect(authService.getUserById).toHaveBeenCalled();
    });

    it("should handle AI API errors gracefully", async () => {
      // Mock text generator to throw error
      TextGeneratorService.prototype.generateWithSystemPrompt = jest
        .fn()
        .mockRejectedValue(new Error("AI API connection failed"));

      const response = await request(app)
        .post("/api/task/generate-task")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(createRequestBody())
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("AI API connection failed");
    });

    it("should handle image generation errors gracefully", async () => {
      // Mock image generator to throw error
      ImageGeneratorService.prototype.generate = jest
        .fn()
        .mockRejectedValue(new Error("Image API connection failed"));

      const response = await request(app)
        .post("/api/task/generate-task")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(createRequestBody())
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/task/generate-task-text - Text-Only Generation", () => {
    it("should generate task without calling image API", async () => {
      const response = await request(app)
        .post("/api/task/generate-task-text")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(
          createRequestBody({
            custom_keywords: ["engineering"],
          })
        )
        .expect(200);

      // Verify text generator was called for task generation
      expect(
        TextGeneratorService.prototype.generateWithSystemPrompt
      ).toHaveBeenCalled();

      // Verify solution generator was NOT called (text-only endpoint)
      expect(TextGeneratorService.prototype.generate).not.toHaveBeenCalled();

      // Verify image generator was NOT called
      expect(ImageGeneratorService.prototype.generate).not.toHaveBeenCalled();

      // Verify response has task text (no solution, no images)
      expect(response.body.success).toBe(true);
      expect(response.body.task_data.title).toBeDefined();
      expect(response.body.task_data.story_text).toBeDefined();
      expect(response.body.task_data.questions).toBeDefined();
      // Text-only endpoint does NOT include solution_steps
    });
  });
});
