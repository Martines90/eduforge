/**
 * Cleanup Script: Delete Old Subject Mappings from Firestore
 *
 * This script deletes old grade levels that no longer exist in the new grade system.
 * Useful for cleaning up legacy data before migrating to the new structure.
 *
 * Structure: countries/{country}/subjectMappings/{subject}/{gradeLevel}/{docId}
 *
 * Usage:
 *   npm run cleanup:subjects -- --country MX --grade grade_9_12 --dry-run
 *   npm run cleanup:subjects -- --country MX --grade grade_11_12
 *   npm run cleanup:subjects -- --country MX --grade grade_9_12 --subject mathematics
 *   npm run cleanup:subjects -- --country MX --all-old-grades
 *
 * Required Arguments:
 *   --country <code>        : Specific country code (HU, MX, US)
 *   --grade <level> OR --all-old-grades : Specific old grade level or all old grades
 *
 * Optional Arguments:
 *   --subject <name>        : Specific subject to clean (default: all subjects)
 *   --dry-run               : Preview what will be deleted without actually deleting
 */

import { initializeFirebase, getFirestore } from "../config/firebase.config";
import {
  CountryCode,
  getAllCountryCodes,
} from "../../../shared/types/countries";
import { getGradesForCountry } from "../../../shared/types/grades";

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
 * Known old grade levels that might exist in Firestore but not in new system
 */
const KNOWN_OLD_GRADES = [
  "grade_9_10",
  "grade_11_12",
  "grade_9_12", // Old Hungary/Mexico grade
  "grade_k_12",
  "grade_1_12",
] as const;

/**
 * Delete documents from a specific collection
 */
async function deleteCollection(
  db: FirebaseFirestore.Firestore,
  collectionRef: FirebaseFirestore.CollectionReference,
  dryRun: boolean
): Promise<number> {
  const snapshot = await collectionRef.get();

  if (snapshot.size === 0) {
    return 0;
  }

  if (dryRun) {
    console.log(`   [DRY RUN] Would delete ${snapshot.size} documents`);
    return snapshot.size;
  }

  // Delete in batches of 500 (Firestore limit)
  const batches: FirebaseFirestore.WriteBatch[] = [];
  let currentBatch = db.batch();
  let count = 0;

  snapshot.docs.forEach((doc) => {
    currentBatch.delete(doc.ref);
    count++;

    if (count % 500 === 0) {
      batches.push(currentBatch);
      currentBatch = db.batch();
    }
  });

  // Add remaining documents
  if (count % 500 !== 0) {
    batches.push(currentBatch);
  }

  // Commit all batches
  for (let i = 0; i < batches.length; i++) {
    await batches[i].commit();
    console.log(
      `   ✓ Batch ${i + 1}/${batches.length} committed (${Math.min((i + 1) * 500, count)}/${count} documents)`
    );
  }

  return count;
}

/**
 * Get all subjects from Firestore for a country
 */
async function getExistingSubjects(
  db: FirebaseFirestore.Firestore,
  country: CountryCode
): Promise<string[]> {
  const subjectMappingsRef = db
    .collection("countries")
    .doc(country)
    .collection("subjectMappings");

  const snapshot = await subjectMappingsRef.get();
  return snapshot.docs.map((doc) => doc.id);
}

/**
 * Get all grade collections for a subject
 */
async function getExistingGrades(
  db: FirebaseFirestore.Firestore,
  country: CountryCode,
  subject: string
): Promise<string[]> {
  const subjectRef = db
    .collection("countries")
    .doc(country)
    .collection("subjectMappings")
    .doc(subject);

  const collections = await subjectRef.listCollections();
  return collections.map((col) => col.id);
}

/**
 * Main cleanup function
 */
async function cleanup(options: {
  country?: string;
  grade?: string;
  subject?: string;
  allOldGrades?: boolean;
  dryRun?: boolean;
}): Promise<void> {
  try {
    console.log("\n🧹 Starting Old Subject Mappings Cleanup");
    console.log("==========================================\n");

    if (options.dryRun) {
      console.log("⚠️  DRY RUN MODE - No data will be deleted\n");
    }

    // Initialize Firebase
    console.log("Initializing Firebase...");
    initializeFirebase();
    const db = getFirestore();

    // Validate country
    if (!options.country) {
      throw new Error("Please specify --country");
    }

    const countryCode = options.country.toUpperCase() as CountryCode;
    const allCountryCodes = getAllCountryCodes();

    if (!allCountryCodes.includes(countryCode)) {
      throw new Error(
        `Unknown country: ${countryCode}. Available: ${allCountryCodes.join(", ")}`
      );
    }

    console.log(`\n📍 Country: ${countryCode}`);

    // Get current valid grades for this country (as strings for comparison)
    const currentValidGrades: string[] = getGradesForCountry(countryCode).map(
      (g) => g.value as string
    );
    console.log(`✓ Current valid grades: ${currentValidGrades.join(", ")}\n`);

    // Determine which grades to clean
    let gradesToClean: string[] = [];

    if (options.allOldGrades) {
      // Find all grades in Firestore that are NOT in the current valid grades
      console.log("🔍 Scanning for old grade levels in Firestore...\n");

      const subjects = options.subject
        ? [options.subject]
        : await getExistingSubjects(db, countryCode);

      const foundOldGrades = new Set<string>();

      for (const subject of subjects) {
        const existingGrades = await getExistingGrades(
          db,
          countryCode,
          subject
        );

        for (const grade of existingGrades) {
          if (!currentValidGrades.includes(grade)) {
            foundOldGrades.add(grade);
          }
        }
      }

      gradesToClean = Array.from(foundOldGrades);

      if (gradesToClean.length === 0) {
        console.log(
          "✅ No old grade levels found! All grades are up to date.\n"
        );
        return;
      }

      console.log(`📋 Found old grade levels: ${gradesToClean.join(", ")}\n`);
    } else if (options.grade) {
      // Clean specific grade
      gradesToClean = [options.grade];
      console.log(`📋 Target grade: ${options.grade}\n`);

      // Check if this grade is actually old
      if (currentValidGrades.includes(options.grade)) {
        console.warn(
          `⚠️  WARNING: Grade '${options.grade}' is a VALID grade for ${countryCode}!`
        );
        console.warn(
          "   Are you sure you want to delete it? This should only be used for OLD grades.\n"
        );

        if (!options.dryRun) {
          throw new Error(
            "Refusing to delete a valid grade. Use --dry-run to preview."
          );
        }
      }
    } else {
      throw new Error("Please specify --grade or --all-old-grades");
    }

    // Determine which subjects to clean
    const subjectsToClean = options.subject
      ? [options.subject]
      : await getExistingSubjects(db, countryCode);

    console.log(`📚 Subjects to check: ${subjectsToClean.join(", ")}\n`);

    // Track totals
    let totalDeleted = 0;
    let totalCollectionsProcessed = 0;

    // Process each grade
    for (const grade of gradesToClean) {
      console.log(`${"=".repeat(60)}`);
      console.log(`🗑️  Processing grade: ${grade}`);
      console.log("=".repeat(60));

      for (const subject of subjectsToClean) {
        const collectionRef = db
          .collection("countries")
          .doc(countryCode)
          .collection("subjectMappings")
          .doc(subject)
          .collection(grade);

        console.log(`\n📁 ${countryCode}/${subject}/${grade}/`);

        try {
          const deletedCount = await deleteCollection(
            db,
            collectionRef,
            options.dryRun || false
          );

          if (deletedCount > 0) {
            totalDeleted += deletedCount;
            totalCollectionsProcessed++;

            if (options.dryRun) {
              console.log(
                `   ✓ Would delete ${deletedCount} documents from ${subject}/${grade}`
              );
            } else {
              console.log(
                `   ✅ Deleted ${deletedCount} documents from ${subject}/${grade}`
              );
            }
          } else {
            console.log(`   ⚪ No documents found (already clean)`);
          }
        } catch (error) {
          console.error(`   ❌ Error processing ${subject}/${grade}:`, error);
        }
      }

      console.log(); // Empty line after each grade
    }

    // Final summary
    console.log("\n" + "=".repeat(60));
    if (options.dryRun) {
      console.log("📊 DRY RUN SUMMARY");
    } else {
      console.log("🎉 CLEANUP COMPLETE");
    }
    console.log("=".repeat(60));
    console.log(`\nCountry: ${countryCode}`);
    console.log(`Old grades processed: ${gradesToClean.join(", ")}`);
    console.log(`Collections processed: ${totalCollectionsProcessed}`);

    if (options.dryRun) {
      console.log(`Documents that would be deleted: ${totalDeleted}`);
      console.log(
        "\n💡 Run without --dry-run to actually delete these documents\n"
      );
    } else {
      console.log(`Total documents deleted: ${totalDeleted}`);
      console.log("\n✅ Old grade levels have been cleaned up!");
      console.log("\nNext steps:");
      console.log(
        "  1. Verify in Firestore console that old grades are removed"
      );
      console.log("  2. Run migration script to import new grade structure:");
      console.log(
        `     npm run migrate:subjects -- --country ${countryCode} --subject all --grade <new_grade>`
      );
      console.log();
    }
  } catch (error) {
    console.error("\n❌ Cleanup failed:", error);
    throw error;
  }
}

/**
 * Show usage help
 */
function showHelp(): void {
  const allCountryCodes = getAllCountryCodes();
  console.log(`
🧹 Old Subject Mappings Cleanup Script

This script removes old grade levels from Firestore that no longer exist
in the new grade system (shared/types/grades.ts).

Usage:
  npm run cleanup:subjects -- [options]

Required Arguments:
  --country <code>        Country code (${allCountryCodes.join(", ")})
  --grade <level> OR --all-old-grades
                          Specific old grade level or automatically find all old grades

Optional Arguments:
  --subject <name>        Specific subject to clean (default: all subjects)
  --dry-run               Preview what will be deleted without actually deleting
  --help                  Show this help message

Examples:
  # DRY RUN: See what would be deleted for Mexico grade_9_12
  npm run cleanup:subjects -- --country MX --grade grade_9_12 --dry-run

  # Delete specific old grade for Mexico (all subjects)
  npm run cleanup:subjects -- --country MX --grade grade_9_12

  # Delete specific old grade for specific subject
  npm run cleanup:subjects -- --country MX --grade grade_11_12 --subject mathematics

  # Automatically find and delete ALL old grades for Mexico
  npm run cleanup:subjects -- --country MX --all-old-grades

  # DRY RUN: Preview all old grades that would be deleted
  npm run cleanup:subjects -- --country MX --all-old-grades --dry-run

Known Old Grades:
  ${KNOWN_OLD_GRADES.join(", ")}

Current Valid Grades by Country:
${allCountryCodes
  .map((country: CountryCode) => {
    const grades = getGradesForCountry(country);
    return `  ${country}: ${grades.map((g) => g.value).join(", ")}`;
  })
  .join("\n")}

Safety Features:
  - Validates country codes
  - Warns if trying to delete a valid grade
  - Dry-run mode to preview deletions
  - Batch deletion (500 documents per batch)
  - Detailed logging

IMPORTANT:
  This script does NOT validate if a grade exists in the new system.
  It can delete ANY grade level you specify, making it perfect for
  cleaning up old/legacy grade structures.
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
    country?: string;
    grade?: string;
    subject?: string;
    allOldGrades?: boolean;
    dryRun?: boolean;
  } = {};

  const countryIndex = args.indexOf("--country");
  if (countryIndex !== -1 && args[countryIndex + 1]) {
    options.country = args[countryIndex + 1];
  }

  const gradeIndex = args.indexOf("--grade");
  if (gradeIndex !== -1 && args[gradeIndex + 1]) {
    options.grade = args[gradeIndex + 1];
  }

  const subjectIndex = args.indexOf("--subject");
  if (subjectIndex !== -1 && args[subjectIndex + 1]) {
    options.subject = args[subjectIndex + 1];
  }

  if (args.includes("--all-old-grades")) {
    options.allOldGrades = true;
  }

  if (args.includes("--dry-run")) {
    options.dryRun = true;
  }

  // Validate
  if (!options.country) {
    console.error("\n❌ Error: Please specify --country\n");
    showHelp();
    process.exit(1);
  }

  if (!options.grade && !options.allOldGrades) {
    console.error("\n❌ Error: Please specify --grade or --all-old-grades\n");
    showHelp();
    process.exit(1);
  }

  // Run cleanup
  cleanup(options)
    .then(() => {
      console.log("\n✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Script failed:", error);
      process.exit(1);
    });
}

export { cleanup };
