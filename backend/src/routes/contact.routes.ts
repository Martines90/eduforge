import { Router } from "express";
import * as contactController from "../controllers/contact.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/contact/submit:
 *   post:
 *     summary: Submit contact support message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userEmail
 *               - userName
 *               - subject
 *               - message
 *             properties:
 *               userEmail:
 *                 type: string
 *                 format: email
 *               userName:
 *                 type: string
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 *     responses:
 *       200:
 *         description: Message submitted successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post("/submit", contactController.submitContact);

/**
 * @swagger
 * /api/contact/messages:
 *   get:
 *     summary: Get all contact messages (admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of contact messages
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/messages", authenticate, contactController.getAllMessages);

/**
 * @swagger
 * /api/contact/messages/{messageId}/status:
 *   patch:
 *     summary: Update message status (admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, in_progress, resolved]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch(
  "/messages/:messageId/status",
  authenticate,
  contactController.updateStatus
);

export default router;
