import dotenv from "dotenv";
import * as path from "path";

dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // AI API Keys
  apiKey: process.env.OPENAI_API_KEY || "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  fluxApiKey: process.env.FLUX_API_KEY || "",

  // AI Model configuration
  textModel: process.env.TEXT_MODEL || "gpt-4o",
  imageModel: process.env.IMAGE_MODEL || "dall-e-3",

  // Storage configuration
  storageDir: path.resolve(process.env.STORAGE_DIR || "./storage"),
  outputDir: path.resolve(process.env.OUTPUT_DIR || "./output"),

  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
