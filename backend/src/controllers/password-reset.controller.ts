import { Request, Response } from "express";
import * as passwordResetService from "../services/password-reset.service";

/**
 * Request password reset - send email with reset link
 */
export async function requestReset(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: "Email is required",
      });
      return;
    }

    await passwordResetService.requestPasswordReset({ email });

    // Always return success (don't reveal if email exists)
    res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error: any) {
    console.error("Error in requestReset:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process password reset request",
    });
  }
}

/**
 * Verify reset token
 */
export async function verifyToken(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({
        success: false,
        error: "Token is required",
      });
      return;
    }

    const isValid = await passwordResetService.validateResetToken(token);

    res.status(200).json({
      success: true,
      data: { valid: isValid },
    });
  } catch (error: any) {
    console.error("Error in verifyToken:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to verify token",
    });
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        error: "Token and new password are required",
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long",
      });
      return;
    }

    await passwordResetService.resetPassword({ token, newPassword });

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error: any) {
    console.error("Error in resetPassword:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to reset password",
    });
  }
}
