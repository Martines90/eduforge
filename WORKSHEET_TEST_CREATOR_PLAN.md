# Worksheet/Test Creator - Development Plan

## Project Overview

This document outlines the implementation plan for a comprehensive worksheet/test creator feature that allows teachers to:
- Create custom test forms by collecting tasks from the task library
- Edit task properties (title, text, image visibility, scores)
- Add custom tasks without images
- Generate PDF versions of tests
- Save and manage multiple tests/worksheets
- Use test creation credits from their subscription

---

## Database Schema Design

### Collection: `tests` (under country path)

Location: `countries/{countryCode}/tests/{testId}`

```typescript
interface TestDocument {
  // Basic Info
  id: string;
  name: string;  // Unique per teacher
  subject: string;  // "mathematics", "physics", etc.

  // Ownership
  createdBy: string;  // User UID
  creatorName: string;  // Denormalized

  // Metadata
  gradeLevel?: string;  // Optional: "grade_9_10", etc.
  description?: string;

  // Status
  isPublished: boolean;

  // PDF Storage
  pdfUrl?: string;  // Firebase Storage URL
  lastPdfGeneratedAt?: Timestamp;

  // Statistics
  totalScore?: number;  // Sum of all task scores
  taskCount: number;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Collection: `testTasks` (subcollection under tests)

Location: `countries/{countryCode}/tests/{testId}/testTasks/{testTaskId}`

```typescript
interface TestTaskDocument {
  // Task Reference
  taskId: string | null;  // NULL for custom tasks

  // Custom Task Content (only if taskId is null)
  customTitle?: string;
  customText?: string;
  customQuestions?: Array<{
    question: string;
    score?: number;
  }>;

  // Task Overrides (for library tasks)
  overrideTitle?: string;  // Override original title
  overrideText?: string;   // Override original description
  showImage: boolean;  // Toggle image visibility

  // Scoring
  score?: number;  // Total points for this task
  questionScores?: Array<{
    questionIndex: number;
    score: number;
  }>;

  // Ordering
  orderIndex: number;  // Position in test

  // Timestamps
  addedAt: Timestamp;
}
```

### User Credits Tracking

Extend existing user document:

```typescript
interface UserDocument {
  // ... existing fields ...

  // Credits
  taskCreationCredits: number;  // Existing
  testCreationCredits: number;  // NEW - from subscription

  // Usage tracking
  testsCreatedCount: number;  // NEW
}
```

---

## API Endpoints (Backend)

### Test Management

```typescript
// GET /api/v2/tests
// Get all tests for current user
interface GetTestsQuery {
  subject?: string;
  sort?: 'recent' | 'name' | 'taskCount';
  limit?: number;
  offset?: number;
}

// POST /api/v2/tests
// Create new test
interface CreateTestRequest {
  name: string;
  subject: string;
  gradeLevel?: string;
  description?: string;
}

// GET /api/v2/tests/:testId
// Get test details with all tasks

// PUT /api/v2/tests/:testId
// Update test metadata
interface UpdateTestRequest {
  name?: string;
  description?: string;
  subject?: string;
  gradeLevel?: string;
}

// DELETE /api/v2/tests/:testId
// Delete test (only if not published or custom logic)

// POST /api/v2/tests/:testId/publish
// Publish test and deduct credit

// GET /api/v2/tests/:testId/pdf
// Generate and return PDF
```

### Test Task Management

```typescript
// POST /api/v2/tests/:testId/tasks
// Add task to test
interface AddTaskToTestRequest {
  taskId?: string;  // NULL for custom task

  // Custom task fields (if taskId is null)
  customTitle?: string;
  customText?: string;
  customQuestions?: Array<{
    question: string;
    score?: number;
  }>;

  // Overrides (if taskId exists)
  overrideTitle?: string;
  overrideText?: string;
  showImage?: boolean;

  // Scoring
  score?: number;
  questionScores?: Array<{
    questionIndex: number;
    score: number;
  }>;
}

// PUT /api/v2/tests/:testId/tasks/:testTaskId
// Update task in test
interface UpdateTestTaskRequest {
  overrideTitle?: string;
  overrideText?: string;
  showImage?: boolean;
  score?: number;
  questionScores?: Array<{
    questionIndex: number;
    score: number;
  }>;
  orderIndex?: number;
}

// DELETE /api/v2/tests/:testId/tasks/:testTaskId
// Remove task from test

// PUT /api/v2/tests/:testId/tasks/reorder
// Reorder tasks
interface ReorderTasksRequest {
  taskOrders: Array<{
    testTaskId: string;
    orderIndex: number;
  }>;
}
```

---

## Frontend Pages & Components

### 1. My Tests/Worksheets Page

**Path**: `/my-tests`

**Features**:
- List all tests created by teacher
- Grouped by subject
- Show test metadata (name, task count, last updated)
- Actions: Edit, Delete, Download PDF, View
- Create new test button

**Components**:
```typescript
// app/my-tests/page.tsx
export default function MyTestsPage() {
  // List tests grouped by subject
  // Create new test modal
  // Delete confirmation dialog
}
```

### 2. Test Creation/Edit Modal

**Component**: `CreateTestModal.tsx`

**Features**:
- Form with: name, subject selector, grade level (optional), description
- Validation: name must be unique for teacher
- Subject dropdown from existing subjects
- On create: redirect to test editor

### 3. Test Editor Page

**Path**: `/tests/:testId/edit`

**Features**:
- Test metadata at top (name, subject, etc.)
- Task list with drag-and-drop reordering
- Each task shows:
  - Title (editable)
  - Text/Description (editable with rich text)
  - Image toggle
  - Score input (per question or total)
  - Remove button
- Add custom task button
- Download PDF button (always active)
- Save button (saves all changes)

**Components**:
```typescript
// app/tests/[testId]/edit/page.tsx
export default function TestEditorPage() {
  // Test metadata section
  // Task list with drag-and-drop
  // Custom task creator
  // PDF generation
}
```

### 4. Add Task to Test (Task Detail Enhancement)

**Path**: `/tasks/:id` (enhancement)

**Features**:
- Add "Add to Test" section below action buttons
- Dropdown to select test (with "Create New Test" option)
- If "Create New Test" selected → show test creation modal
- Add button to add current task to selected test
- Success message on add

**Component Enhancement**:
```typescript
// app/tasks/[id]/page.tsx
// Add new section:
<AddToTestSection taskId={taskId} />
```

### 5. Custom Task Creator Component

**Component**: `CustomTaskCreator.tsx`

**Features**:
- Modal or inline form
- Fields:
  - Title (required)
  - Description/Text (required, rich text editor)
  - Questions array:
    - Question text
    - Score (optional)
    - Add/Remove question buttons
- No image upload
- Save adds to test

---

## Implementation Phases

### Phase 1: Database & Backend (Development Phase 1)

**Tasks**:
1. Create database schema design
2. Create backend types in `backend/src/types/test.types.ts`
3. Create test service: `backend/src/services/test.service.ts`
4. Create test controller: `backend/src/controllers/test.controller.ts`
5. Create test routes: `backend/src/routes/test.routes.ts`
6. Implement credit deduction logic
7. Update user credits tracking
8. Write unit tests for services

**Estimated Time**: 2-3 days

**Deliverables**:
- Full backend API for test management
- Credit system integrated
- API tests passing

---

### Phase 2: Frontend - Basic Test Management (Development Phase 2 - Part 1)

**Tasks**:
1. Create "My Tests/Worksheets" page (`/my-tests`)
2. Implement test creation modal
3. Implement test list view (grouped by subject)
4. Add delete functionality with confirmation
5. Create test editor page structure
6. Add navigation from list to editor

**Estimated Time**: 2-3 days

**Deliverables**:
- Teachers can create and list tests
- Basic CRUD operations working
- Navigation flow complete

---

### Phase 3: Frontend - Test Editor & Task Management (Development Phase 2 - Part 2)

**Tasks**:
1. Build test editor UI with task list
2. Implement task editing (title, text, image toggle)
3. Add score assignment UI (per task and per question)
4. Implement drag-and-drop reordering
5. Create custom task creator component
6. Add task to test from task detail page
7. Implement save functionality

**Estimated Time**: 3-4 days

**Deliverables**:
- Full test editor functionality
- Custom task creation
- Task library integration
- All editing features working

---

### Phase 4: PDF Generation & Credit System (Development Phase 2 - Part 3)

**Tasks**:
1. Implement PDF generation service (backend or frontend)
2. Design PDF template/layout
3. Handle task images in PDF
4. Store PDF in Firebase Storage
5. Implement credit deduction on test save
6. Add credit check before saving
7. Show remaining credits in UI
8. Add PDF download button (always active)

**Estimated Time**: 2-3 days

**Deliverables**:
- PDF generation working
- Credit system integrated
- PDFs stored and downloadable

---

### Phase 5: Testing & Polish

**Tasks**:
1. Write E2E tests for test creation flow
2. Write E2E tests for test editing flow
3. Test PDF generation with various content
4. Test credit deduction
5. UI/UX polish
6. Mobile responsiveness
7. Error handling improvements
8. Loading states
9. Success/error messages

**Estimated Time**: 2-3 days

**Deliverables**:
- All tests passing
- Polished UI
- Production-ready feature

---

## Technical Considerations

### PDF Generation Strategy

**Option 1: Frontend Generation (Recommended for MVP)**
- Use existing html2pdf.js / html2canvas approach (already in task detail page)
- Generate PDF on-demand when user clicks download
- Optionally cache PDF in Firebase Storage after first generation

**Pros**:
- Simpler implementation
- No backend PDF library needed
- Consistent with existing task PDF generation

**Cons**:
- Limited control over PDF layout
- Depends on browser rendering

**Option 2: Backend Generation (Future Enhancement)**
- Use backend PDF library (e.g., puppeteer, pdfkit)
- Generate PDF on save and store in Firebase Storage
- Return download URL to frontend

**Pros**:
- Better PDF quality and control
- Consistent rendering
- Can include custom branding

**Cons**:
- Requires backend PDF library
- More complex implementation
- Firebase Functions timeout considerations

**Recommendation**: Start with Option 1 (frontend) for MVP, migrate to Option 2 later if needed.

---

### Credit System Integration

**Test Creation Credits**:
- Each subscription tier gets credits (defined in `SUBSCRIPTION_CREDITS`)
- Credits are deducted when test is SAVED (not when created)
- Draft tests don't consume credits
- Teachers can edit saved tests without additional credits
- Re-generating PDF doesn't consume credits

**Credit Check Flow**:
1. User creates test → no credit deduction (draft state)
2. User adds tasks and edits → no credit deduction
3. User clicks "Save Test" → check credits
4. If credits > 0 → deduct 1 credit, save test, generate PDF
5. If credits = 0 → show upgrade modal

**Update `constants/credits.ts`**:
```typescript
export const SUBSCRIPTION_CREDITS = {
  trial: {
    taskGeneration: 100,
    testCreation: 5,  // NEW
  },
  basic: {
    taskGeneration: 0,
    testCreation: 0,  // NEW
  },
  normal: {
    taskGeneration: 1000,
    testCreation: 50,  // NEW
  },
  pro: {
    taskGeneration: 10000,
    testCreation: 500,  // NEW
  },
} as const;
```

---

### Task Editing Philosophy

**For Library Tasks**:
- Original task remains unchanged
- Test stores "overrides" only
- When displaying in test/PDF, merge original + overrides
- Image toggle doesn't modify original, just controls display

**For Custom Tasks**:
- Fully editable
- Stored entirely in `testTasks` subcollection
- No reference to task library

---

### Data Flow

```
Task Library → Add to Test → Test Editor → PDF Generation
     ↓              ↓              ↓              ↓
  Read Only    Create Link    Edit Overrides   Render PDF
```

**Adding Task Flow**:
1. User visits task detail page (`/tasks/:id`)
2. Selects test from dropdown (or creates new)
3. Click "Add to Test"
4. Backend creates document in `testTasks` subcollection
5. Success message shown
6. User can navigate to test editor

**Editing Task in Test Flow**:
1. User opens test editor (`/tests/:testId/edit`)
2. Sees list of tasks with current values
3. Edits title, text, score, toggles image
4. Click "Save"
5. Backend updates `testTasks` documents
6. PDF marked as stale (regenerate on next download)

**PDF Generation Flow**:
1. User clicks "Download PDF" in test editor or test list
2. Frontend fetches test document + all testTasks
3. For each task, merge original task data with overrides
4. Build HTML structure with task content
5. Use html2pdf.js to generate PDF
6. Optionally upload to Firebase Storage
7. Download PDF to user's device

---

## User Experience Flow

### Creating First Test

1. Teacher logs in and navigates to "My Tests/Worksheets"
2. Sees empty state with "Create Your First Test" button
3. Clicks button → Test creation modal opens
4. Enters name: "Math Quiz - Week 1", Subject: "Mathematics", Grade: "9-10"
5. Clicks "Create" → Redirects to test editor
6. Editor shows empty test with "Add tasks from Task Library" message
7. Teacher navigates to Task Library (via link or button)
8. Finds task, clicks "Add to Test" → selects "Math Quiz - Week 1"
9. Task added, returns to test editor
10. Teacher sees task in list, edits title and score
11. Adds custom task using "Add Custom Task" button
12. Reorders tasks with drag-and-drop
13. Clicks "Save Test" → credit deducted, test saved
14. Clicks "Download PDF" → PDF generated and downloaded

### Adding Task from Task Detail

1. Teacher browsing task library
2. Opens task detail page
3. Sees "Add to Test" section below action buttons
4. Clicks dropdown → shows existing tests + "Create New Test"
5. Selects "Math Quiz - Week 1"
6. Clicks "Add" → Success message "Task added to Math Quiz - Week 1"
7. Can continue browsing or go to test editor

### Editing Existing Test

1. Teacher opens "My Tests/Worksheets"
2. Sees list of tests grouped by subject
3. Clicks "Edit" on "Math Quiz - Week 1"
4. Opens test editor with current tasks
5. Edits task properties, reorders, adds/removes tasks
6. Clicks "Save" → changes saved (no credit deduction if already saved)
7. Clicks "Download PDF" → latest PDF generated

---

## Security & Permissions

### Firestore Rules

```javascript
// tests collection
match /countries/{country}/tests/{testId} {
  // Teachers can read their own tests
  allow read: if request.auth.uid == resource.data.createdBy;

  // Only teachers can create tests
  allow create: if request.auth.token.identity == 'teacher'
                && request.auth.token.country == country;

  // Only test creator can update/delete
  allow update, delete: if request.auth.uid == resource.data.createdBy;

  // testTasks subcollection
  match /testTasks/{testTaskId} {
    // Inherit parent test permissions
    allow read, write: if get(/databases/$(database)/documents/countries/$(country)/tests/$(testId)).data.createdBy == request.auth.uid;
  }
}
```

### API Middleware

- All test endpoints require authentication
- All test endpoints require teacher role
- Test access validated (user owns test)
- Credit checks before deduction

---

## Future Enhancements (Post-MVP)

1. **Test Templates**: Save test as template for reuse
2. **Test Sharing**: Share tests with other teachers
3. **Test Analytics**: Track which tests are most used
4. **Answer Keys**: Generate separate answer key PDFs
5. **Print Settings**: Customize PDF layout (margins, font size, etc.)
6. **Test Duplication**: Clone existing test
7. **Bulk Operations**: Add multiple tasks at once
8. **Test Tags**: Categorize tests with tags
9. **Test Export**: Export as Word document, Google Docs, etc.
10. **Student Assignment**: Assign tests to students (future student portal)

---

## Summary

This plan provides a complete roadmap for implementing the worksheet/test creator feature in two main development phases:

**Phase 1**: Backend infrastructure (database schema, API, credit system)
**Phase 2**: Frontend UI (pages, components, PDF generation)

The feature integrates seamlessly with existing:
- Task library
- Credit system
- PDF generation (task detail page)
- User authentication and authorization
- Country-based database structure

Total estimated time: 11-16 days for full implementation and testing.

**Next Steps**:
1. Review and approve this plan
2. Start with Phase 1: Database & Backend setup
3. Implement Phase 2 in three parts as outlined
4. Test thoroughly before production deployment

