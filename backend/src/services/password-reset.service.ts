import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { getFirestore } from "../config/firebase.config";
import { sendPasswordResetEmail } from "./email.service";
import {
  PasswordResetRequest,
  PasswordResetVerify,
  PasswordResetDocument,
} from "../types/password-reset.types";
import { config } from "../config";

const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_MINUTES = 30;

/**
 * Generate a secure random token for password reset
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Request password reset - send email with reset link
 */
export async function requestPasswordReset(
  data: PasswordResetRequest
): Promise<void> {
  const db = getFirestore();
  const email = data.email.toLowerCase();

  // Check if user exists
  const userSnapshot = await db
    .collection("users")
    .where("email", "==", email)
    .get();

  if (userSnapshot.empty) {
    // Don't reveal if email exists or not (security best practice)
    console.log(`Password reset requested for non-existent email: ${email}`);
    return;
  }

  const user = userSnapshot.docs[0].data();

  // Generate reset token
  const token = generateResetToken();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + RESET_TOKEN_EXPIRY_MINUTES);

  // Store reset token in Firestore
  const resetDoc: PasswordResetDocument = {
    email,
    token,
    createdAt: new Date() as any,
    expiresAt: expiresAt as any,
    used: false,
  };

  await db.collection("passwordResets").doc(token).set(resetDoc);

  // Generate reset URL using centralized config
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

  // Send password reset email via SendGrid
  const emailResult = await sendPasswordResetEmail({
    recipientEmail: email,
    recipientName: user.name,
    resetToken: token,
    resetUrl,
  });

  if (!emailResult.success) {
    console.error("Failed to send password reset email:", emailResult.error);
    throw new Error("Failed to send password reset email. Please try again.");
  }

  console.log(`✅ Password reset email sent to: ${email}`);
  console.log(`📬 Message ID: ${emailResult.messageId}`);
}

/**
 * Verify reset token and update password
 */
export async function resetPassword(data: PasswordResetVerify): Promise<void> {
  const db = getFirestore();
  const { token, newPassword } = data;

  // Get reset token document
  const resetDoc = await db.collection("passwordResets").doc(token).get();

  if (!resetDoc.exists) {
    throw new Error("Invalid or expired reset token");
  }

  const resetData = resetDoc.data() as PasswordResetDocument;

  // Check if token is expired
  const now = new Date();
  const expiresAt = resetData.expiresAt.toDate();

  if (now > expiresAt) {
    await db.collection("passwordResets").doc(token).delete();
    throw new Error("Reset token has expired");
  }

  // Check if token has already been used
  if (resetData.used) {
    throw new Error("Reset token has already been used");
  }

  // Get user by email
  const userSnapshot = await db
    .collection("users")
    .where("email", "==", resetData.email)
    .get();

  if (userSnapshot.empty) {
    throw new Error("User not found");
  }

  const userDoc = userSnapshot.docs[0];
  const userId = userDoc.id;

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password in userCredentials collection
  await db.collection("userCredentials").doc(userId).update({
    hashedPassword,
    updatedAt: new Date(),
  });

  // Mark token as used
  await db.collection("passwordResets").doc(token).update({
    used: true,
  });

  console.log(`✅ Password reset successful for user: ${userId}`);
}

/**
 * Validate reset token (check if it's valid and not expired)
 */
export async function validateResetToken(token: string): Promise<boolean> {
  const db = getFirestore();

  const resetDoc = await db.collection("passwordResets").doc(token).get();

  if (!resetDoc.exists) {
    return false;
  }

  const resetData = resetDoc.data() as PasswordResetDocument;

  // Check if expired
  const now = new Date();
  const expiresAt = resetData.expiresAt.toDate();

  if (now > expiresAt || resetData.used) {
    return false;
  }

  return true;
}
