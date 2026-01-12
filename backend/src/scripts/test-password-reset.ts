/**
 * Test script for password reset email
 * Run with: npx ts-node src/scripts/test-password-reset.ts
 */

import { initializeFirebase } from "../config/firebase.config";
import { requestPasswordReset } from "../services/password-reset.service";

async function testPasswordReset() {
  console.log("🧪 Testing password reset email...\n");

  try {
    // Initialize Firebase
    initializeFirebase();
    console.log("✅ Firebase initialized\n");

    // Test password reset request
    await requestPasswordReset({
      email: "hmartonsandor@gmail.com",
    });

    console.log("\n✅ Password reset email sent!");
    console.log("✉️  Check your inbox at hmartonsandor@gmail.com");
    console.log("📧 You should receive an email with a password reset link");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error("SendGrid Response:", error.response.body);
    }
  }
}

testPasswordReset();
