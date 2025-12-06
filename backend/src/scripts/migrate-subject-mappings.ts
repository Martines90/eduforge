/**
 * Migration Script: Import Subject Mappings to Firestore (Country-Based)
 *
 * This script reads curriculum JSON files and imports them into Firestore
 * using a country-based hierarchical structure.
 *
 * Structure: countries/{country}/subjectMappings/{docId}
 *
 * Usage:
 *   npm run migrate:subjects -- --country HU --subject mathematics
 *   npm run migrate:subjects -- --country US --subject mathematics --clear
 *   npm run migrate:subjects -- --all  # Migrate all countries and subjects
 *
 * Or directly:
 *   ts-node src/scripts/migrate-subject-mappings.ts --country HU --subject mathematics
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

interface SubjectConfig {
  name: string;
  file: string;
}

interface CountryConfig {
  name: string;
  subjects: Record<string, SubjectConfig>;
}

interface MappingConfig {
  countries: Record<string, CountryConfig>;
}

/**
 * Load configuration from JSON file
 */
function loadConfig(): MappingConfig {
  const configPath = path.join(__dirname, '../config/subject-mappings.config.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const configContent = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(configContent) as MappingConfig;
}

/**
 * Generate document ID from path components
 */
function generateDocId(subject: string, gradeLevel: string, ...pathParts: string[]): string {
  const parts = [subject, gradeLevel, ...pathParts].filter(Boolean);
  return parts.join('_').replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Recursively insert nodes into Firestore (country-based)
 */
async function insertNode(
  db: FirebaseFirestore.Firestore,
  node: JSONNode,
  country: string,
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

  // Insert document into country-based path
  await db.collection('countries').doc(country)
    .collection('subjectMappings').doc(docId).set(mappingDoc);

  // Recursively insert children
  if (hasSubTopics) {
    for (let i = 0; i < node.sub_topics!.length; i++) {
      await insertNode(
        db,
        node.sub_topics![i],
        country,
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
 * Import a single subject's data for a specific country
 */
async function importSubject(
  db: FirebaseFirestore.Firestore,
  country: string,
  subjectKey: string,
  subjectName: string,
  jsonData: JSONData
): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Importing ${subjectName} (${subjectKey}) for ${country}`);
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

    // Insert grade doc into country-based path
    await db.collection('countries').doc(country)
      .collection('subjectMappings').doc(gradeDocId).set(gradeDoc);
    console.log(`  [1] ${gradeDisplayName}`);

    // Insert all main topics
    for (let i = 0; i < gradeData.length; i++) {
      await insertNode(
        db,
        gradeData[i],
        country,
        subjectKey,
        gradeLevel,
        gradeDocId,
        `${subjectKey}/${gradeLevel}`,
        2,
        i
      );
    }
  }

  console.log(`\n✅ ${subjectName} import complete for ${country}!`);
}

/**
 * Clear existing subject mappings for a specific country (optional)
 */
async function clearExistingMappings(
  db: FirebaseFirestore.Firestore,
  country: string,
  subject?: string
): Promise<void> {
  console.log(`\n🗑️  Clearing existing subject mappings for ${country}...`);

  let query = db.collection('countries').doc(country).collection('subjectMappings');

  if (subject) {
    query = query.where('subject', '==', subject) as any;
  }

  const snapshot = await query.get();
  console.log(`   Found ${snapshot.size} documents to delete`);

  if (snapshot.size === 0) {
    console.log('   No documents to delete');
    return;
  }

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
    }
  });

  // Add remaining operations
  if (count % 500 !== 0) {
    batches.push(currentBatch);
  }

  // Commit all batches
  for (let i = 0; i < batches.length; i++) {
    await batches[i].commit();
    console.log(`   Batch ${i + 1}/${batches.length} committed`);
  }

  console.log(`   ✅ Deleted ${count} documents`);
}

/**
 * Get file path for a specific country and subject
 */
function getDataFilePath(country: string, subject: string, fileName: string): string {
  // Try new structure first: src/data/mappings/{country}/{fileName}
  const newPath = path.join(__dirname, '../data/mappings', country.toLowerCase(), fileName);
  if (fs.existsSync(newPath)) {
    return newPath;
  }

  // Fallback to old structure: src/data/subject_mapping/{fileName}
  const oldPath = path.join(__dirname, '../data/subject_mapping', fileName);
  if (fs.existsSync(oldPath)) {
    console.log(`⚠️  Using legacy path for ${country}/${subject}: ${oldPath}`);
    return oldPath;
  }

  throw new Error(`Data file not found: ${newPath} or ${oldPath}`);
}

/**
 * Main migration function
 */
async function migrate(options: {
  clear?: boolean;
  country?: string;
  subject?: string;
  all?: boolean;
} = {}): Promise<void> {
  try {
    console.log('\n🚀 Starting Subject Mappings Migration (Country-Based)');
    console.log('=====================================================\n');

    // Load configuration
    const config = loadConfig();

    // Initialize Firebase
    console.log('Initializing Firebase...');
    initializeFirebase();
    const db = getFirestore();

    // Determine what to migrate
    let countriesToMigrate: string[];

    if (options.all) {
      // Migrate all countries
      countriesToMigrate = Object.keys(config.countries);
      console.log(`\n📍 Migrating ALL countries: ${countriesToMigrate.join(', ')}`);
    } else if (options.country) {
      // Migrate specific country
      const countryCode = options.country.toUpperCase();
      if (!config.countries[countryCode]) {
        throw new Error(`Unknown country: ${countryCode}. Available: ${Object.keys(config.countries).join(', ')}`);
      }
      countriesToMigrate = [countryCode];
    } else {
      throw new Error('Please specify --country or --all');
    }

    // Process each country
    for (const countryCode of countriesToMigrate) {
      const countryConfig = config.countries[countryCode];

      console.log(`\n${'█'.repeat(60)}`);
      console.log(`🌍 Processing ${countryConfig.name} (${countryCode})`);
      console.log('█'.repeat(60));

      // Clear existing data if requested
      if (options.clear) {
        await clearExistingMappings(db, countryCode, options.subject);
      }

      // Determine which subjects to import
      const subjectsToImport = options.subject
        ? [options.subject]
        : Object.keys(countryConfig.subjects);

      // Import each subject
      for (const subjectKey of subjectsToImport) {
        const subjectConfig = countryConfig.subjects[subjectKey];

        if (!subjectConfig) {
          console.warn(`⚠️  Subject '${subjectKey}' not configured for ${countryCode}`);
          continue;
        }

        // Get file path
        const jsonPath = getDataFilePath(countryCode, subjectKey, subjectConfig.file);
        console.log(`📁 Reading: ${jsonPath}`);

        // Read and parse JSON
        const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
        const jsonData: JSONData = JSON.parse(jsonContent);

        // Import to Firestore
        await importSubject(db, countryCode, subjectKey, subjectConfig.name, jsonData);
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Migration Complete!');
    console.log('='.repeat(60));
    console.log('\nMigrated:');
    console.log(`  Countries: ${countriesToMigrate.join(', ')}`);
    if (options.subject) {
      console.log(`  Subject: ${options.subject}`);
    } else {
      console.log(`  Subjects: All configured subjects`);
    }
    console.log('\nFirestore structure:');
    countriesToMigrate.forEach(country => {
      console.log(`  countries/${country}/subjectMappings/{docId}`);
    });
    console.log('\nNext steps:');
    console.log('  1. Check Firestore console to verify data');
    console.log('  2. Test API endpoints');
    console.log('  3. Create some test tasks\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Show usage help
 */
function showHelp(): void {
  console.log(`
📚 Subject Mappings Migration Script

Usage:
  npm run migrate:subjects -- [options]

Options:
  --country <code>    Country code (HU, US, MX, etc.)
  --subject <name>    Subject name (mathematics, physics, etc.)
  --clear             Clear existing mappings before import
  --all               Migrate all countries and subjects
  --help              Show this help message

Examples:
  # Migrate mathematics for Hungary
  npm run migrate:subjects -- --country HU --subject mathematics

  # Migrate all subjects for US, clearing existing data
  npm run migrate:subjects -- --country US --clear

  # Migrate all countries and subjects
  npm run migrate:subjects -- --all

  # Migrate specific subject for all countries
  npm run migrate:subjects -- --all --subject mathematics

Configuration:
  Edit src/config/subject-mappings.config.json to add countries/subjects

Data Files:
  Place JSON files in: src/data/mappings/{country}/{filename}
  Example: src/data/mappings/hu/hu_mathematics_grade_9_12.json
`);
}

/**
 * CLI execution
 */
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);

  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const options: {
    clear?: boolean;
    country?: string;
    subject?: string;
    all?: boolean;
  } = {};

  if (args.includes('--clear')) {
    options.clear = true;
  }

  if (args.includes('--all')) {
    options.all = true;
  }

  const countryIndex = args.indexOf('--country');
  if (countryIndex !== -1 && args[countryIndex + 1]) {
    options.country = args[countryIndex + 1];
  }

  const subjectIndex = args.indexOf('--subject');
  if (subjectIndex !== -1 && args[subjectIndex + 1]) {
    options.subject = args[subjectIndex + 1];
  }

  // Validate
  if (!options.country && !options.all) {
    console.error('\n❌ Error: Please specify --country or --all\n');
    showHelp();
    process.exit(1);
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
