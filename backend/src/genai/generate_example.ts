import { TextGenerator } from "./text-generator";
import { ImageGenerator } from "./image-generator";
import * as fs from "fs";
import * as path from "path";
import { config } from "../config";

async function main() {
  console.log("🚀 Simple AI Generator\n");
  console.log("=".repeat(50) + "\n");

  const textGen = new TextGenerator();
  const imageGen = new ImageGenerator();

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
  const textPath = path.join(config.outputDir, textFilename);

  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
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
  await imageGen.download(imageResult.url, imageResult.filename);

  // Calculate total cost
  const totalCost = textResult.cost + imageResult.cost;

  console.log("=".repeat(50));
  console.log("✅ Complete!");
  console.log("=".repeat(50));
  console.log(`💰 Total cost: $${totalCost.toFixed(4)}`);
  console.log(`📁 Output directory: ${config.outputDir}`);
  console.log("=".repeat(50));
}

// Run
main().catch(console.error);
