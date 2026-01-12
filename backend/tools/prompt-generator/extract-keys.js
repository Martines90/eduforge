#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Extract Keys Script
 *
 * Extracts only the "key" fields from a curriculum mapping JSON file
 * and creates a hierarchical tree structure.
 *
 * Usage:
 *   node extract-keys.js <input-file> <output-file>
 *
 * Example:
 *   node extract-keys.js ../../src/data/mappings/us/grade_9_12/mathematics.json ../../src/data/mappings/us/grade_9_12/ex_mathematics.json
 */

/**
 * Recursively extract keys from the curriculum structure
 * @param {Array|Object} data - The curriculum data
 * @returns {Object} - Hierarchical object with keys only
 */
function extractKeys(data) {
  if (Array.isArray(data)) {
    // If it's an array of topics, process each topic
    const result = {};
    data.forEach(topic => {
      if (topic.key) {
        if (topic.sub_topics && topic.sub_topics.length > 0) {
          result[topic.key] = extractKeys(topic.sub_topics);
        } else {
          // Leaf node - just set to empty object or true
          result[topic.key] = {};
        }
      }
    });
    return result;
  } else if (typeof data === 'object' && data !== null) {
    // If it's a single object with sub_topics
    const result = {};
    if (data.key) {
      if (data.sub_topics && data.sub_topics.length > 0) {
        result[data.key] = extractKeys(data.sub_topics);
      } else {
        result[data.key] = {};
      }
    }
    return result;
  }
  return {};
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node extract-keys.js <input-file> <output-file>');
    console.error('\nExample:');
    console.error('  node extract-keys.js ../../src/data/mappings/us/grade_9_12/mathematics.json ../../src/data/mappings/us/grade_9_12/ex_mathematics.json');
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const outputPath = path.resolve(args[1]);

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  try {
    // Read the input JSON file
    console.log(`Reading input file: ${inputPath}`);
    const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

    // Extract the keys
    console.log('Extracting keys...');
    const extractedKeys = extractKeys(inputData);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the output JSON file
    console.log(`Writing output file: ${outputPath}`);
    fs.writeFileSync(
      outputPath,
      JSON.stringify(extractedKeys, null, 2),
      'utf8'
    );

    // Count keys at each level
    const countKeys = (obj, level = 1) => {
      let count = 0;
      for (const key in obj) {
        count++;
        if (typeof obj[key] === 'object' && Object.keys(obj[key]).length > 0) {
          count += countKeys(obj[key], level + 1);
        }
      }
      return count;
    };

    const totalKeys = countKeys(extractedKeys);

    console.log('\n✅ Extraction complete!');
    console.log(`📊 Summary:`);
    console.log(`   Input file: ${inputPath}`);
    console.log(`   Output file: ${outputPath}`);
    console.log(`   Total keys extracted: ${totalKeys}`);
    console.log(`   Top-level keys: ${Object.keys(extractedKeys).length}`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { extractKeys };
