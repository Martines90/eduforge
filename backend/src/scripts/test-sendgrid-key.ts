import sgMail from "@sendgrid/mail";

// Load API key from environment variable
const API_KEY = process.env.SENDGRID_API_KEY;

async function testSendGridKey() {
  if (!API_KEY) {
    console.error("❌ SENDGRID_API_KEY environment variable is not set");
    console.log("Please set it in your .env file or environment");
    process.exit(1);
  }

  sgMail.setApiKey(API_KEY);

  try {
    console.log("Testing SendGrid API key...");

    const msg = {
      to: "marton.horvath@stocksaver.com",
      from: "noreply@eduforger.com",
      subject: "Test Email from SendGrid",
      text: "This is a test email to verify SendGrid API key works.",
      html: "<strong>This is a test email to verify SendGrid API key works.</strong>",
    };

    const response = await sgMail.send(msg);
    console.log("✅ Email sent successfully!");
    console.log("Response:", response[0].statusCode);
    console.log("Message ID:", response[0].headers["x-message-id"]);
  } catch (error: any) {
    console.error("❌ Failed to send email:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    if (error.response) {
      console.error("Response body:", error.response.body);
    }
  }

  process.exit(0);
}

testSendGridKey();
