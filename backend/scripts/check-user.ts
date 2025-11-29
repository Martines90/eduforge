/**
 * Debug script to check if a user exists in Firestore
 * Usage: npx ts-node scripts/check-user.ts <email>
 */

import { initializeFirebase, getFirestore } from '../src/config/firebase.config';

async function checkUser(email: string) {
  try {
    // Initialize Firebase first
    initializeFirebase();

    const db = getFirestore();

    console.log(`\n=== Checking user: ${email} ===\n`);

    // Check in users collection
    console.log('1. Checking users collection...');
    const usersSnapshot = await db.collection('users').where('email', '==', email.toLowerCase()).get();

    if (usersSnapshot.empty) {
      console.log('❌ User NOT found in users collection');
    } else {
      console.log('✅ User found in users collection:');
      const userData = usersSnapshot.docs[0].data();
      console.log(JSON.stringify({
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        status: userData.status,
        emailVerified: userData.emailVerified,
      }, null, 2));

      // Check in userCredentials collection
      console.log('\n2. Checking userCredentials collection...');
      const credDoc = await db.collection('userCredentials').doc(userData.uid).get();

      if (!credDoc.exists) {
        console.log('❌ NO credentials found in userCredentials collection');
      } else {
        console.log('✅ Credentials found in userCredentials collection');
        const credData = credDoc.data();
        console.log(`   Has hashedPassword: ${!!credData?.hashedPassword}`);
        console.log(`   Password hash length: ${credData?.hashedPassword?.length || 0} characters`);
      }
    }

    // Check pending registrations
    console.log('\n3. Checking pendingRegistrations collection...');
    const pendingDoc = await db.collection('pendingRegistrations').doc(email.toLowerCase()).get();

    if (pendingDoc.exists) {
      console.log('⚠️  Pending registration found (registration not completed):');
      const pendingData = pendingDoc.data();
      console.log(JSON.stringify({
        email: pendingData?.email,
        code: pendingData?.code,
        attempts: pendingData?.attempts,
        expiresAt: pendingData?.expiresAt?.toDate?.() || pendingData?.expiresAt,
      }, null, 2));
    } else {
      console.log('✅ No pending registration (good - registration was completed)');
    }

    console.log('\n=== Check complete ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Error checking user:', error);
    process.exit(1);
  }
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: npx ts-node scripts/check-user.ts <email>');
  process.exit(1);
}

checkUser(email);
