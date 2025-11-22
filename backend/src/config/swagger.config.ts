import swaggerJsdoc from "swagger-jsdoc";
import { config } from "../config";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "EduForge API",
    version: "1.0.0",
    description:
      "RESTful API for generating educational math tasks with AI-powered text and image generation using OpenAI's GPT-4o and DALL-E-3.",
    contact: {
      name: "EduForge Team",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: "Development server",
    },
    {
      url: `http://localhost:${config.port}`,
      description: "Local server",
    },
  ],
  tags: [
    {
      name: "Tasks",
      description: "Task generation and retrieval endpoints",
    },
    {
      name: "Health",
      description: "Health check endpoints",
    },
  ],
  components: {
    schemas: {
      Task: {
        type: "object",
        required: ["id", "description", "images"],
        properties: {
          id: {
            type: "string",
            description: "Unique task identifier (32-character hex string)",
            example: "task_a1b2c3d4e5f6789012345678901234ab",
          },
          description: {
            type: "string",
            description: "Task description in markdown format",
            example:
              "# The Great Canal of 1855\n\nAs chief engineer for the Imperial Navigation Company...",
          },
          images: {
            type: "array",
            description: "Array of task images",
            items: {
              $ref: "#/components/schemas/TaskImage",
            },
          },
        },
      },
      TaskImage: {
        type: "object",
        required: ["id", "url"],
        properties: {
          id: {
            type: "string",
            description: "Unique image identifier (32-character hex string)",
            example: "image_x1y2z3a4b5c6789012345678901234xy",
          },
          url: {
            type: "string",
            description: "URL path to the image file",
            example:
              "/storage/tasks/task_a1b2c3d4e5f6789012345678901234ab/images/image_x1y2z3a4b5c6789012345678901234xy.png",
          },
        },
      },
      PrecisionSettings: {
        type: "object",
        required: [
          "constant_precision",
          "intermediate_precision",
          "final_answer_precision",
        ],
        properties: {
          constant_precision: {
            type: "integer",
            description:
              "Precision for constants like π (e.g., 2 for 3.14, 4 for 3.1416)",
            example: 2,
            minimum: 0,
            maximum: 10,
          },
          intermediate_precision: {
            type: "integer",
            description: "Precision for intermediate calculations",
            example: 4,
            minimum: 0,
            maximum: 10,
          },
          final_answer_precision: {
            type: "integer",
            description: "Precision for final answer",
            example: 2,
            minimum: 0,
            maximum: 10,
          },
          use_exact_values: {
            type: "boolean",
            description:
              "Whether to use exact values (fractions, π symbol) or decimals",
            example: false,
            default: false,
          },
        },
      },
      GenerateTaskRequest: {
        type: "object",
        required: [
          "curriculum_path",
          "country_code",
          "target_group",
          "difficulty_level",
          "educational_model",
          "number_of_images",
          "display_template",
          "precision_settings",
        ],
        properties: {
          curriculum_path: {
            type: "string",
            description:
              "Navigation path to the specific curriculum topic (colon-separated)",
            example:
              "math:grade_9_10:algebra:linear_equations:solving_basic_equations",
          },
          country_code: {
            type: "string",
            description:
              "User country/locale code - determines language and unit system",
            example: "US",
            pattern: "^[A-Z]{2}$",
          },
          target_group: {
            type: "string",
            description: "Target audience gender specification",
            enum: ["boys", "girls", "mixed"],
            example: "mixed",
          },
          difficulty_level: {
            type: "string",
            description: "Task difficulty level",
            enum: ["easy", "medium", "hard"],
            example: "medium",
          },
          educational_model: {
            type: "string",
            description: "Educational philosophy/approach",
            enum: [
              "secular",
              "conservative",
              "traditional",
              "liberal",
              "progressive",
              "religious_christian",
              "religious_islamic",
              "religious_jewish",
              "montessori",
              "waldorf",
            ],
            example: "secular",
          },
          number_of_images: {
            type: "integer",
            description: "Number of illustration images to generate",
            enum: [0, 1, 2],
            example: 2,
          },
          display_template: {
            type: "string",
            description: "Display template for task layout",
            enum: ["classic", "modern", "comic", "minimal", "illustrated"],
            example: "modern",
          },
          precision_settings: {
            $ref: "#/components/schemas/PrecisionSettings",
          },
          custom_keywords: {
            type: "array",
            description: "Optional custom keywords for story inspiration",
            items: {
              type: "string",
            },
            example: ["Renaissance", "architecture", "trade"],
          },
          template_id: {
            type: "string",
            description: "Optional template ID if user has saved templates",
            example: "template_abc123...",
          },
        },
      },
      HealthResponse: {
        type: "object",
        required: ["status", "timestamp"],
        properties: {
          status: {
            type: "string",
            description: "Health status",
            example: "ok",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "Current server timestamp",
            example: "2025-11-22T10:30:00.000Z",
          },
        },
      },
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "string",
            description: "Error message",
            example: "Task not found",
          },
          message: {
            type: "string",
            description: "Detailed error message",
            example: "No task found with ID: task_invalid123",
          },
          stack: {
            type: "string",
            description: "Stack trace (only in development mode)",
          },
        },
      },
    },
    responses: {
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
          },
        },
      },
      InternalServerError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
          },
        },
      },
    },
  },
};

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: ["./src/routes/*.ts", "./dist/routes/*.js"], // Support both TS and compiled JS
};

export const swaggerSpec = swaggerJsdoc(options);
