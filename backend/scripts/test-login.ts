/**
 * Debug script to test login with a specific email and password
 * Usage: npx ts-node scripts/test-login.ts <email> <password>
 */

import * as bcrypt from 'bcrypt';
import { initializeFirebase, getFirestore } from '../src/config/firebase.config';

async function testLogin(email: string, password: string) {
  try {
    // Initialize Firebase first
    initializeFirebase();

    const db = getFirestore();

    console.log(`\n=== Testing login for: ${email} ===\n`);

    // Get user by email
    console.log('1. Looking up user in database...');
    const userSnapshot = await db.collection('users').where('email', '==', email.toLowerCase()).get();

    if (userSnapshot.empty) {
      console.log('❌ User NOT found in users collection');
      console.log('\n=== Login would FAIL: User not found ===\n');
      process.exit(1);
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();
    console.log(`✅ User found with UID: ${user.uid}`);

    // Check status
    console.log(`\n2. Checking user status...`);
    if (user.status === 'banned') {
      console.log('❌ User is BANNED');
      console.log('\n=== Login would FAIL: Account banned ===\n');
      process.exit(1);
    }
    console.log(`✅ User status: ${user.status}`);

    // Get credentials
    console.log(`\n3. Looking up credentials...`);
    const credDoc = await db.collection('userCredentials').doc(user.uid).get();

    if (!credDoc.exists) {
      console.log('❌ NO credentials found in userCredentials collection');
      console.log('\n=== Login would FAIL: No credentials ===\n');
      process.exit(1);
    }

    const { hashedPassword } = credDoc.data() as { hashedPassword: string };
    console.log(`✅ Found password hash (${hashedPassword.length} characters)`);

    // Test password
    console.log(`\n4. Testing password...`);
    console.log(`   Password to test: "${password}"`);
    console.log(`   Password length: ${password.length}`);

    const isValidPassword = await bcrypt.compare(password, hashedPassword);

    if (isValidPassword) {
      console.log('✅ Password is CORRECT');
      console.log('\n=== Login would SUCCEED ===\n');
      process.exit(0);
    } else {
      console.log('❌ Password is INCORRECT');
      console.log('\n=== Login would FAIL: Invalid password ===\n');
      console.log('Debug info:');
      console.log(`   - Stored hash: ${hashedPassword.substring(0, 20)}...`);
      console.log(`   - Hash algorithm: ${hashedPassword.substring(0, 4)}`);
      console.log(`\nPossible issues:`);
      console.log(`   - Password entered incorrectly`);
      console.log(`   - Password was changed after registration`);
      console.log(`   - Hash was corrupted during storage`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error testing login:', error);
    process.exit(1);
  }
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: npx ts-node scripts/test-login.ts <email> <password>');
  process.exit(1);
}

testLogin(email, password);
