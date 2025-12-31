/**
 * PDF Storage Service
 * Handles uploading and managing task PDFs in Firebase Storage
 */

import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";

export interface UploadPDFResult {
  success: boolean;
  pdfUrl?: string;
  error?: string;
}

/**
 * Helper function to create a URL-safe filename from task title
 * @param title - The task title
 * @returns URL-safe filename string
 */
function createSafeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/_+/g, "_") // Replace multiple underscores with single
    .replace(/^_|_$/g, "") // Remove leading/trailing underscores
    .substring(0, 50); // Limit length
}

/**
 * Upload a PDF buffer to Firebase Storage
 * @param taskId - The task ID
 * @param pdfBuffer - The PDF file as a Buffer
 * @param taskTitle - Optional task title to include in filename
 * @returns Upload result with PDF URL
 */
export async function uploadTaskPDF(
  taskId: string,
  pdfBuffer: Buffer,
  taskTitle?: string
): Promise<UploadPDFResult> {
  try {
    console.log("[PDF Storage] Uploading PDF for task:", taskId);

    const bucket = getStorage().bucket();

    // Create filename with task title if provided
    let fileName: string;
    if (taskTitle) {
      const safeTitle = createSafeFilename(taskTitle);
      fileName = `task-pdfs/task_${safeTitle}_${taskId}.pdf`;
      console.log("[PDF Storage] Filename with title:", fileName);
    } else {
      fileName = `task-pdfs/${taskId}.pdf`;
      console.log("[PDF Storage] Filename without title:", fileName);
    }

    const file = bucket.file(fileName);

    // Upload the PDF
    await file.save(pdfBuffer, {
      metadata: {
        contentType: "application/pdf",
        metadata: {
          taskId,
          uploadedAt: new Date().toISOString(),
        },
      },
      public: true, // Make it publicly accessible
    });

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    console.log("[PDF Storage] PDF uploaded successfully:", publicUrl);

    // Update the task document with PDF URL and timestamp
    const db = getFirestore();
    // Use direct collection reference instead of collectionGroup to avoid index issues
    const taskDoc = db.collection("tasks").doc(taskId);
    const docSnapshot = await taskDoc.get();

    if (docSnapshot.exists) {
      await taskDoc.update({
        pdfUrl: publicUrl,
        pdfGeneratedAt: new Date().toISOString(),
      });
      console.log("[PDF Storage] Task document updated with PDF URL");
    } else {
      console.warn("[PDF Storage] Task document not found:", taskId);
    }

    return {
      success: true,
      pdfUrl: publicUrl,
    };
  } catch (error) {
    console.error("[PDF Storage] Error uploading PDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload PDF",
    };
  }
}

/**
 * Delete a task PDF from Firebase Storage
 * @param taskId - The task ID
 */
export async function deleteTaskPDF(taskId: string): Promise<void> {
  try {
    console.log("[PDF Storage] Deleting PDF for task:", taskId);

    const bucket = getStorage().bucket();
    const fileName = `task-pdfs/${taskId}.pdf`;
    const file = bucket.file(fileName);

    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      console.log("[PDF Storage] PDF deleted successfully");
    }

    // Remove PDF URL from task document
    const db = getFirestore();
    const taskDoc = db.collection("tasks").doc(taskId);
    const docSnapshot = await taskDoc.get();

    if (docSnapshot.exists) {
      await taskDoc.update({
        pdfUrl: null,
        pdfGeneratedAt: null,
      });
      console.log("[PDF Storage] Task document updated - PDF URL removed");
    }
  } catch (error) {
    console.error("[PDF Storage] Error deleting PDF:", error);
    throw error;
  }
}

/**
 * Check if a PDF exists for a task
 * @param taskId - The task ID
 * @returns true if PDF exists
 */
export async function taskPDFExists(taskId: string): Promise<boolean> {
  try {
    const bucket = getStorage().bucket();
    const fileName = `task-pdfs/${taskId}.pdf`;
    const file = bucket.file(fileName);

    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error("[PDF Storage] Error checking PDF existence:", error);
    return false;
  }
}
