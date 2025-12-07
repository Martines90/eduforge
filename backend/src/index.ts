import { createApp } from "./app";
import { config } from "./config";
import { initializeFirebase } from "./config/firebase.config";
import { AIProviderFactory } from "./services/ai-providers";

// Initialize Firebase Admin SDK
initializeFirebase();

// Initialize AI Provider Factory
AIProviderFactory.initialize({
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  textModel: config.textModel,
  imageModel: config.imageModel,
});

const app = createApp();

const server = app.listen(config.port, () => {
  console.log("🚀 EduForge Backend Server");
  console.log(`📡 Server running on port ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`📁 Storage directory: ${config.storageDir}`);
  console.log(`\n✨ Ready to generate tasks!\n`);
  console.log(`Available endpoints:`);
  console.log(`  POST   /generate-task  - Generate a new task`);
  console.log(`  GET    /tasks/:taskId  - Get a task by ID`);
  console.log(`  GET    /health         - Health check`);
  console.log(`  GET    /storage/*      - Serve static files`);
  console.log(`  GET    /api-docs       - Swagger API documentation`);
  console.log(`  GET    /api-docs.json  - OpenAPI spec (JSON)\n`);
  console.log(
    `📚 API Documentation: http://localhost:${config.port}/api-docs\n`
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n👋 SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n👋 SIGINT received, shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
