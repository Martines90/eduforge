# Firestore Database Structure

## Overview

The EduForge database uses **country code as the first level** of organization. This approach provides:

- ✅ Clear data segmentation by region
- ✅ Simple country-specific queries
- ✅ Easier compliance with data residency requirements
- ✅ Future-ready for multi-region deployments
- ✅ Maintains single schema across all countries

## Database Structure

```
countries/
  {countryCode}/          # "US", "HU", etc.
    users/
      {userId}/
        - uid: string
        - email: string
        - name: string
        - role: "teacher" | "non-teacher"
        - subject?: string
        - country: string
        - emailVerified: boolean
        - createdAt: timestamp
        - updatedAt: timestamp

    tasks/
      {taskId}/
        - id: string
        - title: string
        - description: string
        - content:
            - description: string
            - solution: string
            - images: string[]
        - subject: string
        - gradeLevel: string
        - schoolSystem: string
        - difficultyLevel: string
        - curriculum_path: string
        - created_by: string
        - created_at: timestamp
        - ratingAverage: number
        - ratingCount: number
        - viewCount: number

    verificationCodes/
      {email}/
        - email: string
        - code: string
        - createdAt: timestamp
        - expiresAt: timestamp
        - attempts: number
```

## Frontend Helper Functions

Located in `/lib/firebase/paths.ts`:

### Collection Path Helpers

```typescript
// Get users collection for a country
getUsersCollectionPath(country: CountryCode): string
// Returns: "countries/US/users"

// Get tasks collection for a country
getTasksCollectionPath(country: CountryCode): string
// Returns: "countries/US/tasks"

// Get verification codes collection for a country
getVerificationCodesPath(country: CountryCode): string
// Returns: "countries/US/verificationCodes"
```

### Document Path Helpers

```typescript
// Get specific user document
getUserPath(country: CountryCode, userId: string): string
// Returns: "countries/US/users/{userId}"

// Get specific task document
getTaskPath(country: CountryCode, taskId: string): string
// Returns: "countries/US/tasks/{taskId}"

// Get specific verification code document
getVerificationCodePath(country: CountryCode, email: string): string
// Returns: "countries/US/verificationCodes/{email}"
```

## Usage Examples

### Creating a User

```typescript
import { createUser } from '@/lib/firebase/users';

await createUser({
  uid: 'user123',
  email: 'teacher@example.com',
  name: 'John Doe',
  role: 'teacher',
  subject: 'mathematics',
  country: 'US'
});
// Stores at: countries/US/users/user123
```

### Querying Users

```typescript
import { getUserByEmail } from '@/lib/firebase/users';

const user = await getUserByEmail('teacher@example.com', 'US');
// Queries: countries/US/users where email == "teacher@example.com"
```

### Saving a Task

```typescript
// Backend API handles this
// Task will be stored at: countries/{country}/tasks/{taskId}
await saveTask({
  task_id: 'task123',
  country_code: 'US',
  task_data: { ... }
}, firebaseToken);
```

### Fetching Tasks

```typescript
// Backend API call
const response = await fetch(
  `${API_URL}/api/v2/tasks/${taskId}?country=${country}`
);
// Fetches from: countries/{country}/tasks/{taskId}
```

## Backend Integration

The **backend API** (Python/Node) must:

1. **Extract country from request**
   - From JWT token claims
   - From query parameters
   - From request body

2. **Use country in Firestore queries**
   ```python
   # Python example
   db.collection('countries').document(country_code) \
     .collection('tasks').document(task_id).set(task_data)
   ```

3. **Return country-specific data**
   - Tasks search filtered by country
   - User queries scoped to country

## Security Rules

Firestore security rules should enforce country-based access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Country-level access
    match /countries/{country} {

      // Users collection
      match /users/{userId} {
        // Users can read their own data
        allow read: if request.auth.uid == userId;

        // Users can update their own profile
        allow update: if request.auth.uid == userId
                      && request.auth.token.country == country;

        // Only allow creation during registration
        allow create: if request.auth.uid == userId;
      }

      // Tasks collection
      match /tasks/{taskId} {
        // Anyone can read tasks from their country
        allow read: if request.auth.token.country == country;

        // Only teachers can create tasks
        allow create: if request.auth.token.identity == 'teacher'
                      && request.auth.token.country == country;

        // Only task creator can update/delete
        allow update, delete: if request.auth.uid == resource.data.created_by;
      }

      // Verification codes (admin only)
      match /verificationCodes/{email} {
        allow read, write: if false; // Backend only
      }
    }
  }
}
```

## Migration Strategy

### For Existing Data

If you have existing data in flat collections:

1. **Export existing data**
   ```bash
   gcloud firestore export gs://your-bucket/backup
   ```

2. **Transform and import**
   ```typescript
   // Migration script
   const users = await db.collection('users').get();
   for (const doc of users.docs) {
     const data = doc.data();
     const newPath = `countries/${data.country}/users/${doc.id}`;
     await db.doc(newPath).set(data);
   }
   ```

3. **Update all API endpoints**
   - Add country parameter to all queries
   - Update frontend service calls

4. **Test thoroughly**
   - Verify all CRUD operations
   - Check authentication flows
   - Test task search/fetch

5. **Deploy and clean up**
   - Deploy new structure
   - Monitor for issues
   - Delete old flat collections after verification

## Benefits

### ✅ Data Organization
- Clear separation by country
- Easier to understand and debug
- Natural data boundaries

### ✅ Performance
- More efficient queries (smaller collection scans)
- Better index utilization
- Reduced read costs

### ✅ Compliance
- Data residency requirements
- GDPR/privacy regulations
- Regional data isolation

### ✅ Scalability
- Easy to add new countries
- Can split to multi-region later
- No schema changes needed

### ✅ Security
- Country-scoped access control
- Clear permission boundaries
- Easier audit trails

## Important Notes

⚠️ **Backend Changes Required**: This is a **breaking change** for the backend. All Firestore queries must be updated to include the country path.

⚠️ **Country Context**: Frontend must always know the user's country (from auth context) to make queries.

⚠️ **Cross-Country**: If you need cross-country features (global leaderboards, etc.), you'll need to query multiple countries or use a separate global collection.

⚠️ **Testing**: Update all tests to include country parameters in function calls.
