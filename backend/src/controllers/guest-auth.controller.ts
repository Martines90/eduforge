import { Request, Response, NextFunction } from "express";
import {
  createGuestToken,
  getRemainingGenerations,
  getGuestSession,
  BrowserFingerprint,
} from "../services/guest-auth.service";
import { GuestAuthRequest } from "../middleware/guest-auth.middleware";

export class GuestAuthController {
  /**
   * POST /auth/guest-token
   * Creates a new guest session and returns a JWT token
   * Public endpoint - no authentication required
   *
   * Request body should contain browser fingerprint data:
   * { userAgent, acceptLanguage, acceptEncoding }
   */
  createGuestSession = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get IP address
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

      // Get browser fingerprint data from request
      const fingerprint: BrowserFingerprint = {
        userAgent: req.get("user-agent") || "unknown",
        acceptLanguage: req.get("accept-language"),
        acceptEncoding: req.get("accept-encoding"),
        ipAddress,
      };

      console.log(`📥 Request to create guest session from IP: ${ipAddress}`);

      // Create guest token with fingerprint tracking
      const result = await createGuestToken(ipAddress, fingerprint);

      if (!result.canGenerate) {
        // User has already exhausted their free generations
        res.status(403).json({
          success: false,
          error: "Generation limit reached",
          message: result.message,
          data: {
            canGenerate: false,
            maxGenerations: 3,
            limitReached: true,
          },
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: "Guest session created successfully",
        data: {
          token: result.token,
          sessionId: result.sessionId,
          maxGenerations: 3,
          generationsUsed: 0,
          generationsRemaining: 3,
          expiresIn: "24h",
          canGenerate: true,
        },
      });
    } catch (error) {
      console.error("Error creating guest session:", error);
      next(error);
    }
  };

  /**
   * GET /auth/guest-status
   * Returns the current status of a guest session
   * Requires guest token in Authorization header
   */
  getGuestStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authReq = req as GuestAuthRequest;

      if (!authReq.isGuest || !authReq.guest) {
        res.status(400).json({
          success: false,
          message: "Not a guest session",
        });
        return;
      }

      const sessionId = authReq.guest.sessionId;
      const session = getGuestSession(sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          message: "Guest session not found or expired",
        });
        return;
      }

      const remaining = getRemainingGenerations(sessionId);

      res.status(200).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          generationsUsed: session.generationsUsed,
          maxGenerations: session.maxGenerations,
          generationsRemaining: remaining,
          createdAt: session.createdAt,
          lastGenerationAt: session.lastGenerationAt,
        },
      });
    } catch (error) {
      console.error("Error getting guest status:", error);
      next(error);
    }
  };
}
