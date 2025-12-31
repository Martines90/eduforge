/**
 * Cleanup Script: Remove Old Subject Mappings Structure
 *
 * This script removes the old subject mappings that were stored at the root level
 * (before the country-based hierarchy was implemented).
 *
 * Old structure: subjectMappings/{docId}
 * New structure: countries/{country}/subjectMappings/{docId}
 *
 * Usage:
 *   npx ts-node src/scripts/cleanup-old-mappings.ts
 */

import { initializeFirebase, getFirestore } from "../config/firebase.config";

/**
 * Delete all documents from the old subjectMappings collection
 */
async function cleanupOldMappings(): Promise<void> {
  try {
    console.log("\n🧹 Starting cleanup of old subject mappings...");
    console.log("=====================================================\n");

    // Initialize Firebase
    console.log("Initializing Firebase...");
    initializeFirebase();
    const db = getFirestore();

    // Check if old collection exists
    const oldCollectionRef = db.collection("subjectMappings");
    const snapshot = await oldCollectionRef.get();

    console.log(
      `📊 Found ${snapshot.size} documents in old 'subjectMappings' collection`
    );

    if (snapshot.size === 0) {
      console.log("\n✅ No old documents found. Database is already clean!");
      return;
    }

    // Ask for confirmation (commented out for automated cleanup)
    console.log("\n⚠️  This will delete all documents from the old structure.");
    console.log("    Old path: subjectMappings/{docId}");
    console.log("    Documents to delete:", snapshot.size);

    // Delete in batches (Firestore limit is 500 per batch)
    const batches: FirebaseFirestore.WriteBatch[] = [];
    let currentBatch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      currentBatch.delete(doc.ref);
      count++;

      // Create new batch every 500 operations
      if (count % 500 === 0) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        console.log(`   Prepared batch ${batches.length} (${count} documents)`);
      }
    });

    // Add remaining operations
    if (count % 500 !== 0) {
      batches.push(currentBatch);
    }

    console.log(
      `\n🗑️  Deleting ${count} documents in ${batches.length} batch(es)...`
    );

    // Commit all batches
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`   ✓ Batch ${i + 1}/${batches.length} committed`);
    }

    console.log(
      `\n✅ Successfully deleted ${count} documents from old structure`
    );
    console.log("\n📝 Summary:");
    console.log(`   Deleted: ${count} documents`);
    console.log("   Collection: subjectMappings (old structure)");
    console.log(
      "\n💡 Next step: Run the migration script to populate the new structure"
    );
    console.log("   npm run migrate:subjects -- --all --clear\n");
  } catch (error) {
    console.error("\n❌ Cleanup failed:", error);
    throw error;
  }
}

/**
 * CLI execution
 */
if (require.main === module) {
  cleanupOldMappings()
    .then(() => {
      console.log("✅ Cleanup completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Cleanup failed:", error);
      process.exit(1);
    });
}

export { cleanupOldMappings };
