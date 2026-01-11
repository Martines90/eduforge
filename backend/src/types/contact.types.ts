/**
 * Contact support types
 */

export interface ContactSupportRequest {
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
}

export interface ContactMessageDocument {
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
  createdAt: FirebaseFirestore.Timestamp;
  status: "new" | "in_progress" | "resolved";
}
