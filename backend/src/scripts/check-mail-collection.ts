import { initializeFirebase, getFirestore } from "../config/firebase.config";

async function checkMailCollection() {
  // Initialize Firebase first
  initializeFirebase();

  const db = getFirestore();

  console.log("Checking mail collection...");

  const mailSnapshot = await db.collection("mail").orderBy("delivery.startTime", "desc").limit(5).get();

  console.log(`\nFound ${mailSnapshot.size} mail documents (showing last 5):\n`);

  mailSnapshot.forEach((doc) => {
    const data = doc.data();
    console.log("=====================================");
    console.log("Document ID:", doc.id);
    console.log("To:", data.to);
    console.log("Subject:", data.message?.subject);
    console.log("Delivery:", JSON.stringify(data.delivery, null, 2));
    console.log("Error:", data.error);
    console.log("=====================================\n");
  });

  // Also check if there are any mail docs without delivery info
  const pendingSnapshot = await db.collection("mail").where("delivery", "==", undefined).limit(5).get();

  console.log(`\nFound ${pendingSnapshot.size} pending mail documents (no delivery info yet):\n`);

  pendingSnapshot.forEach((doc) => {
    const data = doc.data();
    console.log("=====================================");
    console.log("Document ID:", doc.id);
    console.log("To:", data.to);
    console.log("Subject:", data.message?.subject);
    console.log("Full data:", JSON.stringify(data, null, 2));
    console.log("=====================================\n");
  });

  process.exit(0);
}

checkMailCollection().catch((error) => {
  console.error("Error checking mail collection:", error);
  process.exit(1);
});
