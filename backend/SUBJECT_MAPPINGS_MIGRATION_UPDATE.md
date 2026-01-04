# SubjectMappings Migration Update for Country-Based Structure

## Current Issue

The `migrate-subject-mappings.ts` script currently stores data in a flat structure:
```
subjectMappings/{docId}
```

## Required Change

Update to country-based structure:
```
countries/{countryCode}/subjectMappings/{docId}
```

## Updated Script

### Option 1: Single Country Migration

Update `src/scripts/migrate-subject-mappings.ts`:

```typescript
// Add country parameter to functions
async function insertNode(
  db: FirebaseFirestore.Firestore,
  node: JSONNode,
  subject: string,
  gradeLevel: string,
  parentId: string | null,
  parentPath: string,
  level: number,
  orderIndex: number,
  country: string  // <-- ADD THIS
): Promise<string> {
  // ... existing code ...

  // Change line 95:
  // OLD:
  // await db.collection('subjectMappings').doc(docId).set(mappingDoc);

  // NEW:
  await db.collection('countries').doc(country)
    .collection('subjectMappings').doc(docId).set(mappingDoc);

  // Update recursive calls to pass country
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
        i,
        country  // <-- PASS COUNTRY
      );
    }
  }

  return docId;
}

// Update importSubject function
async function importSubject(
  db: FirebaseFirestore.Firestore,
  subjectKey: string,
  subjectName: string,
  jsonData: JSONData,
  country: string  // <-- ADD THIS
): Promise<void> {
  // ... existing code ...

  // Change line 160:
  // OLD:
  // await db.collection('subjectMappings').doc(gradeDocId).set(gradeDoc);

  // NEW:
  await db.collection('countries').doc(country)
    .collection('subjectMappings').doc(gradeDocId).set(gradeDoc);

  // Update insertNode calls to pass country
  for (let i = 0; i < gradeData.length; i++) {
    await insertNode(
      db,
      gradeData[i],
      subjectKey,
      gradeLevel,
      gradeDocId,
      `${subjectKey}/${gradeLevel}`,
      2,
      i,
      country  // <-- PASS COUNTRY
    );
  }
}

// Update clearExistingMappings function
async function clearExistingMappings(
  db: FirebaseFirestore.Firestore,
  country: string,  // <-- ADD THIS
  subject?: string
): Promise<void> {
  console.log(`\n🗑️  Clearing existing subject mappings for ${country}...`);

  // OLD:
  // let query = db.collection('subjectMappings');

  // NEW:
  let query = db.collection('countries').doc(country).collection('subjectMappings');

  if (subject) {
    query = query.where('subject', '==', subject) as any;
  }

  // ... rest of the function ...
}

// Update main migrate function
async function migrate(options: {
  clear?: boolean;
  subject?: string;
  country?: string;  // <-- ADD THIS (default to 'HU')
} = {}): Promise<void> {
  try {
    const country = options.country || 'HU';  // Default to HU
    console.log(`\n🚀 Starting Subject Mappings Migration for ${country}`);

    // ... existing code ...

    // Update clearExistingMappings call
    if (options.clear) {
      await clearExistingMappings(db, country, options.subject);
    }

    // Update importSubject call
    for (const subjectKey of subjectsToImport) {
      // ... existing code ...
      await importSubject(db, subjectKey, metadata.name, jsonData, country);
    }
  }
}

// Update CLI parsing
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: { clear?: boolean; subject?: string; country?: string } = {};

  if (args.includes('--clear')) {
    options.clear = true;
  }

  const subjectIndex = args.indexOf('--subject');
  if (subjectIndex !== -1 && args[subjectIndex + 1]) {
    options.subject = args[subjectIndex + 1];
  }

  // NEW: Add country parsing
  const countryIndex = args.indexOf('--country');
  if (countryIndex !== -1 && args[countryIndex + 1]) {
    options.country = args[countryIndex + 1];
  }

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
```

### Option 2: Multi-Country Migration

Or create a wrapper script to migrate for all countries:

```typescript
// src/scripts/migrate-all-countries.ts
import { migrate } from './migrate-subject-mappings';

const COUNTRIES = ['HU', 'US'];

async function migrateAllCountries() {
  console.log('🌍 Migrating subject mappings for all countries...\n');

  for (const country of COUNTRIES) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 Migrating for ${country}`);
    console.log('='.repeat(60));

    await migrate({ country, clear: false });
  }

  console.log('\n✅ All countries migrated!');
}

if (require.main === module) {
  migrateAllCountries()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}
```

## Usage After Update

### Migrate for Hungary (HU):
```bash
cd /Users/martonhorvath/Documents/EduForger/app/backend
npm run migrate:subjects -- --country HU --clear
```

### Migrate for US:
```bash
npm run migrate:subjects -- --country US --clear
```

### Migrate for all countries:
```bash
npx ts-node src/scripts/migrate-all-countries.ts
```

## Backend API Updates Required

The backend also needs to query the country-based path:

### Before:
```typescript
// src/services/subject-mapping.service.ts
const snapshot = await db.collection('subjectMappings')
  .where('subject', '==', 'mathematics')
  .get();
```

### After:
```typescript
const snapshot = await db.collection('countries').doc(countryCode)
  .collection('subjectMappings')
  .where('subject', '==', 'mathematics')
  .get();
```

## Summary

1. ✅ **Source file**: `/app/backend/data/subject_mapping/hu_math_grade_9_12_purged.json`
2. ✅ **Migration script**: `/app/backend/src/scripts/migrate-subject-mappings.ts`
3. ⚠️ **Needs update**: Add `country` parameter to all functions
4. ⚠️ **Backend services**: Update all queries to use country-based paths

## Testing

After updating:
```bash
# 1. Test migration
npm run migrate:subjects -- --country HU --subject mathematics

# 2. Check Firestore Console
# Verify: countries/HU/subjectMappings/{docId} exists

# 3. Test API endpoints
curl http://localhost:3000/api/subject-mappings?country=HU
```
