import { getFirestore } from "../config/firebase.config";
import {
  sendContactSupportConfirmation,
  sendContactSupportNotification,
} from "./email.service";
import {
  ContactSupportRequest,
  ContactMessageDocument,
} from "../types/contact.types";

/**
 * Submit contact support message
 * Sends confirmation email to user and notification to support team
 */
export async function submitContactSupport(
  data: ContactSupportRequest
): Promise<void> {
  const db = getFirestore();
  const { userEmail, userName, subject, message } = data;

  // Store message in Firestore for tracking
  const contactDoc: ContactMessageDocument = {
    userEmail: userEmail.toLowerCase(),
    userName,
    subject,
    message,
    createdAt: new Date() as any,
    status: "new",
  };

  const docRef = await db.collection("contactMessages").add(contactDoc);

  console.log(`📝 Contact message saved with ID: ${docRef.id}`);

  // Send confirmation email to user
  const userEmailResult = await sendContactSupportConfirmation({
    userEmail: userEmail.toLowerCase(),
    userName,
    subject,
    message,
  });

  if (!userEmailResult.success) {
    console.error(
      "Failed to send confirmation email to user:",
      userEmailResult.error
    );
    // Don't throw error - message is already saved
  } else {
    console.log(`✅ Confirmation email sent to user: ${userEmail}`);
    console.log(`📬 Message ID: ${userEmailResult.messageId}`);
  }

  // Send notification email to support team
  const supportEmailResult = await sendContactSupportNotification({
    userEmail: userEmail.toLowerCase(),
    userName,
    subject,
    message,
  });

  if (!supportEmailResult.success) {
    console.error(
      "Failed to send notification email to support:",
      supportEmailResult.error
    );
    // Don't throw error - message is already saved
  } else {
    console.log(`✅ Notification email sent to support team`);
    console.log(`📬 Message ID: ${supportEmailResult.messageId}`);
  }
}

/**
 * Get all contact messages (for admin/support dashboard)
 */
export async function getAllContactMessages(
  limit = 50
): Promise<ContactMessageDocument[]> {
  const db = getFirestore();

  const snapshot = await db
    .collection("contactMessages")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as ContactMessageDocument);
}

/**
 * Update contact message status
 */
export async function updateMessageStatus(
  messageId: string,
  status: "new" | "in_progress" | "resolved"
): Promise<void> {
  const db = getFirestore();

  await db.collection("contactMessages").doc(messageId).update({
    status,
  });

  console.log(`✅ Message ${messageId} status updated to: ${status}`);
}
