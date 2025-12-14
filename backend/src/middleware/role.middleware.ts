import { Request, Response, NextFunction } from 'express';
import { getUserById } from '../services/auth.service';

/**
 * Middleware to check if the authenticated user is a teacher
 */
export async function requireTeacher(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Get user ID from the authenticated request (set by auth middleware)
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Get user from database
    const user = await getUserById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if user is a teacher
    if (user.role !== 'teacher') {
      res.status(403).json({
        success: false,
        message: 'This action is only available to teachers',
      });
      return;
    }

    // Attach user to request for downstream use
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Error in requireTeacher middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * Middleware to check if teacher has task credits remaining
 */
export async function requireTaskCredits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // User should already be attached by requireAuthenticatedTeacher middleware
    const authUser = (req as any).user;

    if (!authUser || !authUser.uid) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Fetch full user details from database to get taskCredits
    const user = await getUserById(authUser.uid);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check task credits
    const credits = user.taskCredits || 0;

    if (credits <= 0) {
      res.status(403).json({
        success: false,
        message: 'You have no task creation credits remaining',
        data: {
          remainingCredits: 0,
        },
      });
      return;
    }

    // Attach credits to request for downstream use
    (req as any).remainingCredits = credits;
    next();
  } catch (error) {
    console.error('Error in requireTaskCredits middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
