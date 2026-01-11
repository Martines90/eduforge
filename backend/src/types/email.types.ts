/**
 * Email types and interfaces for SendGrid integration
 */

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  content: string; // Base64 encoded file content
  filename: string;
  type?: string; // MIME type
  disposition?: "attachment" | "inline";
  contentId?: string;
}

export interface EmailOptions {
  to: EmailRecipient | EmailRecipient[];
  from?: EmailRecipient;
  subject: string;
  html: string;
  text?: string;
  cc?: EmailRecipient | EmailRecipient[];
  bcc?: EmailRecipient | EmailRecipient[];
  replyTo?: EmailRecipient;
  attachments?: EmailAttachment[];
}

export interface VerificationEmailData {
  recipientEmail: string;
  recipientName: string;
  verificationCode: string;
}

export interface PasswordResetEmailData {
  recipientEmail: string;
  recipientName: string;
  resetToken: string;
  resetUrl: string;
}

export interface ContactSupportEmailData {
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
}

export interface WelcomeEmailData {
  recipientEmail: string;
  recipientName: string;
  role: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
