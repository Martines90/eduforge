/**
 * Migration Script: Fix subscription structure
 *
 * Old structure:
 * {
 *   plan: "trial",
 *   status: "active",
 *   trialStartDate: Date,
 *   trialEndDate: Date
 * }
 *
 * New structure:
 * {
 *   tier: "trial",
 *   status: "active",
 *   startDate: Date,
 *   endDate: Date
 * }
 */

import { getFirestore } from "../config/firebase.config";
import { initializeFirebase } from "../config/firebase.config";

initializeFirebase();
const db = getFirestore();

async function migrateSubscriptionStructure() {
  console.log("🔄 Starting subscription structure migration...\n");

  const usersRef = db.collection("users");
  const snapshot = await usersRef.get();

  let migratedCount = 0;
  let skippedCount = 0;

  for (const doc of snapshot.docs) {
    const userData = doc.data();

    // Check if user has subscription with old structure (plan field)
    if (userData.subscription && userData.subscription.plan) {
      console.log(`📝 Migrating user: ${userData.email} (${doc.id})`);
      console.log(`   Old: plan="${userData.subscription.plan}"`);

      // Convert old structure to new structure
      const updatedSubscription: any = {
        tier: userData.subscription.plan,
        status: userData.subscription.status || "active",
      };

      // Map date fields
      if (userData.subscription.trialStartDate) {
        updatedSubscription.startDate = userData.subscription.trialStartDate;
      } else if (userData.subscription.startDate) {
        updatedSubscription.startDate = userData.subscription.startDate;
      }

      if (userData.subscription.trialEndDate) {
        updatedSubscription.endDate = userData.subscription.trialEndDate;
      } else if (userData.subscription.endDate) {
        updatedSubscription.endDate = userData.subscription.endDate;
      }

      // Preserve Stripe-related fields if they exist
      if (userData.subscription.stripeCustomerId) {
        updatedSubscription.stripeCustomerId =
          userData.subscription.stripeCustomerId;
      }
      if (userData.subscription.stripeSubscriptionId) {
        updatedSubscription.stripeSubscriptionId =
          userData.subscription.stripeSubscriptionId;
      }
      if (userData.subscription.stripePriceId) {
        updatedSubscription.stripePriceId = userData.subscription.stripePriceId;
      }

      // Update the document
      await doc.ref.update({
        subscription: updatedSubscription,
      });

      console.log(`   New: tier="${updatedSubscription.tier}"`);
      console.log(`   ✅ Migrated successfully\n`);
      migratedCount++;
    } else if (userData.subscription && userData.subscription.tier) {
      // Already using new structure
      skippedCount++;
    }
  }

  console.log("📊 Migration Summary:");
  console.log(`   Migrated: ${migratedCount}`);
  console.log(`   Skipped (already correct): ${skippedCount}`);
  console.log(`   Total users: ${snapshot.docs.length}`);
  console.log("\n✅ Migration completed!");
}

migrateSubscriptionStructure()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  });
