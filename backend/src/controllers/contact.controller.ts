import { Request, Response } from "express";
import * as contactService from "../services/contact.service";

/**
 * Submit contact support message
 */
export async function submitContact(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { userEmail, userName, subject, message } = req.body;

    // Validation
    if (!userEmail || !userName || !subject || !message) {
      res.status(400).json({
        success: false,
        error:
          "All fields are required (userEmail, userName, subject, message)",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      res.status(400).json({
        success: false,
        error: "Invalid email address",
      });
      return;
    }

    // Message length validation
    if (message.length < 10) {
      res.status(400).json({
        success: false,
        error: "Message must be at least 10 characters long",
      });
      return;
    }

    if (message.length > 5000) {
      res.status(400).json({
        success: false,
        error: "Message must be less than 5000 characters",
      });
      return;
    }

    await contactService.submitContactSupport({
      userEmail,
      userName,
      subject,
      message,
    });

    res.status(200).json({
      success: true,
      message:
        "Your message has been sent. We'll get back to you within 24-48 hours.",
    });
  } catch (error: any) {
    console.error("Error in submitContact:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to submit contact message",
    });
  }
}

/**
 * Get all contact messages (admin only)
 */
export async function getAllMessages(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const messages = await contactService.getAllContactMessages(limit);

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error: any) {
    console.error("Error in getAllMessages:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch contact messages",
    });
  }
}

/**
 * Update message status (admin only)
 */
export async function updateStatus(req: Request, res: Response): Promise<void> {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    if (!messageId || !status) {
      res.status(400).json({
        success: false,
        error: "Message ID and status are required",
      });
      return;
    }

    if (!["new", "in_progress", "resolved"].includes(status)) {
      res.status(400).json({
        success: false,
        error: "Invalid status. Must be: new, in_progress, or resolved",
      });
      return;
    }

    await contactService.updateMessageStatus(messageId, status);

    res.status(200).json({
      success: true,
      message: "Message status updated successfully",
    });
  } catch (error: any) {
    console.error("Error in updateStatus:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update message status",
    });
  }
}
