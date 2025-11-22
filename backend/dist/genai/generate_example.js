"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const text_generator_1 = require("./text-generator");
const image_generator_1 = require("./image-generator");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("../config");
async function main() {
    console.log("🚀 Simple AI Generator\n");
    console.log("=".repeat(50) + "\n");
    const textGen = new text_generator_1.TextGenerator();
    const imageGen = new image_generator_1.ImageGenerator();
    // Example 1: Generate text
    const textPrompt = `Create a short math problem about linear equations 
set in a historical context (1868 railroad construction). 
Make it engaging and include specific numbers.`;
    const textResult = await textGen.generate(textPrompt, {
        temperature: 0.8,
        maxTokens: 1500,
    });
    console.log("Generated Text:");
    console.log("-".repeat(50));
    console.log(textResult.text);
    console.log("-".repeat(50) + "\n");
    // Save text to file
    const textFilename = `text-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5)}.txt`;
    const textPath = path.join(config_1.config.outputDir, textFilename);
    if (!fs.existsSync(config_1.config.outputDir)) {
        fs.mkdirSync(config_1.config.outputDir, { recursive: true });
    }
    fs.writeFileSync(textPath, textResult.text);
    console.log(`💾 Text saved to ${textPath}\n`);
    // Example 2: Generate image
    const imagePrompt = `1868 transcontinental railroad construction scene, 
comic book style illustration, vintage steam locomotive, workers laying tracks, 
American frontier landscape, educational style`;
    const imageResult = await imageGen.generate(imagePrompt, {
        size: "1792x1024",
        quality: "standard",
        style: "vivid",
    });
    // Download image
    const imagePath = await imageGen.download(imageResult.url, imageResult.filename);
    // Calculate total cost
    const totalCost = textResult.cost + imageResult.cost;
    console.log("=".repeat(50));
    console.log("✅ Complete!");
    console.log("=".repeat(50));
    console.log(`💰 Total cost: $${totalCost.toFixed(4)}`);
    console.log(`📁 Output directory: ${config_1.config.outputDir}`);
    console.log("=".repeat(50));
}
// Run
main().catch(console.error);
