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
      GenerateTaskRequest: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Optional topic or theme for the task",
            example: "Ancient Roman architecture and engineering",
          },
          numImages: {
            type: "integer",
            description: "Number of images to generate (1-5)",
            minimum: 1,
            maximum: 5,
            default: 2,
            example: 2,
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
