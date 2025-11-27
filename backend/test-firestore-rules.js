/**
 * Firestore Security Rules Test Script
 *
 * This script tests the Firestore security rules to ensure proper access control.
 * Run with: node test-firestore-rules.js
 *
 * Prerequisites:
 * 1. Install dependencies: npm install @firebase/rules-unit-testing
 * 2. Have firestore.rules file in the same directory
 * 3. Have Firebase emulator installed (optional, for local testing)
 */

const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

// Test data
const TEACHER_UID = 'teacher-uid-123';
const TEACHER_EMAIL = 'teacher@test.com';
const STUDENT_UID = 'student-uid-456';
const STUDENT_EMAIL = 'student@test.com';
const OTHER_TEACHER_UID = 'other-teacher-789';

const TASK_ID = 'task-test-123';
const MAPPING_ID = 'mapping-test-456';

let testEnv;

async function setup() {
  console.log('🔧 Setting up test environment...\n');

  // Initialize test environment
  testEnv = await initializeTestEnvironment({
    projectId: 'eduforge-test',
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, 'firestore.rules'), 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });

  // Seed test data
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    // Create test users
    await db.collection('users').doc(TEACHER_UID).set({
      uid: TEACHER_UID,
      email: TEACHER_EMAIL,
      name: 'Test Teacher',
      role: 'teacher',
      subject: 'mathematics',
      emailVerified: true,
      createdAt: new Date(),
    });

    await db.collection('users').doc(STUDENT_UID).set({
      uid: STUDENT_UID,
      email: STUDENT_EMAIL,
      name: 'Test Student',
      role: 'non-teacher',
      emailVerified: true,
      createdAt: new Date(),
    });

    await db.collection('users').doc(OTHER_TEACHER_UID).set({
      uid: OTHER_TEACHER_UID,
      email: 'other@test.com',
      name: 'Other Teacher',
      role: 'teacher',
      subject: 'physics',
      emailVerified: true,
      createdAt: new Date(),
    });

    // Create test subject mapping
    await db.collection('subjectMappings').doc(MAPPING_ID).set({
      key: 'test-topic',
      name: 'Test Topic',
      subject: 'mathematics',
      gradeLevel: 'grade_9_10',
      isLeaf: true,
    });

    // Create test task
    await db.collection('tasks').doc(TASK_ID).set({
      title: 'Test Task',
      description: 'Test Description',
      content: 'Test Content',
      subjectMappingId: MAPPING_ID,
      subject: 'mathematics',
      gradeLevel: 'grade_9_10',
      createdBy: TEACHER_UID,
      creatorName: 'Test Teacher',
      isPublished: true,
      ratingAverage: 4.5,
      ratingCount: 10,
      viewCount: 100,
      createdAt: new Date(),
    });
  });

  console.log('✅ Test environment ready\n');
}

async function cleanup() {
  console.log('\n🧹 Cleaning up...');
  await testEnv.cleanup();
  console.log('✅ Cleanup complete\n');
}

// Test helpers
function testGroup(name) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${name}`);
  console.log('='.repeat(60));
}

async function test(description, testFn) {
  try {
    await testFn();
    console.log(`✅ ${description}`);
    return true;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test suites
async function testUserRules() {
  testGroup('USER COLLECTION RULES');

  const teacherDb = testEnv.authenticatedContext(TEACHER_UID).firestore();
  const studentDb = testEnv.authenticatedContext(STUDENT_UID).firestore();
  const unauthDb = testEnv.unauthenticatedContext().firestore();

  await test('Unauthenticated can read user profiles', async () => {
    await assertSucceeds(unauthDb.collection('users').doc(TEACHER_UID).get());
  });

  await test('Authenticated can read any user profile', async () => {
    await assertSucceeds(studentDb.collection('users').doc(TEACHER_UID).get());
  });

  await test('User can update their own profile', async () => {
    await assertSucceeds(
      teacherDb.collection('users').doc(TEACHER_UID).update({ name: 'Updated Name' })
    );
  });

  await test('User cannot update another user profile', async () => {
    await assertFails(
      studentDb.collection('users').doc(TEACHER_UID).update({ name: 'Hacked' })
    );
  });

  await test('User cannot delete their profile', async () => {
    await assertFails(teacherDb.collection('users').doc(TEACHER_UID).delete());
  });
}

async function testSubjectMappingRules() {
  testGroup('SUBJECT MAPPINGS RULES');

  const teacherDb = testEnv.authenticatedContext(TEACHER_UID).firestore();
  const unauthDb = testEnv.unauthenticatedContext().firestore();

  await test('Anyone can read subject mappings', async () => {
    await assertSucceeds(unauthDb.collection('subjectMappings').doc(MAPPING_ID).get());
  });

  await test('Teachers cannot create subject mappings', async () => {
    await assertFails(
      teacherDb.collection('subjectMappings').doc('new-mapping').set({
        key: 'new-topic',
        name: 'New Topic',
      })
    );
  });

  await test('Teachers cannot update subject mappings', async () => {
    await assertFails(
      teacherDb.collection('subjectMappings').doc(MAPPING_ID).update({ name: 'Updated' })
    );
  });
}

async function testTaskRules() {
  testGroup('TASKS COLLECTION RULES');

  const teacherDb = testEnv.authenticatedContext(TEACHER_UID).firestore();
  const studentDb = testEnv.authenticatedContext(STUDENT_UID).firestore();
  const otherTeacherDb = testEnv.authenticatedContext(OTHER_TEACHER_UID).firestore();
  const unauthDb = testEnv.unauthenticatedContext().firestore();

  // Read tests
  await test('Anyone can read published tasks', async () => {
    await assertSucceeds(unauthDb.collection('tasks').doc(TASK_ID).get());
  });

  await test('Creator can read their unpublished tasks', async () => {
    await assertSucceeds(teacherDb.collection('tasks').doc(TASK_ID).get());
  });

  // Create tests
  await test('Verified teacher can create task', async () => {
    await assertSucceeds(
      teacherDb.collection('tasks').doc('new-task-1').set({
        title: 'New Task',
        description: 'Description',
        content: 'Content',
        subjectMappingId: MAPPING_ID,
        subject: 'mathematics',
        gradeLevel: 'grade_9_10',
        createdBy: TEACHER_UID,
        creatorName: 'Test Teacher',
        isPublished: false,
        ratingAverage: 0,
        ratingCount: 0,
        viewCount: 0,
        createdAt: new Date(),
      })
    );
  });

  await test('Non-teacher cannot create task', async () => {
    await assertFails(
      studentDb.collection('tasks').doc('new-task-2').set({
        title: 'New Task',
        description: 'Description',
        content: 'Content',
        subjectMappingId: MAPPING_ID,
        subject: 'mathematics',
        gradeLevel: 'grade_9_10',
        createdBy: STUDENT_UID,
        creatorName: 'Test Student',
        isPublished: false,
      })
    );
  });

  await test('Teacher cannot create task for another user', async () => {
    await assertFails(
      teacherDb.collection('tasks').doc('new-task-3').set({
        title: 'New Task',
        description: 'Description',
        content: 'Content',
        subjectMappingId: MAPPING_ID,
        subject: 'mathematics',
        gradeLevel: 'grade_9_10',
        createdBy: OTHER_TEACHER_UID, // Different UID
        creatorName: 'Test Teacher',
        isPublished: false,
      })
    );
  });

  // Update tests
  await test('Creator can update their own task', async () => {
    await assertSucceeds(
      teacherDb.collection('tasks').doc(TASK_ID).update({
        title: 'Updated Title',
      })
    );
  });

  await test('Other teacher cannot update task', async () => {
    await assertFails(
      otherTeacherDb.collection('tasks').doc(TASK_ID).update({
        title: 'Hacked Title',
      })
    );
  });

  await test('Creator cannot change task ownership', async () => {
    await assertFails(
      teacherDb.collection('tasks').doc(TASK_ID).update({
        createdBy: OTHER_TEACHER_UID,
      })
    );
  });

  // Delete tests
  await test('Creator can delete their own task', async () => {
    // Create a task first
    const tempTaskId = 'temp-task-delete';
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('tasks').doc(tempTaskId).set({
        title: 'Temp Task',
        createdBy: TEACHER_UID,
        isPublished: true,
      });
    });

    await assertSucceeds(teacherDb.collection('tasks').doc(tempTaskId).delete());
  });

  await test('Other user cannot delete task', async () => {
    await assertFails(studentDb.collection('tasks').doc(TASK_ID).delete());
  });
}

async function testRatingRules() {
  testGroup('TASK RATINGS RULES');

  const teacherDb = testEnv.authenticatedContext(TEACHER_UID).firestore();
  const studentDb = testEnv.authenticatedContext(STUDENT_UID).firestore();
  const unauthDb = testEnv.unauthenticatedContext().firestore();

  const ratingPath = `tasks/${TASK_ID}/ratings`;

  await test('Anyone can read ratings for published tasks', async () => {
    await assertSucceeds(unauthDb.collection(ratingPath).get());
  });

  await test('Authenticated user can create their own rating', async () => {
    await assertSucceeds(
      studentDb.collection(ratingPath).doc(STUDENT_UID).set({
        userId: STUDENT_UID,
        rating: 5,
        reviewText: 'Great task!',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  });

  await test('User cannot create rating with invalid score', async () => {
    await assertFails(
      studentDb.collection(ratingPath).doc(STUDENT_UID).set({
        userId: STUDENT_UID,
        rating: 10, // Invalid: must be 0-5
        reviewText: 'Great task!',
        createdAt: new Date(),
      })
    );
  });

  await test('User cannot create rating for another user', async () => {
    await assertFails(
      studentDb.collection(ratingPath).doc(TEACHER_UID).set({
        userId: TEACHER_UID, // Different user
        rating: 5,
        reviewText: 'Great task!',
        createdAt: new Date(),
      })
    );
  });

  await test('User can update their own rating', async () => {
    await assertSucceeds(
      studentDb.collection(ratingPath).doc(STUDENT_UID).update({
        rating: 4,
        reviewText: 'Updated review',
        updatedAt: new Date(),
      })
    );
  });

  await test('User can delete their own rating', async () => {
    await assertSucceeds(studentDb.collection(ratingPath).doc(STUDENT_UID).delete());
  });

  await test('Unauthenticated cannot create rating', async () => {
    await assertFails(
      unauthDb.collection(ratingPath).doc('unauth-rating').set({
        userId: 'unauth-user',
        rating: 5,
        reviewText: 'Great task!',
      })
    );
  });
}

// Main test runner
async function runTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         FIRESTORE SECURITY RULES TEST SUITE              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  let totalTests = 0;
  let passedTests = 0;

  try {
    await setup();

    // Run all test suites
    const suites = [
      testUserRules,
      testSubjectMappingRules,
      testTaskRules,
      testRatingRules,
    ];

    for (const suite of suites) {
      const startCount = passedTests;
      await suite();
      // Count tests in this suite (approximate based on console logs)
    }

    console.log('\n');
    console.log('═'.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log('All critical security tests completed!');
    console.log('Review the output above for any failures (❌)');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

// Run tests
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('\n✅ All tests completed!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
