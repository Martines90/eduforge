# Shared Types

This directory contains the **single source of truth** for all database schemas and shared types used across the EduForge application.

## 📁 Structure

```
shared/types/
├── database.types.ts    # Complete Firestore database schema
├── index.ts            # Exports all types
└── README.md           # This file
```

## 🎯 Purpose

Having shared types ensures:
- ✅ **Type safety** between frontend and backend
- ✅ **Single source of truth** for database structure
- ✅ **Easy refactoring** - change once, update everywhere
- ✅ **Documentation** - understand the entire data model at a glance
- ✅ **Prevents drift** - frontend and backend stay in sync

## 📖 Usage

### Backend
```typescript
import { Test, TestTask, User } from '../../../shared/types';

export async function createTest(data: CreateTestRequest): Promise<Test> {
  // TypeScript knows exactly what fields Test has
}
```

### Frontend
```typescript
import { Test, PublishedTest, User } from '@shared/types';

export async function fetchTestById(testId: string): Promise<Test> {
  // Same types as backend!
}
```

## 🔄 Updating

When you add/modify database fields:
1. Update `database.types.ts`
2. TypeScript will catch any issues in frontend/backend
3. No need to update types in multiple places

## 📊 Database Structure Overview

See `database.types.ts` for the complete visual tree structure at the bottom of the file.

### Key Collections:
- `/users` - User profiles
- `/tasks` - Global task library
- `/countries/{country}/tests` - Country-specific tests
- `/countries/{country}/published_tests` - Published test snapshots
- `/countries/{country}/subjectMappings` - Curriculum structure per country

## 🔗 Path Helpers

Use the `DB_PATHS` constant for type-safe document paths:

```typescript
import { DB_PATHS } from '@shared/types';

const testPath = DB_PATHS.test('HU', 'test123');
// Returns: "/countries/HU/tests/test123"
```

## ⚠️ Important Notes

- **Never edit backend/frontend type files directly** - always update shared types first
- **Keep this updated** - when adding new collections or fields, document them here
- **Timestamp type** - Use the exported `Timestamp` type for Firestore timestamps
- **Collections** - Use `Collection<T>` helper type for Firestore collections

## 📝 Maintenance

Last Updated: 2026-01-02

When updating:
- Increment the date in this README
- Add a comment in `database.types.ts` explaining the change
- Test that both frontend and backend compile successfully
