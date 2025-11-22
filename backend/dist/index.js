"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
const app = (0, app_1.createApp)();
const server = app.listen(config_1.config.port, () => {
    console.log("🚀 EduForge Backend Server");
    console.log(`📡 Server running on port ${config_1.config.port}`);
    console.log(`🌍 Environment: ${config_1.config.nodeEnv}`);
    console.log(`📁 Storage directory: ${config_1.config.storageDir}`);
    console.log(`\n✨ Ready to generate tasks!\n`);
    console.log(`Available endpoints:`);
    console.log(`  POST   /generate-task  - Generate a new task`);
    console.log(`  GET    /tasks/:taskId  - Get a task by ID`);
    console.log(`  GET    /health         - Health check`);
    console.log(`  GET    /storage/*      - Serve static files`);
    console.log(`  GET    /api-docs       - Swagger API documentation`);
    console.log(`  GET    /api-docs.json  - OpenAPI spec (JSON)\n`);
    console.log(`📚 API Documentation: http://localhost:${config_1.config.port}/api-docs\n`);
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
