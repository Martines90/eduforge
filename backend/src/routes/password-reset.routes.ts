import { Router } from "express";
import * as passwordResetController from "../controllers/password-reset.controller";

const router = Router();

/**
 * @swagger
 * /api/password-reset/request:
 *   post:
 *     summary: Request password reset
 *     tags: [Password Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent (if account exists)
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post("/request", passwordResetController.requestReset);

/**
 * @swagger
 * /api/password-reset/verify/{token}:
 *   get:
 *     summary: Verify reset token validity
 *     tags: [Password Reset]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token validation result
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.get("/verify/:token", passwordResetController.verifyToken);

/**
 * @swagger
 * /api/password-reset/reset:
 *   post:
 *     summary: Reset password with token
 *     tags: [Password Reset]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token or password
 *       500:
 *         description: Server error
 */
router.post("/reset", passwordResetController.resetPassword);

export default router;
