// IMPORTANT: This import MUST be first to set up module resolution
import "./module-setup";

import { onRequest } from "firebase-functions/v2/https";
import { createApp } from "./app";
import { initializeFirebase } from "./config/firebase.config";
import { AIProviderFactory } from "./services/ai-providers";
import { config } from "./config";

// Initialize Firebase Admin SDK at module level
try {
  console.log("🚀 Starting Firebase initialization...");
  initializeFirebase();
  console.log("✅ Firebase initialized");
} catch (error) {
  console.error("❌ Failed to initialize Firebase:", error);
  throw error;
}

// Initialize AI Provider Factory at module level
try {
  console.log("🚀 Starting AI Provider initialization...");
  AIProviderFactory.initialize({
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    fluxApiKey: process.env.FLUX_API_KEY,
    textModel: config.textModel,
    imageModel: config.imageModel,
  });
  console.log("✅ AI Provider initialized");
} catch (error) {
  console.error("❌ Failed to initialize AI Provider:", error);
  throw error;
}

// Create the Express app at module level
let app;
try {
  console.log("🚀 Starting Express app creation...");
  app = createApp();
  console.log("✅ Express app created");
} catch (error) {
  console.error("❌ Failed to create Express app:", error);
  throw error;
}

// Export the Express app as a Cloud Function
export const api = onRequest(
  {
    timeoutSeconds: 540, // 9 minutes (max for gen2 functions)
    memory: "1GiB",
    cpu: 2, // Allocate 2 CPUs for faster cold starts
    minInstances: 0,
    maxInstances: 100,
    concurrency: 80,
    region: "us-central1",
  },
  app
);
