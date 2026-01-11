/**
 * Password reset types
 */

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetVerify {
  token: string;
  newPassword: string;
}

export interface PasswordResetDocument {
  email: string;
  token: string;
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
  used: boolean;
}
