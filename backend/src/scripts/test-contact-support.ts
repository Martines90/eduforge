/**
 * Test script for contact support email
 * Run with: npx ts-node src/scripts/test-contact-support.ts
 */

import { initializeFirebase } from "../config/firebase.config";
import { submitContactSupport } from "../services/contact.service";

async function testContactSupport() {
  console.log("🧪 Testing contact support emails...\n");

  try {
    // Initialize Firebase
    initializeFirebase();
    console.log("✅ Firebase initialized\n");

    // Test contact support submission
    await submitContactSupport({
      userEmail: "marton.horvath@stocksaver.com",
      userName: "Test User",
      subject: "Testing SendGrid Integration",
      message:
        "This is a test message to verify the contact support functionality is working correctly with SendGrid.",
    });

    console.log("\n✅ Contact support emails sent!");
    console.log(
      "✉️  Check your inbox at marton.horvath@stocksaver.com (user confirmation)"
    );
    console.log(
      "✉️  Check support inbox at marton.horvath@stocksaver.com (support notification)"
    );
    console.log("📧 You should receive 2 emails total");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error("SendGrid Response:", error.response.body);
    }
  }
}

testContactSupport();
