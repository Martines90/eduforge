import dotenv from "dotenv";
import * as path from "path";

dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // OpenAI API configuration
  apiKey: process.env.OPENAI_API_KEY || "",
  textModel: process.env.TEXT_MODEL || "gpt-4o",
  imageModel: process.env.IMAGE_MODEL || "dall-e-3",

  // Storage configuration
  storageDir: path.resolve(process.env.STORAGE_DIR || "./storage"),
  outputDir: path.resolve(process.env.OUTPUT_DIR || "./output"),

  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
