/**
 * Debug script to list all users in Firestore
 * Usage: npx ts-node scripts/list-users.ts
 */

import { initializeFirebase, getFirestore } from '../src/config/firebase.config';

async function listUsers() {
  try {
    // Initialize Firebase first
    initializeFirebase();

    const db = getFirestore();

    console.log('\n=== Listing all users ===\n');

    const usersSnapshot = await db.collection('users').get();

    if (usersSnapshot.empty) {
      console.log('No users found in database');
    } else {
      console.log(`Found ${usersSnapshot.size} user(s):\n`);

      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        console.log(`📧 ${userData.email}`);
        console.log(`   UID: ${userData.uid}`);
        console.log(`   Name: ${userData.name}`);
        console.log(`   Role: ${userData.role}`);
        console.log(`   Status: ${userData.status}`);
        console.log(`   Email Verified: ${userData.emailVerified}`);

        // Check if credentials exist
        const credDoc = await db.collection('userCredentials').doc(userData.uid).get();
        console.log(`   Has Credentials: ${credDoc.exists ? '✅' : '❌'}`);
        console.log('');
      }
    }

    console.log('=== List complete ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }
}

listUsers();
