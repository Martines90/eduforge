import * as path from "path";

// Set up module resolution for @eduforger/shared
// This file MUST be imported before any other application code
// In Cloud Run, __dirname is /workspace/dist/backend/src
// We need to add /workspace/dist/backend/_modules to NODE_PATH
const modulesPath = path.resolve(__dirname, "../_modules");
if (!process.env.NODE_PATH) {
  process.env.NODE_PATH = modulesPath;
} else {
  process.env.NODE_PATH = `${process.env.NODE_PATH}:${modulesPath}`;
}
require("module").Module._initPaths();

console.log("✅ Module paths configured:", process.env.NODE_PATH);
