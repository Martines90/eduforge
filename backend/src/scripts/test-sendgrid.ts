/**
 * Test script for SendGrid email service
 * Run with: npx ts-node src/scripts/test-sendgrid.ts
 */

import { sendVerificationEmail } from "../services/email.service";

async function testSendGrid() {
  console.log("🧪 Testing SendGrid email service...\n");

  try {
    // Test sending a verification email
    const result = await sendVerificationEmail({
      recipientEmail: "hmartonsandor@gmail.com", // Your email
      recipientName: "Test User",
      verificationCode: "123456",
    });

    if (result.success) {
      console.log("✅ Email sent successfully!");
      console.log("📬 Message ID:", result.messageId);
      console.log("\n✉️  Check your inbox at hmartonsandor@gmail.com");
    } else {
      console.error("❌ Failed to send email");
      console.error("Error:", result.error);
    }
  } catch (error: any) {
    console.error("❌ Exception occurred:", error.message);
    if (error.response) {
      console.error("SendGrid Response:", error.response.body);
    }
  }
}

testSendGrid();
