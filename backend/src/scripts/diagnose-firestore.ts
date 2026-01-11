/**
 * Diagnostic Script: Check Firestore Structure
 *
 * This script inspects the actual Firestore structure to understand
 * where subject mapping data is stored.
 */

import { initializeFirebase, getFirestore } from "../config/firebase.config";

async function diagnose() {
  try {
    console.log("\n🔍 Diagnosing Firestore Structure\n");
    console.log("=".repeat(60));

    initializeFirebase();
    const db = getFirestore();

    // Check countries collection
    console.log("\n1️⃣ Checking 'countries' collection...");
    const countriesSnapshot = await db.collection("countries").get();
    console.log(
      `   Found ${countriesSnapshot.size} countries: ${countriesSnapshot.docs.map((d) => d.id).join(", ")}`
    );

    // For each country, check structure
    for (const countryDoc of countriesSnapshot.docs) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🌍 Country: ${countryDoc.id}`);
      console.log("=".repeat(60));

      // Check what collections exist under this country
      const collections = await countryDoc.ref.listCollections();
      console.log(`\n   Collections under countries/${countryDoc.id}:`);
      console.log(`   ${collections.map((c) => c.id).join(", ")}`);

      // Check subjectMappings specifically
      const subjectMappingsSnapshot = await countryDoc.ref
        .collection("subjectMappings")
        .get();

      console.log(`\n   📚 subjectMappings collection:`);
      console.log(`      Documents: ${subjectMappingsSnapshot.size}`);

      if (subjectMappingsSnapshot.size > 0) {
        console.log(
          `      Subject docs: ${subjectMappingsSnapshot.docs.map((d) => d.id).join(", ")}`
        );

        // For each subject, check grade subcollections
        for (const subjectDoc of subjectMappingsSnapshot.docs) {
          console.log(`\n      📖 Subject: ${subjectDoc.id}`);

          // List subcollections (grades)
          const gradeCollections = await subjectDoc.ref.listCollections();
          console.log(
            `         Grade collections: ${gradeCollections.map((c) => c.id).join(", ")}`
          );

          // Count documents in each grade
          for (const gradeCol of gradeCollections) {
            const gradeSnapshot = await gradeCol.get();
            console.log(
              `         - ${gradeCol.id}: ${gradeSnapshot.size} documents`
            );

            // Show first 3 document IDs as sample
            const sampleDocs = gradeSnapshot.docs.slice(0, 3).map((d) => d.id);
            if (sampleDocs.length > 0) {
              console.log(`           Sample docs: ${sampleDocs.join(", ")}`);
            }
          }
        }
      } else {
        console.log(`      ⚠️  No subject documents found`);
      }

      // Check if there are any other collections that might contain subject data
      for (const collection of collections) {
        if (collection.id !== "subjectMappings") {
          const snapshot = await collection.get();
          console.log(
            `\n   📁 ${collection.id} collection: ${snapshot.size} documents`
          );
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Diagnostic complete!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Diagnostic failed:", error);
    throw error;
  }
}

// Run diagnostic
diagnose()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
