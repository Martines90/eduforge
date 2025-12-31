import { Request, Response, NextFunction } from "express";
import { getUserById } from "../services/auth.service";

/**
 * Middleware to check if the authenticated user is a teacher
 */
export async function requireTeacher(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get user ID from the authenticated request (set by auth middleware)
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Get user from database
    const user = await getUserById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Check if user is a teacher
    if (user.role !== "teacher") {
      res.status(403).json({
        success: false,
        message: "This action is only available to teachers",
      });
      return;
    }

    // Attach user to request for downstream use
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Error in requireTeacher middleware:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/**
 * Middleware to check if user has an active subscription
 */
export async function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // User should already be attached by requireAuthenticatedTeacher middleware
    const authUser = (req as any).user;

    if (!authUser || !authUser.uid) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Fetch full user details from database to get subscription
    const user = await getUserById(authUser.uid);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Check if user has a subscription
    if (!user.subscription) {
      res.status(403).json({
        success: false,
        message:
          "Your subscription has ended! Go to My Subscriptions and pick a plan!",
        errorCode: "NO_SUBSCRIPTION",
        data: {
          subscriptionRequired: true,
        },
      });
      return;
    }

    // Check if subscription is active
    if (user.subscription.status !== "active") {
      const tierName =
        user.subscription.tier.charAt(0).toUpperCase() +
        user.subscription.tier.slice(1);
      res.status(403).json({
        success: false,
        message: `Your ${tierName} plan subscription has ended! Go to My Subscriptions and pick/restart a plan!`,
        errorCode: "SUBSCRIPTION_INACTIVE",
        data: {
          subscriptionTier: user.subscription.tier,
          subscriptionStatus: user.subscription.status,
        },
      });
      return;
    }

    // Check if subscription has expired (additional check beyond status)
    if (user.subscription.endDate) {
      // Convert Firestore Timestamp to Date if necessary
      const endDate =
        user.subscription.endDate instanceof Date
          ? user.subscription.endDate
          : (user.subscription.endDate as any).toDate
            ? (user.subscription.endDate as any).toDate()
            : new Date(user.subscription.endDate as any);
      const now = new Date();

      if (endDate < now) {
        const tierName =
          user.subscription.tier.charAt(0).toUpperCase() +
          user.subscription.tier.slice(1);
        res.status(403).json({
          success: false,
          message: `Your ${tierName} plan subscription has ended! Go to My Subscriptions and pick/restart a plan!`,
          errorCode: "SUBSCRIPTION_EXPIRED",
          data: {
            subscriptionTier: user.subscription.tier,
            endDate: endDate.toISOString(),
          },
        });
        return;
      }
    }

    // Attach subscription to request for downstream use
    (req as any).subscription = user.subscription;
    next();
  } catch (error) {
    console.error("Error in requireActiveSubscription middleware:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/**
 * Middleware to check if user has at least Basic plan subscription (for task library access)
 */
export async function requireBasicPlan(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // User should already be attached by requireAuthenticatedTeacher middleware
    const authUser = (req as any).user;

    if (!authUser || !authUser.uid) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Fetch full user details from database to get subscription
    const user = await getUserById(authUser.uid);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Check if user has a subscription
    if (!user.subscription || user.subscription.status !== "active") {
      res.status(403).json({
        success: false,
        message:
          "Your subscription has ended! Go to My Subscriptions and pick/restart a plan!",
        errorCode: "NO_ACTIVE_SUBSCRIPTION",
        data: {
          basicPlanRequired: true,
        },
      });
      return;
    }

    // Check if subscription tier is at least Basic (trial plan users also have access)
    const allowedTiers = ["trial", "basic", "normal", "pro"];
    if (!allowedTiers.includes(user.subscription.tier)) {
      res.status(403).json({
        success: false,
        message:
          "Task library access requires at least a Basic plan subscription. Go to My Subscriptions and upgrade!",
        errorCode: "BASIC_PLAN_REQUIRED",
        data: {
          currentTier: user.subscription.tier,
          requiredTiers: allowedTiers,
        },
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Error in requireBasicPlan middleware:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/**
 * Middleware to check if teacher has task credits remaining
 */
export async function requireTaskCredits(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // User should already be attached by requireAuthenticatedTeacher middleware
    const authUser = (req as any).user;

    if (!authUser || !authUser.uid) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Fetch full user details from database to get taskCredits
    const user = await getUserById(authUser.uid);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Check task credits
    const credits = user.taskCredits || 0;

    if (credits <= 0) {
      res.status(403).json({
        success: false,
        message:
          'You run out of credits! Subscribe for any plan to get more credits at "My Subscription".',
        errorCode: "NO_CREDITS",
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
    console.error("Error in requireTaskCredits middleware:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
