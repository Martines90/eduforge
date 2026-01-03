# Test/Worksheet Publishing Feature

## Overview

Teachers can now publish their tests/worksheets to a public collection with a unique shareable link. Published tests are snapshots (copies) stored separately from the private editable versions.

## How It Works

### 1. Private Test Creation
- Teachers create and edit tests in their private collection: `countries/{country}/tests/{testId}`
- Can add library tasks with overrides or custom tasks
- Can freely edit, reorder, and modify

### 2. Publishing to Public
- Teacher clicks "Publish Latest Version" button
- System creates a complete snapshot of the test with all resolved content
- Generates a 6-character public ID (e.g., "ABC123")
- Creates public link: `/published-tests/ABC123`
- Anyone can access the published version (no authentication required)

### 3. Republishing
- Teacher can edit their private test
- Click "Publish Latest Version" again to update the public version
- Uses the same public ID and link
- Public version is completely replaced with new snapshot

---

## Database Schema

### Private Test Collection
**Path**: `countries/{countryCode}/tests/{testId}`

```typescript
{
  // ... existing test fields ...

  // NEW: Publishing fields
  publicLink: "/published-tests/ABC123",  // Public URL path
  publishedTestId: "ABC123",              // 6-char public ID
  lastPublishedAt: Timestamp
}
```

### Public Test Collection
**Path**: `countries/{countryCode}/published_tests/{publicId}`

```typescript
{
  // Reference
  originalTestId: string,    // Link back to private test
  publicId: string,          // 6-char ID for URL

  // Basic Info (snapshot)
  name: string,
  subject: string,
  gradeLevel?: string,
  description?: string,

  // Creator Info
  createdBy: string,
  creatorName: string,
  country: string,

  // Content - Fully Resolved Tasks
  tasks: [
    {
      originalTaskId?: string,  // Reference to library task or null
      title: string,            // Final resolved title
      text: string,             // Final resolved description
      imageUrl?: string,        // Image if showImage was true
      questions?: Array<{question, score}>,
      score?: number,
      orderIndex: number
    }
  ],

  // PDF
  pdfUrl?: string,

  // Statistics
  totalScore?: number,
  taskCount: number,
  viewCount: number,
  downloadCount: number,

  // Timestamps
  publishedAt: Timestamp,
  lastUpdatedAt: Timestamp
}
```

---

## API Endpoint

### POST /api/v2/tests/:testId/publish-public

Publishes a test to the public collection.

**Request**:
```bash
POST /api/v2/tests/TEST123/publish-public
Authorization: Bearer TOKEN
```

**Response**:
```json
{
  "success": true,
  "message": "Test published to public successfully",
  "publicLink": "/published-tests/ABC123",
  "publicId": "ABC123"
}
```

**Process**:
1. Fetches the test with all tasks
2. Generates or reuses public ID
3. Resolves all tasks:
   - For library tasks: Fetches original + merges overrides
   - For custom tasks: Uses custom content
   - Includes image only if `showImage` is true
4. Creates snapshot in `published_tests` collection
5. Updates private test with `publicLink` and `publishedTestId`

---

## Content Resolution

When publishing, the system resolves all task references:

### Library Task with Overrides
```
Original Task (in tasks collection):
  title: "Solve Linear Equations"
  description: "Find x in: 2x + 5 = 13"
  image: "https://..."

Test Task (with overrides):
  taskId: "task123"
  overrideTitle: "Custom Title"
  showImage: false
  score: 10

Published Task (resolved):
  originalTaskId: "task123"
  title: "Custom Title"  ← Uses override
  text: "Find x in: 2x + 5 = 13"  ← Uses original
  imageUrl: undefined  ← Hidden because showImage=false
  score: 10
```

### Custom Task
```
Test Task (custom):
  taskId: null
  customTitle: "My Custom Problem"
  customText: "Solve this..."
  customQuestions: [{question: "a)", score: 5}]

Published Task (resolved):
  originalTaskId: null
  title: "My Custom Problem"
  text: "Solve this..."
  questions: [{question: "a)", score: 5}]
```

---

## Security Rules

### Private Tests
```javascript
match /tests/{testId} {
  // Only test creator can read/write
  allow read, write: if isTeacher() && isOwner(resource.data.createdBy);
}
```

### Published Tests
```javascript
match /published_tests/{publicId} {
  // Anyone can read (public access)
  allow read: if true;

  // Only creator can write
  allow write: if isTeacher() && isOwner(resource.data.createdBy);
}
```

---

## Frontend Integration

### Teacher Flow

1. **In Test Editor** (`/tests/:testId/edit`):
   ```tsx
   <Button onClick={handlePublishToPublic}>
     {test.publicLink ? 'Republish Latest Version' : 'Publish to Public'}
   </Button>
   ```

2. **API Call**:
   ```typescript
   const response = await fetch(
     `/api/v2/tests/${testId}/publish-public`,
     {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${token}`,
       }
     }
   );

   const { publicLink, publicId } = await response.json();
   // publicLink = "/published-tests/ABC123"
   ```

3. **Show Public Link**:
   ```tsx
   {test.publicLink && (
     <Alert severity="success">
       Public Link:
       <Link href={test.publicLink}>
         {window.location.origin}{test.publicLink}
       </Link>
     </Alert>
   )}
   ```

### Public View

1. **Public Test Page** (`/published-tests/:publicId`):
   ```typescript
   // No authentication required!
   const response = await fetch(
     `https://firestore.googleapis.com/v1/projects/...
      /databases/(default)/documents/countries/${country}/published_tests/${publicId}`
   );
   ```

2. **Display Test**:
   - Show test name, description, creator
   - Display all tasks with resolved content
   - Show images if included
   - Show scores if assigned
   - Download PDF if available

---

## Usage Examples

### Example 1: First-Time Publishing

```typescript
// Teacher creates test "Math Quiz 1"
// Adds 3 tasks from library + 1 custom task
// Edits titles and scores

// Click "Publish to Public"
POST /api/v2/tests/abc123/publish-public

// Response:
{
  "publicLink": "/published-tests/XYZ789",
  "publicId": "XYZ789"
}

// Now available at:
https://your-domain.com/published-tests/XYZ789
```

### Example 2: Republishing After Edit

```typescript
// Teacher edits the test:
// - Changes task order
// - Updates a task title
// - Changes an image visibility

// Click "Republish Latest Version"
POST /api/v2/tests/abc123/publish-public

// Response (same public ID):
{
  "publicLink": "/published-tests/XYZ789",
  "publicId": "XYZ789"
}

// Public version is completely updated
// URL stays the same
```

---

## Key Features

### ✅ Snapshot-Based
- Published version is a complete copy
- Editing private test doesn't affect published version
- Must explicitly republish to update public version

### ✅ Fully Resolved Content
- All library task overrides are merged
- Custom tasks included with full content
- Images included only if `showImage` is true
- No references to original tasks (self-contained)

### ✅ Unique Public IDs
- 6-character alphanumeric (e.g., "ABC123")
- ~2 billion possible combinations
- Collision detection with retry logic

### ✅ Public Access
- No authentication required to view
- Anyone with link can access
- Perfect for sharing with students/colleagues

### ✅ Republish Support
- Same public ID preserved
- Public link never changes
- Complete replacement of content

---

## Future Enhancements

### Search/Browse Published Tests
Later, we can add a public test library page:

**Path**: `/test-library`

**Features**:
- Search by subject, grade level
- Filter by creator, date
- Sort by views, downloads
- Rating system
- Comments/feedback

**Database Structure**:
```
countries/{country}/published_tests/{publicId}
  ↓
Queryable by: subject, gradeLevel, createdBy, publishedAt
Indexed for search
```

### Statistics Tracking
- View count (increment on page load)
- Download count (increment on PDF download)
- Popular tests rankings
- Creator statistics

### Versioning
- Keep history of published versions
- Allow teachers to see previous versions
- "Revert to version X" feature

---

## Testing

### Test Publishing Flow

```bash
# 1. Create a test
POST /api/v2/tests
{
  "name": "Test Publishing Demo",
  "subject": "mathematics"
}

# 2. Add some tasks
POST /api/v2/tests/TEST_ID/tasks
{
  "taskId": "library_task_123",
  "overrideTitle": "Custom Title",
  "showImage": true,
  "score": 10
}

# 3. Publish to public
POST /api/v2/tests/TEST_ID/publish-public

# 4. Get response
{
  "publicLink": "/published-tests/ABC123",
  "publicId": "ABC123"
}

# 5. Verify published test exists
GET https://firestore.../published_tests/ABC123
# Should return the full snapshot

# 6. Verify public link in private test
GET /api/v2/tests/TEST_ID
{
  "publicLink": "/published-tests/ABC123",
  "publishedTestId": "ABC123",
  "lastPublishedAt": "2026-01-02T..."
}
```

---

## Summary

- ✅ **Private tests** remain editable in teacher's collection
- ✅ **Published tests** are public snapshots with unique short IDs
- ✅ **Content resolution** merges library tasks with overrides
- ✅ **Public access** requires no authentication
- ✅ **Republishing** updates the public version (same ID/link)
- ✅ **Security** enforces creator-only write, public read

**New Endpoint**: `POST /api/v2/tests/:testId/publish-public`

**Public Link Format**: `/published-tests/{6-char-id}`

**Database**: `countries/{country}/published_tests/{publicId}`
