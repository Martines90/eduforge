/**
 * Tasks V2 Routes (Firestore-based)
 * API endpoints for CRUD operations on educational tasks
 */

import { Router, Request, Response, NextFunction } from "express";
import * as taskService from "../services/task.service";
import {
  CreateTaskRequest,
  UpdateTaskRequest,
  GetTasksQuery,
  SubmitRatingRequest,
} from "../types/task.types";
import { verifyToken } from "../services/auth.service";
import { requireBasicPlan } from "../middleware/role.middleware";
import { authenticateOrGuest } from "../middleware/guest-auth.middleware";
import * as guestAuthService from "../services/guest-auth.service";

const router = Router();

/**
 * Extended Request interface with authenticated user
 */
interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to extract and verify JWT token
 */
const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    (req as AuthenticatedRequest).user = decoded as {
      uid: string;
      email: string;
      role: string;
    };
    next();
  } catch (_error: unknown) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * Middleware to optionally extract and verify JWT token
 * Continues without error if token is missing or invalid
 */
const optionalAuthenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = verifyToken(token);
        (req as AuthenticatedRequest).user = decoded as {
          uid: string;
          email: string;
          role: string;
        };
      } catch {
        // Token invalid, but we continue without user
      }
    }
    next();
  } catch (_error: unknown) {
    // Continue without authentication
    next();
  }
};

/**
 * Middleware to check if user is a teacher
 */
const requireTeacher = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as AuthenticatedRequest).user;

  if (!user || user.role !== "teacher") {
    return res.status(403).json({
      success: false,
      message: "Only teachers can perform this action",
    });
  }

  next();
};

/**
 * POST /api/v2/tasks
 * Create a new task (teachers only)
 */
router.post(
  "/api/v2/tasks",
  authenticateUser,
  requireTeacher,
  async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const taskData: CreateTaskRequest = req.body;

      const taskId = await taskService.createTask(user.uid, taskData);

      res.status(201).json({
        success: true,
        data: {
          id: taskId,
        },
        message: "Task created successfully",
      });
    } catch (error: unknown) {
      console.error("Error creating task:", error);
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create task",
      });
    }
  }
);

/**
 * GET /api/v2/tasks
 * Get tasks with filtering and pagination
 * Public endpoint - no authentication required for browsing published tasks
 * Authentication is enforced when viewing individual task details
 */
router.get("/api/v2/tasks", async (req: Request, res: Response) => {
  try {
    const query: GetTasksQuery = {
      curriculum_path: req.query.curriculum_path as string,
      subject: req.query.subject as string,
      gradeLevel: req.query.gradeLevel as string,
      subjectMappingId: req.query.subjectMappingId as string,
      search: req.query.search as string,
      difficultyLevel: req.query.difficultyLevel as
        | "easy"
        | "medium"
        | "hard"
        | undefined,
      tags: req.query.tags ? (req.query.tags as string).split(",") : undefined,
      sort:
        (req.query.sort as
          | "rating"
          | "views"
          | "recent"
          | "popular"
          | undefined) || "recent",
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      createdBy: req.query.createdBy as string,
      isPublished: req.query.isPublished === "true",
    };

    const result = await taskService.getTasks(query);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    console.error("Error getting tasks:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to get tasks",
    });
  }
});

/**
 * GET /api/v2/tasks/search
 * Search tasks by text
 * Requires at least Basic plan subscription
 */
router.get(
  "/api/v2/tasks/search",
  authenticateUser,
  requireBasicPlan,
  async (req: Request, res: Response) => {
    try {
      const searchText = req.query.q as string;

      if (!searchText || searchText.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Search query (q) is required",
        });
      }

      const filters = {
        subject: req.query.subject as string,
        gradeLevel: req.query.gradeLevel as string,
      };

      const tasks = await taskService.searchTasks(searchText, filters);

      res.status(200).json({
        success: true,
        data: tasks,
        count: tasks.length,
      });
    } catch (error: unknown) {
      console.error("Error searching tasks:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to search tasks",
      });
    }
  }
);

/**
 * GET /api/v2/tasks/my
 * Get tasks created by authenticated teacher
 */
router.get(
  "/api/v2/tasks/my",
  authenticateUser,
  requireTeacher,
  async (req: Request, res: Response) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const query: GetTasksQuery = {
        createdBy: user.uid,
        isPublished:
          req.query.status === "published"
            ? true
            : req.query.status === "draft"
              ? false
              : undefined,
        sort:
          (req.query.sort as
            | "rating"
            | "views"
            | "recent"
            | "popular"
            | undefined) || "recent",
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const result = await taskService.getTasks(query);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: unknown) {
      console.error("Error getting my tasks:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get your tasks",
      });
    }
  }
);

/**
 * GET /api/v2/tasks/:id
 * Get a specific task by ID
 * Supports both authenticated users and guest sessions
 * Guest users have limited task views (GUEST_TASK_VIEW_LIMIT)
 */
router.get(
  "/api/v2/tasks/:id",
  authenticateOrGuest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const incrementViews = req.query.view === "true";
      const authReq = req as any;
      const isGuest = authReq.guestSessionId !== undefined;

      // Handle guest task view limit
      if (isGuest && incrementViews) {
        try {
          await guestAuthService.incrementGuestTaskView(
            authReq.guestSessionId,
            id
          );
        } catch (error: unknown) {
          if (
            error instanceof Error &&
            error.message === "GUEST_NO_MORE_TASK_VIEW"
          ) {
            return res.status(403).json({
              success: false,
              error: "GUEST_NO_MORE_TASK_VIEW",
              message:
                "You've reached your free task view limit. Please register to view more tasks!",
            });
          }
          throw error;
        }
      }

      const task = await taskService.getTaskById(id, incrementViews);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      // Check if user is authorized to view unpublished tasks
      if (!task.isPublished) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return res.status(403).json({
            success: false,
            message: "This task is not published",
          });
        }

        try {
          const token = authHeader.split(" ")[1];
          const user = verifyToken(token);

          if (user.uid !== task.createdBy) {
            return res.status(403).json({
              success: false,
              message: "This task is not published",
            });
          }
        } catch {
          return res.status(403).json({
            success: false,
            message: "This task is not published",
          });
        }
      }

      // For registered users with Basic plan or higher, allow viewing
      // For guests, allow viewing (they've already been checked for view limit)
      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error: unknown) {
      console.error("Error getting task:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to get task",
      });
    }
  }
);

/**
 * PUT /api/v2/tasks/:id
 * Update a task (owner only)
 */
router.put(
  "/api/v2/tasks/:id",
  authenticateUser,
  requireTeacher,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const updateData: UpdateTaskRequest = req.body;

      await taskService.updateTask(id, user.uid, updateData);

      res.status(200).json({
        success: true,
        message: "Task updated successfully",
      });
    } catch (error: unknown) {
      console.error("Error updating task:", error);
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update task",
      });
    }
  }
);

/**
 * DELETE /api/v2/tasks/:id
 * Delete a task (owner only)
 */
router.delete(
  "/api/v2/tasks/:id",
  authenticateUser,
  requireTeacher,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      await taskService.deleteTask(id, user.uid);

      res.status(200).json({
        success: true,
        message: "Task deleted successfully",
      });
    } catch (error: unknown) {
      console.error("Error deleting task:", error);
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete task",
      });
    }
  }
);

/**
 * POST /api/v2/tasks/:id/rate
 * Submit or update rating for a task (authenticated users)
 */
router.post(
  "/api/v2/tasks/:id/rate",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const ratingData: SubmitRatingRequest = req.body;

      await taskService.submitRating(id, user.uid, ratingData);

      res.status(200).json({
        success: true,
        message: "Rating submitted successfully",
      });
    } catch (error: unknown) {
      console.error("Error submitting rating:", error);
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to submit rating",
      });
    }
  }
);

/**
 * GET /api/v2/tasks/:id/ratings
 * Get ratings for a task
 */
router.get("/api/v2/tasks/:id/ratings", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await taskService.getTaskRatings(id, limit, offset);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    console.error("Error getting ratings:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to get ratings",
    });
  }
});

export default router;
