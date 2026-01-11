/**
 * Migration Script: Import Subject Mappings to Firestore (Country-Based)
 *
 * This script reads curriculum JSON files and imports them into Firestore
 * using a country-based hierarchical structure with dynamic grade levels.
 *
 * Structure: countries/{country}/subjectMappings/{subject}/{gradeLevel}/{docId}
 *
 * Usage (ALL arguments are REQUIRED):
 *   npm run migrate:subjects -- --country HU --subject mathematics --grade grade_9_12
 *   npm run migrate:subjects -- --country MX --subject all --grade grade_10_12 --clear
 *   npm run migrate:subjects -- --all --subject mathematics --grade grade_9_12
 *
 * Or directly:
 *   ts-node src/scripts/migrate-subject-mappings.ts --country HU --subject mathematics --grade grade_9_12
 *
 * Required Arguments:
 *   --country <code> OR --all   : Specific country code (HU, MX, US) or all countries
 *   --subject <name>            : Subject name or "all" for all subjects
 *   --grade <level>             : Specific grade level (e.g., grade_9_12, grade_3_6)
 */

import * as fs from "fs";
import * as path from "path";
import { initializeFirebase, getFirestore } from "../config/firebase.config";
import { SubjectMappingDocument } from "../types/task.types";
import { Timestamp } from "firebase-admin/firestore";
import {
  getGradesForCountry,
  GradeLevel,
  GradeConfig,
} from "../../../shared/types/grades";
import {
  CountryCode,
  getAllCountryCodes,
} from "../../../shared/types/countries";

interface JSONNode {
  key: string;
  name: string;
  short_description?: string;
  sub_topics?: JSONNode[];
  example_tasks?: string[];
}

/**
 * Subject keys available in the system
 */
const SUBJECTS = {
  mathematics: "Mathematics",
  physics: "Physics",
  chemistry: "Chemistry",
  biology: "Biology",
  history: "History",
  geography: "Geography",
  literature: "Literature",
  informatics: "Informatics",
} as const;

type SubjectKey = keyof typeof SUBJECTS;

/**
 * Generate document ID from path components
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
  country: CountryCode,
  subject: SubjectKey,
  gradeLevel: GradeLevel,
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
    id: docId, // Document ID (will match Firestore document ID)
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
 * Import a single subject's data for a specific country and grade
 */
async function importSubjectGrade(
  db: FirebaseFirestore.Firestore,
  country: CountryCode,
  subjectKey: SubjectKey,
  gradeConfig: GradeConfig,
  jsonData: JSONNode[]
): Promise<void> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(
    `Importing ${SUBJECTS[subjectKey]} (${subjectKey}) for ${country} - ${gradeConfig.labelEN}`
  );
  console.log("=".repeat(60));

  if (!jsonData || jsonData.length === 0) {
    console.log(`\n⚠️  No data found for ${gradeConfig.value}`);
    return;
  }

  const allDocuments = new Map<
    string,
    { ref: FirebaseFirestore.DocumentReference; data: SubjectMappingDocument }
  >();

  console.log(
    `\n📚 Processing ${gradeConfig.labelEN} (${jsonData.length} main topics)`
  );

  // Create root node for this grade
  const gradeDocId = generateDocId(gradeConfig.value, "root");

  const gradeDoc: SubjectMappingDocument = {
    id: gradeDocId, // Document ID (will match Firestore document ID)
    name: gradeConfig.labelEN,
    shortDescription: `${SUBJECTS[subjectKey]} curriculum for ${gradeConfig.labelEN}`,
    level: 1,
    parentId: null,
    path: `${subjectKey}/${gradeConfig.value}`,
    subject: subjectKey,
    gradeLevel: gradeConfig.value,
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
    .collection(gradeConfig.value)
    .doc(gradeDocId);

  allDocuments.set(gradeDocId, { ref: gradeDocRef, data: gradeDoc });
  console.log(`  [1] ${gradeConfig.labelEN}`);

  // Collect all main topics and their children
  for (let i = 0; i < jsonData.length; i++) {
    collectNodes(
      db,
      jsonData[i],
      country,
      subjectKey,
      gradeConfig.value,
      gradeDocId,
      `${subjectKey}/${gradeConfig.value}`,
      2,
      i,
      allDocuments
    );
  }

  // Write all collected documents in batches
  await writeBatches(db, allDocuments);

  console.log(
    `\n✅ ${SUBJECTS[subjectKey]} import complete for ${country} - ${gradeConfig.labelEN}!`
  );
}

/**
 * Clear existing subject mappings for a specific country
 */
async function clearExistingMappings(
  db: FirebaseFirestore.Firestore,
  country: CountryCode,
  subject?: SubjectKey,
  gradeLevel?: GradeLevel
): Promise<void> {
  console.log(`\n🗑️  Clearing existing subject mappings for ${country}...`);

  const subjectMappingsRef = db
    .collection("countries")
    .doc(country)
    .collection("subjectMappings");

  if (subject) {
    // Get grade levels for this country
    const grades = gradeLevel
      ? [gradeLevel]
      : getGradesForCountry(country).map((g) => g.value);

    console.log(`   Clearing subject: ${subject}`);
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

      const grades = getGradesForCountry(country).map((g) => g.value);

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
 * Get file path for a specific country, subject, and grade
 * New structure: src/data/mappings/{country}/grade_{grade}/{subject}.json
 * Old structure: src/data/mappings/{country}/{country}_{subject}_grade_{grade}.json
 */
function getDataFilePath(
  country: CountryCode,
  subject: SubjectKey,
  gradeLevel: GradeLevel
): string {
  const countryLower = country.toLowerCase();

  // Try new structure first: mappings/{country}/grade_{grade}/{subject}.json
  const newPath = path.join(
    __dirname,
    "../data/mappings",
    countryLower,
    gradeLevel,
    `${subject}.json`
  );
  if (fs.existsSync(newPath)) {
    console.log(`✓ Found new structure: ${newPath}`);
    return newPath;
  }

  // Try old structure: mappings/{country}/{country}_{subject}_grade_{grade}.json
  const oldFileName = `${countryLower}_${subject}_${gradeLevel}.json`;
  const oldPath = path.join(
    __dirname,
    "../data/mappings",
    countryLower,
    oldFileName
  );
  if (fs.existsSync(oldPath)) {
    console.log(`⚠️  Using legacy structure: ${oldPath}`);
    return oldPath;
  }

  // Try even older structure: subject_mapping/{filename}
  const legacyPath = path.join(
    __dirname,
    "../data/subject_mapping",
    oldFileName
  );
  if (fs.existsSync(legacyPath)) {
    console.log(`⚠️  Using legacy path: ${legacyPath}`);
    return legacyPath;
  }

  throw new Error(
    `Data file not found for ${country}/${subject}/${gradeLevel}. Tried:\n` +
      `  - ${newPath}\n` +
      `  - ${oldPath}\n` +
      `  - ${legacyPath}`
  );
}

/**
 * Main migration function
 */
async function migrate(
  options: {
    clear?: boolean;
    country?: string;
    subject?: string;
    grade?: string;
    all?: boolean;
  } = {}
): Promise<void> {
  try {
    console.log("\n🚀 Starting Subject Mappings Migration (Country-Based)");
    console.log("=====================================================\n");

    // Initialize Firebase
    console.log("Initializing Firebase...");
    initializeFirebase();
    const db = getFirestore();

    // Determine what to migrate
    let countriesToMigrate: CountryCode[];

    const allCountryCodes = getAllCountryCodes();

    if (options.all) {
      // Migrate all countries
      countriesToMigrate = allCountryCodes;
      console.log(
        `\n📍 Migrating ALL countries: ${countriesToMigrate.join(", ")}`
      );
    } else if (options.country) {
      // Migrate specific country
      const countryCode = options.country.toUpperCase() as CountryCode;
      if (!allCountryCodes.includes(countryCode)) {
        throw new Error(
          `Unknown country: ${countryCode}. Available: ${allCountryCodes.join(", ")}`
        );
      }
      countriesToMigrate = [countryCode];
    } else {
      throw new Error("Please specify --country or --all");
    }

    // Process each country
    for (const countryCode of countriesToMigrate) {
      console.log(`\n${"█".repeat(60)}`);
      console.log(`🌍 Processing ${countryCode}`);
      console.log("█".repeat(60));

      // Get grades for this country
      if (!options.grade) {
        throw new Error(
          `Please specify --grade for ${countryCode}. Available: ${getGradesForCountry(
            countryCode
          )
            .map((g) => g.value)
            .join(", ")}`
        );
      }

      const grades = getGradesForCountry(countryCode).filter(
        (g) => g.value === options.grade
      );

      if (grades.length === 0) {
        throw new Error(
          `Invalid grade ${options.grade} for ${countryCode}. Available: ${getGradesForCountry(
            countryCode
          )
            .map((g) => g.value)
            .join(", ")}`
        );
      }

      // Clear existing data if requested
      if (options.clear) {
        await clearExistingMappings(
          db,
          countryCode,
          options.subject as SubjectKey | undefined,
          options.grade as GradeLevel | undefined
        );
      }

      // Determine which subjects to import
      let subjectsToImport: SubjectKey[];

      if (!options.subject) {
        throw new Error(
          "Please specify --subject (or use 'all' to import all subjects)"
        );
      }

      if (options.subject.toLowerCase() === "all") {
        subjectsToImport = Object.keys(SUBJECTS) as SubjectKey[];
      } else {
        if (!SUBJECTS[options.subject as SubjectKey]) {
          throw new Error(
            `Unknown subject: ${options.subject}. Available: ${Object.keys(SUBJECTS).join(", ")}, all`
          );
        }
        subjectsToImport = [options.subject as SubjectKey];
      }

      // Import each subject for each grade
      for (const gradeConfig of grades) {
        for (const subjectKey of subjectsToImport) {
          if (!SUBJECTS[subjectKey]) {
            console.warn(`⚠️  Unknown subject: ${subjectKey}`);
            continue;
          }

          try {
            // Get file path
            const jsonPath = getDataFilePath(
              countryCode,
              subjectKey,
              gradeConfig.value
            );
            console.log(`📁 Reading: ${jsonPath}`);

            // Read and parse JSON
            const jsonContent = fs.readFileSync(jsonPath, "utf-8");
            const jsonData: JSONNode[] = JSON.parse(jsonContent);

            // Import to Firestore
            await importSubjectGrade(
              db,
              countryCode,
              subjectKey,
              gradeConfig,
              jsonData
            );
          } catch (error) {
            if (error instanceof Error && error.message.includes("not found")) {
              console.warn(
                `⚠️  Skipping ${countryCode}/${subjectKey}/${gradeConfig.value}: ${error.message}`
              );
            } else {
              throw error;
            }
          }
        }
      }
    }

    // Final summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Migration Complete!");
    console.log("=".repeat(60));
    console.log("\nMigrated:");
    console.log(`  Countries: ${countriesToMigrate.join(", ")}`);
    console.log(
      `  Subject: ${options.subject === "all" ? "All subjects" : options.subject}`
    );
    console.log(`  Grade: ${options.grade}`);
    console.log("\nFirestore structure:");
    countriesToMigrate.forEach((country) => {
      const grades = getGradesForCountry(country);
      console.log(`  countries/${country}/subjectMappings/{subject}/`);
      grades.forEach((g) => {
        console.log(`    - ${g.value}/ (${g.labelEN})`);
      });
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
  const allCountryCodes = getAllCountryCodes();
  console.log(`
📚 Subject Mappings Migration Script (Dynamic Grade System)

Usage:
  npm run migrate:subjects -- [options]

Options:
  --country <code>    Country code (${allCountryCodes.join(", ")}) - REQUIRED (or use --all)
  --subject <name>    Subject name (${Object.keys(SUBJECTS).join(", ")}, all) - REQUIRED
  --grade <level>     Specific grade level (e.g., grade_9_12, grade_3_6) - REQUIRED
  --clear             Clear existing mappings before import
  --all               Migrate all countries (still requires --subject and --grade)
  --help              Show this help message

Examples:
  # Migrate mathematics for Hungary, grade 9-12
  npm run migrate:subjects -- --country HU --subject mathematics --grade grade_9_12

  # Migrate specific grade for Mexico
  npm run migrate:subjects -- --country MX --subject mathematics --grade grade_10_12

  # Migrate all subjects for US grade 9-12, clearing existing data
  npm run migrate:subjects -- --country US --subject all --grade grade_9_12 --clear

  # Migrate mathematics grade 9-12 for all countries
  npm run migrate:subjects -- --all --subject mathematics --grade grade_9_12

  # Migrate all subjects for Mexico grade 10-12
  npm run migrate:subjects -- --country MX --subject all --grade grade_10_12

Grade Systems (from shared/types/grades.ts):
${allCountryCodes
  .map((country: CountryCode) => {
    const grades = getGradesForCountry(country);
    return `  ${country}: ${grades.map((g) => g.value).join(", ")}`;
  })
  .join("\n")}

Data Files:
  New structure: src/data/mappings/{country}/grade_{level}/{subject}.json
  Example: src/data/mappings/mx/grade_10_12/mathematics.json

  Legacy structure (still supported):
  src/data/mappings/{country}/{country}_{subject}_grade_{level}.json
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
    grade?: string;
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

  const gradeIndex = args.indexOf("--grade");
  if (gradeIndex !== -1 && args[gradeIndex + 1]) {
    options.grade = args[gradeIndex + 1];
  }

  // Validate required arguments
  if (!options.country && !options.all) {
    console.error("\n❌ Error: Please specify --country or --all\n");
    showHelp();
    process.exit(1);
  }

  if (!options.subject) {
    console.error(
      "\n❌ Error: --subject is required (use 'all' to migrate all subjects)\n"
    );
    showHelp();
    process.exit(1);
  }

  if (!options.grade) {
    console.error("\n❌ Error: --grade is required\n");
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
