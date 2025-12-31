import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/auth.service";
import { verifyGuestToken } from "../services/guest-auth.service";

/**
 * Extended Request interface with optional user or guest information
 */
export interface GuestAuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: "teacher" | "general_user";
    name: string;
  };
  guest?: {
    sessionId: string;
    generationsUsed: number;
    maxGenerations: number;
    createdAt: Date;
  };
  isGuest?: boolean;
}

/**
 * Middleware that allows both authenticated users and guest sessions
 * This middleware does NOT block requests - it just enriches the request object
 *
 * Usage:
 * router.post('/generate-task-guest', authenticateOrGuest, controller.method);
 */
export const authenticateOrGuest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No auth header - treat as guest
      (req as GuestAuthRequest).isGuest = true;
      next();
      return;
    }

    // Extract token (format: "Bearer <token>")
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      // No token - treat as guest
      (req as GuestAuthRequest).isGuest = true;
      next();
      return;
    }

    // Try to verify as regular JWT token first
    try {
      const decoded = verifyToken(token);

      // Valid JWT token - authenticated user
      (req as GuestAuthRequest).user = {
        uid: decoded.uid,
        email: decoded.email,
        role: decoded.role as "teacher" | "general_user",
        name: decoded.name,
      };
      (req as GuestAuthRequest).isGuest = false;
      next();
      return;
    } catch (jwtError) {
      // Not a valid JWT, try guest token
      try {
        const guestData = await verifyGuestToken(token);

        // Valid guest token
        (req as GuestAuthRequest).guest = guestData;
        (req as GuestAuthRequest).isGuest = true;
        next();
        return;
      } catch (guestError) {
        // Neither JWT nor guest token - treat as unauthenticated guest
        (req as GuestAuthRequest).isGuest = true;
        next();
        return;
      }
    }
  } catch (error) {
    console.error("Authentication/Guest error:", error);
    // On any error, treat as guest
    (req as GuestAuthRequest).isGuest = true;
    next();
  }
};

/**
 * Middleware that REQUIRES either authenticated user OR valid guest token
 * This middleware WILL block requests without any valid authentication
 *
 * Usage:
 * router.post('/require-auth-or-guest', requireAuthOrGuest, controller.method);
 */
export const requireAuthOrGuest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: "Unauthorized",
        message:
          "Authorization header is required. Please provide a user token or guest token.",
      });
      return;
    }

    // Extract token (format: "Bearer <token>")
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Token is required",
      });
      return;
    }

    // Try to verify as regular JWT token first
    try {
      const decoded = verifyToken(token);

      // Valid JWT token - authenticated user
      (req as GuestAuthRequest).user = {
        uid: decoded.uid,
        email: decoded.email,
        role: decoded.role as "teacher" | "general_user",
        name: decoded.name,
      };
      (req as GuestAuthRequest).isGuest = false;
      next();
      return;
    } catch (jwtError) {
      // Not a valid JWT, try guest token
      try {
        const guestData = await verifyGuestToken(token);

        // Valid guest token
        (req as GuestAuthRequest).guest = guestData;
        (req as GuestAuthRequest).isGuest = true;
        next();
        return;
      } catch (guestError) {
        // Neither JWT nor guest token - reject
        res.status(401).json({
          success: false,
          error: "Unauthorized",
          message: "Invalid or expired token",
        });
        return;
      }
    }
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Authentication failed",
    });
  }
};
