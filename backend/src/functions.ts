import { onRequest } from "firebase-functions/v2/https";
import { createApp } from "./app";
import { initializeFirebase } from "./config/firebase.config";
import { AIProviderFactory } from "./services/ai-providers";
import { config } from "./config";

// Initialize Firebase Admin SDK
initializeFirebase();

// Initialize AI Provider Factory
AIProviderFactory.initialize({
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  fluxApiKey: process.env.FLUX_API_KEY,
  textModel: config.textModel,
  imageModel: config.imageModel,
});

// Create the Express app
const app = createApp();

// Export the Express app as a Cloud Function
export const api = onRequest(
  {
    timeoutSeconds: 540, // 9 minutes (max for gen2 functions)
    memory: "1GiB",
    region: "us-central1",
  },
  app
);
