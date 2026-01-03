import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/auth.service";

/**
 * Extended Request interface with user information
 */
export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: "teacher" | "general_user";
    name: string;
  };
}

/**
 * Middleware to verify JWT token and attach user to request
 *
 * Usage:
 * router.post('/protected-route', authenticate, controller.method);
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('[Auth Middleware] Authorization header:', authHeader ? 'present' : 'missing');

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Authorization header is required",
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

    console.log('[Auth Middleware] Token extracted, verifying...');
    // Verify token and extract user info
    const decoded = verifyToken(token);
    console.log('[Auth Middleware] Token verified successfully:', { uid: decoded.uid, email: decoded.email, role: decoded.role });

    // Attach user to request object
    (req as AuthRequest).user = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role as "teacher" | "general_user",
      name: decoded.name,
    };

    console.log('[Auth Middleware] User attached to request');
    next();
  } catch (error) {
    console.error("[Auth Middleware] Authentication error:", error);
    res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }
};

/**
 * Middleware to check if user has teacher role
 * Must be used after authenticate middleware
 *
 * Usage:
 * router.post('/teacher-only', authenticate, requireTeacher, controller.method);
 */
export const requireTeacher = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;

  console.log('[requireTeacher] Checking if user exists on request:', !!authReq.user);
  console.log('[requireTeacher] User role:', authReq.user?.role);

  if (!authReq.user) {
    console.error('[requireTeacher] No user on request object');
    res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Authentication required",
    });
    return;
  }

  if (authReq.user.role !== "teacher") {
    console.error('[requireTeacher] User is not a teacher:', authReq.user.role);
    res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "This endpoint requires teacher role",
    });
    return;
  }

  console.log('[requireTeacher] Teacher check passed');
  next();
};

/**
 * Combined middleware for routes that require authenticated teacher
 *
 * Usage:
 * router.post('/teacher-only', requireAuthenticatedTeacher, controller.method);
 */
export const requireAuthenticatedTeacher = [authenticate, requireTeacher];
