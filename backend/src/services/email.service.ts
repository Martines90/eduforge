import sgMail from "@sendgrid/mail";
import { config } from "../config";
import {
  EmailOptions,
  EmailRecipient,
  EmailSendResult,
  VerificationEmailData,
  PasswordResetEmailData,
  ContactSupportEmailData,
  WelcomeEmailData,
} from "../types/email.types";

/**
 * Email Service - Centralized email sending using SendGrid
 */

// Initialize SendGrid with API key
const initializeSendGrid = () => {
  const apiKey = config.email.sendgridApiKey;

  if (!apiKey) {
    console.warn(
      "⚠️  SENDGRID_API_KEY not set. Emails will not be sent in development mode."
    );
    return false;
  }

  sgMail.setApiKey(apiKey);
  return true;
};

const isInitialized = initializeSendGrid();

/**
 * Send a generic email using SendGrid
 */
export async function sendEmail(
  options: EmailOptions
): Promise<EmailSendResult> {
  try {
    // Skip sending in development if API key is not set
    if (!isInitialized) {
      console.log("📧 [DEV MODE] Email would be sent:", {
        to: options.to,
        subject: options.subject,
      });
      return {
        success: true,
        messageId: "dev-mode-" + Date.now(),
      };
    }

    // Prepare sender
    const from = options.from || {
      email: config.email.fromEmail,
      name: config.email.fromName,
    };

    // Prepare recipients
    const to = Array.isArray(options.to) ? options.to : [options.to];

    // Send email
    const response = await sgMail.send({
      to: to.map((recipient) => ({
        email: recipient.email,
        name: recipient.name,
      })),
      from: {
        email: from.email,
        name: from.name,
      },
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: options.cc
        ? Array.isArray(options.cc)
          ? options.cc
          : [options.cc]
        : undefined,
      bcc: options.bcc
        ? Array.isArray(options.bcc)
          ? options.bcc
          : [options.bcc]
        : undefined,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });

    console.log(`✅ Email sent successfully to ${to[0].email}`);
    console.log(`📬 Message ID: ${response[0].headers["x-message-id"]}`);

    return {
      success: true,
      messageId: response[0].headers["x-message-id"] as string,
    };
  } catch (error: any) {
    console.error("❌ Failed to send email:", error);

    // SendGrid specific error handling
    if (error.response) {
      console.error("SendGrid Error Response:", error.response.body);
    }

    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}

/**
 * Send verification code email for registration
 */
export async function sendVerificationEmail(
  data: VerificationEmailData
): Promise<EmailSendResult> {
  const { recipientEmail, recipientName, verificationCode } = data;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1976d2;">Welcome to EduForger!</h2>
      <p>Hello ${recipientName},</p>
      <p>Thank you for registering with EduForger. To complete your registration, please use the following verification code:</p>
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
        <h1 style="color: #1976d2; margin: 0; font-size: 32px; letter-spacing: 5px;">${verificationCode}</h1>
      </div>
      <p>This code will expire in 15 minutes.</p>
      <p>If you didn't request this verification code, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated message from EduForger. Please do not reply to this email.</p>
    </div>
  `;

  const text = `Welcome to EduForger!\n\nYour verification code is: ${verificationCode}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this code, please ignore this email.`;

  return sendEmail({
    to: { email: recipientEmail, name: recipientName },
    subject: "EduForger - Email Verification Code",
    html,
    text,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  data: PasswordResetEmailData
): Promise<EmailSendResult> {
  const { recipientEmail, recipientName, resetUrl } = data;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1976d2;">Password Reset Request</h2>
      <p>Hello ${recipientName},</p>
      <p>We received a request to reset your password for your EduForger account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
      <p style="color: #d32f2f; margin-top: 20px;">⚠️ This link will expire in 30 minutes.</p>
      <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated message from EduForger. Please do not reply to this email.</p>
    </div>
  `;

  const text = `Password Reset Request\n\nHello ${recipientName},\n\nWe received a request to reset your password.\n\nReset your password here: ${resetUrl}\n\nThis link will expire in 30 minutes.\n\nIf you didn't request this, please ignore this email.`;

  return sendEmail({
    to: { email: recipientEmail, name: recipientName },
    subject: "EduForger - Password Reset Request",
    html,
    text,
  });
}

/**
 * Send contact support confirmation to user
 */
export async function sendContactSupportConfirmation(
  data: ContactSupportEmailData
): Promise<EmailSendResult> {
  const { userEmail, userName, subject, message } = data;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1976d2;">We received your message!</h2>
      <p>Hello ${userName},</p>
      <p>Thank you for contacting EduForger support. We have received your message and will get back to you as soon as possible.</p>
      <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #333;">Your Message:</h3>
        <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
        <p style="margin: 5px 0;"><strong>Message:</strong></p>
        <p style="color: #666; white-space: pre-wrap;">${message}</p>
      </div>
      <p>Our support team typically responds within 24-48 hours during business days.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated confirmation from EduForger. Please do not reply to this email.</p>
    </div>
  `;

  const text = `We received your message!\n\nHello ${userName},\n\nThank you for contacting EduForger support.\n\nYour message:\nSubject: ${subject}\nMessage: ${message}\n\nWe will get back to you within 24-48 hours.`;

  return sendEmail({
    to: { email: userEmail, name: userName },
    subject: "EduForger - Support Request Received",
    html,
    text,
  });
}

/**
 * Send contact support notification to support team
 */
export async function sendContactSupportNotification(
  data: ContactSupportEmailData
): Promise<EmailSendResult> {
  const { userEmail, userName, subject, message } = data;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #d32f2f;">New Support Request</h2>
      <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 5px 0;"><strong>From:</strong> ${userName} (${userEmail})</p>
        <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
        <p style="margin: 5px 0;"><strong>Message:</strong></p>
        <p style="color: #666; white-space: pre-wrap;">${message}</p>
      </div>
      <p>Please respond to: <a href="mailto:${userEmail}">${userEmail}</a></p>
    </div>
  `;

  const text = `New Support Request\n\nFrom: ${userName} (${userEmail})\nSubject: ${subject}\n\nMessage:\n${message}\n\nReply to: ${userEmail}`;

  return sendEmail({
    to: { email: config.email.supportEmail, name: "EduForger Support" },
    subject: `Support Request: ${subject}`,
    html,
    text,
    replyTo: { email: userEmail, name: userName },
  });
}

/**
 * Send welcome email after successful registration
 */
export async function sendWelcomeEmail(
  data: WelcomeEmailData
): Promise<EmailSendResult> {
  const { recipientEmail, recipientName, role } = data;

  const roleSpecificContent =
    role === "teacher"
      ? `
    <p>As a teacher, you have access to:</p>
    <ul>
      <li>✅ AI-powered task generation</li>
      <li>✅ Custom curriculum mapping</li>
      <li>✅ Student progress tracking</li>
      <li>✅ Test library and management</li>
    </ul>
    <p>You've started with a 3-month trial with task generation credits. Start creating engaging educational content today!</p>
  `
      : `
    <p>Explore our platform and discover educational resources tailored to your needs.</p>
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1976d2;">Welcome to EduForger! 🎉</h2>
      <p>Hello ${recipientName},</p>
      <p>Your email has been verified successfully. Welcome to the EduForger community!</p>
      ${roleSpecificContent}
      <div style="text-align: center; margin: 30px 0;">
        <a href="${config.corsOrigin}/dashboard" style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Get Started</a>
      </div>
      <p>If you have any questions, feel free to reach out to our support team at ${config.email.supportEmail}</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">This is an automated message from EduForger.</p>
    </div>
  `;

  const text = `Welcome to EduForger!\n\nHello ${recipientName},\n\nYour email has been verified successfully.\n\n${role === "teacher" ? "As a teacher, you have access to AI-powered task generation, curriculum mapping, and more!" : "Explore our educational platform!"}\n\nGet started at: ${config.corsOrigin}/dashboard\n\nQuestions? Contact us at ${config.email.supportEmail}`;

  return sendEmail({
    to: { email: recipientEmail, name: recipientName },
    subject: "Welcome to EduForger!",
    html,
    text,
  });
}
