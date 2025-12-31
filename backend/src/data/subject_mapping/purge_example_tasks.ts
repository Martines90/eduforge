import * as fs from "fs";
import * as path from "path";

/**
 * Recursively processes an object to rename "example_tasks" to "example_tasks (COMPLETED)"
 * and empties those arrays
 */
function processObject(obj: any): any {
  if (Array.isArray(obj)) {
    // Process each element in the array
    return obj.map((item) => processObject(item));
  } else if (obj !== null && typeof obj === "object") {
    const newObj: any = {};

    for (const key in obj) {
      if (key === "example_tasks") {
        // Rename the key and set to empty array
        newObj["example_tasks (COMPLETED)"] = [];
      } else {
        // Recursively process the value
        newObj[key] = processObject(obj[key]);
      }
    }

    return newObj;
  } else {
    // Primitive value, return as-is
    return obj;
  }
}

/**
 * Main function to process the JSON file
 */
function main() {
  const inputFilePath = path.join(__dirname, "hu_math_grade_9_12.json");
  const outputFilePath = path.join(__dirname, "hu_math_grade_9_12_purged.json");

  console.log(`Reading file: ${inputFilePath}`);

  // Read the input JSON file
  const fileContent = fs.readFileSync(inputFilePath, "utf-8");
  const jsonData = JSON.parse(fileContent);

  console.log("Processing JSON structure...");

  // Process the JSON structure
  const processedData = processObject(jsonData);

  console.log("Writing output file...");

  // Write the processed JSON to the output file with pretty formatting
  fs.writeFileSync(
    outputFilePath,
    JSON.stringify(processedData, null, 2),
    "utf-8"
  );

  console.log(`✓ Successfully created: ${outputFilePath}`);
  console.log("\nSummary:");
  console.log(
    '- All "example_tasks" keys renamed to "example_tasks (COMPLETED)"'
  );
  console.log("- All example_tasks arrays emptied");
}

// Run the script
main();
