/**
 * Force Delete Mexico Subject Mappings
 *
 * This script will forcefully delete ALL subject mappings for Mexico,
 * regardless of grade level.
 */

import { initializeFirebase, getFirestore } from "../config/firebase.config";

async function forceDeleteMexico() {
  try {
    console.log("\n🗑️  Force Deleting Mexico Subject Mappings");
    console.log("=".repeat(60));

    initializeFirebase();
    const db = getFirestore();

    const countryRef = db.collection("countries").doc("MX");

    // Check if Mexico country document exists
    const mexicoDoc = await countryRef.get();
    console.log(`\n📍 Mexico document exists: ${mexicoDoc.exists}`);

    // Get all subjects under subjectMappings
    const subjectMappingsRef = countryRef.collection("subjectMappings");
    const subjectsSnapshot = await subjectMappingsRef.get();

    console.log(`\n📚 Found ${subjectsSnapshot.size} subjects in Mexico`);

    if (subjectsSnapshot.size === 0) {
      console.log("\n⚠️  No subjects found for Mexico. Nothing to delete.");
      console.log("\nPossible reasons:");
      console.log("  1. Data has already been deleted");
      console.log("  2. You're looking at a different Firebase project");
      console.log("  3. You're looking at the emulator instead of production");
      console.log(`\n  Current project: eduforge-d29d9`);
      return;
    }

    let totalDeleted = 0;

    for (const subjectDoc of subjectsSnapshot.docs) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🗑️  Processing subject: ${subjectDoc.id}`);
      console.log("=".repeat(60));

      // List all grade collections
      const gradeCollections = await subjectDoc.ref.listCollections();

      for (const gradeCol of gradeCollections) {
        console.log(`\n   📁 Deleting grade: ${gradeCol.id}`);

        const gradeSnapshot = await gradeCol.get();
        const docCount = gradeSnapshot.size;

        if (docCount === 0) {
          console.log(`      ⚪ No documents found`);
          continue;
        }

        console.log(`      Found ${docCount} documents to delete`);

        // Delete in batches
        const batches: FirebaseFirestore.WriteBatch[] = [];
        let currentBatch = db.batch();
        let count = 0;

        for (const doc of gradeSnapshot.docs) {
          currentBatch.delete(doc.ref);
          count++;

          if (count % 500 === 0) {
            batches.push(currentBatch);
            currentBatch = db.batch();
          }
        }

        if (count % 500 !== 0) {
          batches.push(currentBatch);
        }

        // Commit all batches
        for (let i = 0; i < batches.length; i++) {
          await batches[i].commit();
          console.log(`      ✓ Batch ${i + 1}/${batches.length} deleted`);
        }

        totalDeleted += docCount;
        console.log(
          `      ✅ Deleted ${docCount} documents from ${subjectDoc.id}/${gradeCol.id}`
        );
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 DELETION COMPLETE");
    console.log("=".repeat(60));
    console.log(`\nTotal documents deleted: ${totalDeleted}`);
    console.log(`\n✅ All Mexico subject mappings have been removed!`);
    console.log("\nNext steps:");
    console.log("  1. Verify in Firestore console that Mexico data is removed");
    console.log("  2. Import new Mexico subject mappings:");
    console.log(
      "     npm run migrate:subjects -- --country MX --subject all --grade grade_10_12"
    );
    console.log(
      "     npm run migrate:subjects -- --country MX --subject all --grade grade_7_9"
    );
    console.log(
      "     npm run migrate:subjects -- --country MX --subject all --grade grade_3_6\n"
    );
  } catch (error) {
    console.error("\n❌ Deletion failed:", error);
    throw error;
  }
}

// Run deletion
forceDeleteMexico()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
