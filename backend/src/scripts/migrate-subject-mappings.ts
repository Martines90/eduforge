/**
 * Migration Script: Import Subject Mappings to Firestore
 *
 * This script reads the curriculum JSON files and imports them into Firestore
 * as a hierarchical structure suitable for the task tree view.
 *
 * Usage:
 *   npm run migrate:subjects
 *
 * Or directly:
 *   ts-node src/scripts/migrate-subject-mappings.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { initializeFirebase, getFirestore } from '../config/firebase.config';
import { SubjectMappingDocument } from '../types/task.types';
import { Timestamp } from 'firebase-admin/firestore';

interface JSONNode {
  key: string;
  name: string;
  short_description?: string;
  sub_topics?: JSONNode[];
  'example_tasks (COMPLETED)'?: any[];
}

interface JSONData {
  grade_9_10?: JSONNode[];
  grade_11_12?: JSONNode[];
}

/**
 * Subject metadata
 */
const SUBJECT_METADATA: Record<string, { name: string; file: string }> = {
  mathematics: {
    name: 'Mathematics',
    file: 'hu_math_grade_9_12_purged.json',
  },
  // Add other subjects as they become available
  // physics: {
  //   name: 'Physics',
  //   file: 'hu_physics_grade_9_12_purged.json',
  // },
};

/**
 * Generate document ID from path components
 */
function generateDocId(subject: string, gradeLevel: string, ...pathParts: string[]): string {
  const parts = [subject, gradeLevel, ...pathParts].filter(Boolean);
  return parts.join('_').replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Recursively insert nodes into Firestore
 */
async function insertNode(
  db: FirebaseFirestore.Firestore,
  node: JSONNode,
  subject: string,
  gradeLevel: string,
  parentId: string | null,
  parentPath: string,
  level: number,
  orderIndex: number
): Promise<string> {
  const currentPath = parentPath ? `${parentPath}/${node.key}` : node.key;
  const docId = generateDocId(subject, gradeLevel, ...currentPath.split('/'));

  // Check if node has children
  const hasSubTopics = node.sub_topics && node.sub_topics.length > 0;
  const isLeaf = !hasSubTopics;

  const mappingDoc: SubjectMappingDocument = {
    key: node.key,
    name: node.name,
    shortDescription: node.short_description,
    level,
    parentId,
    path: currentPath,
    subject,
    gradeLevel,
    orderIndex,
    isLeaf,
    taskCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  console.log(`  ${'  '.repeat(level)}[${level}] ${node.name} (${currentPath})`);

  // Insert document
  await db.collection('subjectMappings').doc(docId).set(mappingDoc);

  // Recursively insert children
  if (hasSubTopics) {
    for (let i = 0; i < node.sub_topics!.length; i++) {
      await insertNode(
        db,
        node.sub_topics![i],
        subject,
        gradeLevel,
        docId,
        currentPath,
        level + 1,
        i
      );
    }
  }

  return docId;
}

/**
 * Import a single subject's data
 */
async function importSubject(
  db: FirebaseFirestore.Firestore,
  subjectKey: string,
  subjectName: string,
  jsonData: JSONData
): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Importing ${subjectName} (${subjectKey})`);
  console.log('='.repeat(60));

  const grades = ['grade_9_10', 'grade_11_12'] as const;

  for (const gradeLevel of grades) {
    const gradeData = jsonData[gradeLevel];
    if (!gradeData || gradeData.length === 0) {
      console.log(`\n⚠️  No data found for ${gradeLevel}`);
      continue;
    }

    console.log(`\n📚 Processing ${gradeLevel.replace('_', '-')} (${gradeData.length} main topics)`);

    // Create root node for this grade
    const gradeDocId = generateDocId(subjectKey, gradeLevel, 'root');
    const gradeDisplayName = gradeLevel === 'grade_9_10' ? 'Grade 9-10' : 'Grade 11-12';

    const gradeDoc: SubjectMappingDocument = {
      key: gradeLevel,
      name: gradeDisplayName,
      shortDescription: `${subjectName} curriculum for ${gradeDisplayName}`,
      level: 1,
      parentId: null,
      path: `${subjectKey}/${gradeLevel}`,
      subject: subjectKey,
      gradeLevel,
      orderIndex: 0,
      isLeaf: false,
      taskCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await db.collection('subjectMappings').doc(gradeDocId).set(gradeDoc);
    console.log(`  [1] ${gradeDisplayName}`);

    // Insert all main topics
    for (let i = 0; i < gradeData.length; i++) {
      await insertNode(
        db,
        gradeData[i],
        subjectKey,
        gradeLevel,
        gradeDocId,
        `${subjectKey}/${gradeLevel}`,
        2,
        i
      );
    }
  }

  console.log(`\n✅ ${subjectName} import complete!`);
}

/**
 * Clear existing subject mappings (optional)
 */
async function clearExistingMappings(
  db: FirebaseFirestore.Firestore,
  subject?: string
): Promise<void> {
  console.log('\n🗑️  Clearing existing subject mappings...');

  let query = db.collection('subjectMappings');
  if (subject) {
    query = query.where('subject', '==', subject) as any;
  }

  const snapshot = await query.get();
  console.log(`   Found ${snapshot.size} documents to delete`);

  const batch = db.batch();
  let count = 0;

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    count++;

    // Firestore batch limit is 500
    if (count >= 500) {
      throw new Error('Too many documents to delete in one batch. Run multiple times or implement chunked deletion.');
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`   ✅ Deleted ${count} documents`);
  } else {
    console.log('   No documents to delete');
  }
}

/**
 * Main migration function
 */
async function migrate(options: { clear?: boolean; subject?: string } = {}): Promise<void> {
  try {
    console.log('\n🚀 Starting Subject Mappings Migration');
    console.log('=====================================\n');

    // Initialize Firebase
    console.log('Initializing Firebase...');
    initializeFirebase();

    const db = getFirestore();

    // Clear existing data if requested
    if (options.clear) {
      await clearExistingMappings(db, options.subject);
    }

    // Determine which subjects to import
    const subjectsToImport = options.subject
      ? [options.subject]
      : Object.keys(SUBJECT_METADATA);

    // Import each subject
    for (const subjectKey of subjectsToImport) {
      const metadata = SUBJECT_METADATA[subjectKey];
      if (!metadata) {
        console.warn(`⚠️  Unknown subject: ${subjectKey}`);
        continue;
      }

      // Read JSON file
      const jsonPath = path.join(
        __dirname,
        '../data/subject_mapping',
        metadata.file
      );

      if (!fs.existsSync(jsonPath)) {
        console.warn(`⚠️  File not found: ${jsonPath}`);
        continue;
      }

      const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
      const jsonData: JSONData = JSON.parse(jsonContent);

      // Import to Firestore
      await importSubject(db, subjectKey, metadata.name, jsonData);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Migration Complete!');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('  1. Check Firestore console to verify data');
    console.log('  2. Create some test tasks');
    console.log('  3. Test the API endpoints\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

/**
 * CLI execution
 */
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: { clear?: boolean; subject?: string } = {};

  if (args.includes('--clear')) {
    options.clear = true;
  }

  const subjectIndex = args.indexOf('--subject');
  if (subjectIndex !== -1 && args[subjectIndex + 1]) {
    options.subject = args[subjectIndex + 1];
  }

  // Run migration
  migrate(options)
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

export { migrate };
