/**
 * Migration Script: Import Subject Mappings to Firestore (Country-Based)
 *
 * This script reads curriculum JSON files and imports them into Firestore
 * using a country-based hierarchical structure.
 *
 * Structure: countries/{country}/subjectMappings/{docId}
 *
 * Usage:
 *   npm run migrate:subjects -- --country HU --subject mathematics
 *   npm run migrate:subjects -- --country US --subject mathematics --clear
 *   npm run migrate:subjects -- --all  # Migrate all countries and subjects
 *
 * Or directly:
 *   ts-node src/scripts/migrate-subject-mappings.ts --country HU --subject mathematics
 */

import * as fs from "fs";
import * as path from "path";
import { initializeFirebase, getFirestore } from "../config/firebase.config";
import { SubjectMappingDocument } from "../types/task.types";
import { Timestamp } from "firebase-admin/firestore";

interface JSONNode {
  key: string;
  name: string;
  short_description?: string;
  sub_topics?: JSONNode[];
  "example_tasks (COMPLETED)"?: any[];
}

interface JSONData {
  grade_9_10?: JSONNode[];
  grade_11_12?: JSONNode[];
}

interface SubjectConfig {
  name: string;
  file: string;
}

interface CountryConfig {
  name: string;
  subjects: Record<string, SubjectConfig>;
}

interface MappingConfig {
  countries: Record<string, CountryConfig>;
}

/**
 * Load configuration from JSON file
 */
function loadConfig(): MappingConfig {
  const configPath = path.join(
    __dirname,
    "../config/subject-mappings.config.json"
  );

  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const configContent = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(configContent) as MappingConfig;
}

/**
 * Generate document ID from path components
 * Note: subject is now implicit in the collection structure, so we don't include it in the docId
 */
function generateDocId(...pathParts: string[]): string {
  const parts = pathParts.filter(Boolean);
  return parts.join("_").replace(/[^a-zA-Z0-9_]/g, "_");
}

/**
 * Recursively collect nodes to be inserted (batch-optimized)
 */
function collectNodes(
  db: FirebaseFirestore.Firestore,
  node: JSONNode,
  country: string,
  subject: string,
  gradeLevel: string,
  parentId: string | null,
  parentPath: string,
  level: number,
  orderIndex: number,
  documents: Map<
    string,
    { ref: FirebaseFirestore.DocumentReference; data: SubjectMappingDocument }
  >
): string {
  const currentPath = parentPath ? `${parentPath}/${node.key}` : node.key;
  const docId = generateDocId(gradeLevel, ...currentPath.split("/"));

  // Check if node has children
  const hasSubTopics = node.sub_topics && node.sub_topics.length > 0;
  const isLeaf = !hasSubTopics;

  const mappingDoc: SubjectMappingDocument = {
    key: node.key,
    name: node.name,
    shortDescription: node.short_description,
    level,
    parentId,
    path: currentPath,
    subject,
    gradeLevel,
    orderIndex,
    isLeaf,
    taskCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  console.log(
    `  ${"  ".repeat(level)}[${level}] ${node.name} (${currentPath})`
  );

  // Collect document reference and data
  const docRef = db
    .collection("countries")
    .doc(country)
    .collection("subjectMappings")
    .doc(subject)
    .collection(gradeLevel)
    .doc(docId);

  documents.set(docId, { ref: docRef, data: mappingDoc });

  // Recursively collect children
  if (hasSubTopics) {
    for (let i = 0; i < node.sub_topics!.length; i++) {
      collectNodes(
        db,
        node.sub_topics![i],
        country,
        subject,
        gradeLevel,
        docId,
        currentPath,
        level + 1,
        i,
        documents
      );
    }
  }

  return docId;
}

/**
 * Write documents in batches to Firestore
 */
async function writeBatches(
  db: FirebaseFirestore.Firestore,
  documents: Map<
    string,
    { ref: FirebaseFirestore.DocumentReference; data: SubjectMappingDocument }
  >
): Promise<void> {
  const allDocs = Array.from(documents.values());
  const batches: FirebaseFirestore.WriteBatch[] = [];
  let currentBatch = db.batch();
  let count = 0;

  console.log(`\n💾 Writing ${allDocs.length} documents in batches...`);

  for (const doc of allDocs) {
    currentBatch.set(doc.ref, doc.data);
    count++;

    // Firestore batch limit is 500
    if (count % 500 === 0) {
      batches.push(currentBatch);
      currentBatch = db.batch();
    }
  }

  // Add remaining documents
  if (count % 500 !== 0) {
    batches.push(currentBatch);
  }

  // Commit all batches
  for (let i = 0; i < batches.length; i++) {
    await batches[i].commit();
    console.log(
      `   ✓ Batch ${i + 1}/${batches.length} committed (${Math.min((i + 1) * 500, allDocs.length)}/${allDocs.length} documents)`
    );
  }

  console.log(`   ✅ Successfully wrote ${allDocs.length} documents`);
}

/**
 * Import a single subject's data for a specific country
 */
async function importSubject(
  db: FirebaseFirestore.Firestore,
  country: string,
  subjectKey: string,
  subjectName: string,
  jsonData: JSONData
): Promise<void> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Importing ${subjectName} (${subjectKey}) for ${country}`);
  console.log("=".repeat(60));

  const grades = ["grade_9_10", "grade_11_12"] as const;
  const allDocuments = new Map<
    string,
    { ref: FirebaseFirestore.DocumentReference; data: SubjectMappingDocument }
  >();

  for (const gradeLevel of grades) {
    const gradeData = jsonData[gradeLevel];
    if (!gradeData || gradeData.length === 0) {
      console.log(`\n⚠️  No data found for ${gradeLevel}`);
      continue;
    }

    console.log(
      `\n📚 Processing ${gradeLevel.replace("_", "-")} (${gradeData.length} main topics)`
    );

    // Create root node for this grade
    const gradeDocId = generateDocId(gradeLevel, "root");
    const gradeDisplayName =
      gradeLevel === "grade_9_10" ? "Grade 9-10" : "Grade 11-12";

    const gradeDoc: SubjectMappingDocument = {
      key: gradeLevel,
      name: gradeDisplayName,
      shortDescription: `${subjectName} curriculum for ${gradeDisplayName}`,
      level: 1,
      parentId: null,
      path: `${subjectKey}/${gradeLevel}`,
      subject: subjectKey,
      gradeLevel,
      orderIndex: 0,
      isLeaf: false,
      taskCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Add grade doc to collection
    const gradeDocRef = db
      .collection("countries")
      .doc(country)
      .collection("subjectMappings")
      .doc(subjectKey)
      .collection(gradeLevel)
      .doc(gradeDocId);

    allDocuments.set(gradeDocId, { ref: gradeDocRef, data: gradeDoc });
    console.log(`  [1] ${gradeDisplayName}`);

    // Collect all main topics and their children
    for (let i = 0; i < gradeData.length; i++) {
      collectNodes(
        db,
        gradeData[i],
        country,
        subjectKey,
        gradeLevel,
        gradeDocId,
        `${subjectKey}/${gradeLevel}`,
        2,
        i,
        allDocuments
      );
    }
  }

  // Write all collected documents in batches
  await writeBatches(db, allDocuments);

  console.log(`\n✅ ${subjectName} import complete for ${country}!`);
}

/**
 * Clear existing subject mappings for a specific country (optional)
 */
async function clearExistingMappings(
  db: FirebaseFirestore.Firestore,
  country: string,
  subject?: string
): Promise<void> {
  console.log(`\n🗑️  Clearing existing subject mappings for ${country}...`);

  const subjectMappingsRef = db
    .collection("countries")
    .doc(country)
    .collection("subjectMappings");

  if (subject) {
    // Delete specific subject's grade collections
    console.log(`   Clearing subject: ${subject}`);
    const grades = ["grade_9_10", "grade_11_12"];
    let totalDeleted = 0;

    for (const grade of grades) {
      const gradeSnapshot = await subjectMappingsRef
        .doc(subject)
        .collection(grade)
        .get();

      if (gradeSnapshot.size > 0) {
        const batches: FirebaseFirestore.WriteBatch[] = [];
        let currentBatch = db.batch();
        let count = 0;

        gradeSnapshot.docs.forEach((doc) => {
          currentBatch.delete(doc.ref);
          count++;

          if (count % 500 === 0) {
            batches.push(currentBatch);
            currentBatch = db.batch();
          }
        });

        if (count % 500 !== 0) {
          batches.push(currentBatch);
        }

        for (let i = 0; i < batches.length; i++) {
          await batches[i].commit();
        }

        totalDeleted += count;
        console.log(`   Deleted ${count} documents from ${subject}/${grade}`);
      }
    }

    console.log(
      `   ✅ Total deleted: ${totalDeleted} documents for ${subject}`
    );
  } else {
    // Delete all subjects
    const subjectsSnapshot = await subjectMappingsRef.get();
    console.log(`   Found ${subjectsSnapshot.size} subjects to clear`);

    for (const subjectDoc of subjectsSnapshot.docs) {
      const subjectKey = subjectDoc.id;
      console.log(`   Clearing subject: ${subjectKey}`);

      const grades = ["grade_9_10", "grade_11_12"];

      for (const grade of grades) {
        const gradeSnapshot = await subjectMappingsRef
          .doc(subjectKey)
          .collection(grade)
          .get();

        if (gradeSnapshot.size > 0) {
          const batches: FirebaseFirestore.WriteBatch[] = [];
          let currentBatch = db.batch();
          let count = 0;

          gradeSnapshot.docs.forEach((doc) => {
            currentBatch.delete(doc.ref);
            count++;

            if (count % 500 === 0) {
              batches.push(currentBatch);
              currentBatch = db.batch();
            }
          });

          if (count % 500 !== 0) {
            batches.push(currentBatch);
          }

          for (let i = 0; i < batches.length; i++) {
            await batches[i].commit();
          }

          console.log(
            `   Deleted ${count} documents from ${subjectKey}/${grade}`
          );
        }
      }
    }

    console.log(`   ✅ Cleared all subjects for ${country}`);
  }
}

/**
 * Get file path for a specific country and subject
 */
function getDataFilePath(
  country: string,
  subject: string,
  fileName: string
): string {
  // Try new structure first: src/data/mappings/{country}/{fileName}
  const newPath = path.join(
    __dirname,
    "../data/mappings",
    country.toLowerCase(),
    fileName
  );
  if (fs.existsSync(newPath)) {
    return newPath;
  }

  // Fallback to old structure: src/data/subject_mapping/{fileName}
  const oldPath = path.join(__dirname, "../data/subject_mapping", fileName);
  if (fs.existsSync(oldPath)) {
    console.log(`⚠️  Using legacy path for ${country}/${subject}: ${oldPath}`);
    return oldPath;
  }

  throw new Error(`Data file not found: ${newPath} or ${oldPath}`);
}

/**
 * Main migration function
 */
async function migrate(
  options: {
    clear?: boolean;
    country?: string;
    subject?: string;
    all?: boolean;
  } = {}
): Promise<void> {
  try {
    console.log("\n🚀 Starting Subject Mappings Migration (Country-Based)");
    console.log("=====================================================\n");

    // Load configuration
    const config = loadConfig();

    // Initialize Firebase
    console.log("Initializing Firebase...");
    initializeFirebase();
    const db = getFirestore();

    // Determine what to migrate
    let countriesToMigrate: string[];

    if (options.all) {
      // Migrate all countries
      countriesToMigrate = Object.keys(config.countries);
      console.log(
        `\n📍 Migrating ALL countries: ${countriesToMigrate.join(", ")}`
      );
    } else if (options.country) {
      // Migrate specific country
      const countryCode = options.country.toUpperCase();
      if (!config.countries[countryCode]) {
        throw new Error(
          `Unknown country: ${countryCode}. Available: ${Object.keys(config.countries).join(", ")}`
        );
      }
      countriesToMigrate = [countryCode];
    } else {
      throw new Error("Please specify --country or --all");
    }

    // Process each country
    for (const countryCode of countriesToMigrate) {
      const countryConfig = config.countries[countryCode];

      console.log(`\n${"█".repeat(60)}`);
      console.log(`🌍 Processing ${countryConfig.name} (${countryCode})`);
      console.log("█".repeat(60));

      // Clear existing data if requested
      if (options.clear) {
        await clearExistingMappings(db, countryCode, options.subject);
      }

      // Determine which subjects to import
      const subjectsToImport = options.subject
        ? [options.subject]
        : Object.keys(countryConfig.subjects);

      // Import each subject
      for (const subjectKey of subjectsToImport) {
        const subjectConfig = countryConfig.subjects[subjectKey];

        if (!subjectConfig) {
          console.warn(
            `⚠️  Subject '${subjectKey}' not configured for ${countryCode}`
          );
          continue;
        }

        // Get file path
        const jsonPath = getDataFilePath(
          countryCode,
          subjectKey,
          subjectConfig.file
        );
        console.log(`📁 Reading: ${jsonPath}`);

        // Read and parse JSON
        const jsonContent = fs.readFileSync(jsonPath, "utf-8");
        const jsonData: JSONData = JSON.parse(jsonContent);

        // Import to Firestore
        await importSubject(
          db,
          countryCode,
          subjectKey,
          subjectConfig.name,
          jsonData
        );
      }
    }

    // Final summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Migration Complete!");
    console.log("=".repeat(60));
    console.log("\nMigrated:");
    console.log(`  Countries: ${countriesToMigrate.join(", ")}`);
    if (options.subject) {
      console.log(`  Subject: ${options.subject}`);
    } else {
      console.log(`  Subjects: All configured subjects`);
    }
    console.log("\nFirestore structure:");
    countriesToMigrate.forEach((country) => {
      console.log(
        `  countries/${country}/subjectMappings/{subject}/{gradeLevel}/{docId}`
      );
    });
    console.log("\nNext steps:");
    console.log("  1. Check Firestore console to verify data");
    console.log("  2. Test API endpoints");
    console.log("  3. Create some test tasks\n");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  }
}

/**
 * Show usage help
 */
function showHelp(): void {
  console.log(`
📚 Subject Mappings Migration Script

Usage:
  npm run migrate:subjects -- [options]

Options:
  --country <code>    Country code (HU, US, MX, etc.)
  --subject <name>    Subject name (mathematics, physics, etc.)
  --clear             Clear existing mappings before import
  --all               Migrate all countries and subjects
  --help              Show this help message

Examples:
  # Migrate mathematics for Hungary
  npm run migrate:subjects -- --country HU --subject mathematics

  # Migrate all subjects for US, clearing existing data
  npm run migrate:subjects -- --country US --clear

  # Migrate all countries and subjects
  npm run migrate:subjects -- --all

  # Migrate specific subject for all countries
  npm run migrate:subjects -- --all --subject mathematics

Configuration:
  Edit src/config/subject-mappings.config.json to add countries/subjects

Data Files:
  Place JSON files in: src/data/mappings/{country}/{filename}
  Example: src/data/mappings/hu/hu_mathematics_grade_9_12.json
`);
}

/**
 * CLI execution
 */
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);

  // Show help
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  const options: {
    clear?: boolean;
    country?: string;
    subject?: string;
    all?: boolean;
  } = {};

  if (args.includes("--clear")) {
    options.clear = true;
  }

  if (args.includes("--all")) {
    options.all = true;
  }

  const countryIndex = args.indexOf("--country");
  if (countryIndex !== -1 && args[countryIndex + 1]) {
    options.country = args[countryIndex + 1];
  }

  const subjectIndex = args.indexOf("--subject");
  if (subjectIndex !== -1 && args[subjectIndex + 1]) {
    options.subject = args[subjectIndex + 1];
  }

  // Validate
  if (!options.country && !options.all) {
    console.error("\n❌ Error: Please specify --country or --all\n");
    showHelp();
    process.exit(1);
  }

  // Run migration
  migrate(options)
    .then(() => {
      console.log("\n✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Script failed:", error);
      process.exit(1);
    });
}

export { migrate };
