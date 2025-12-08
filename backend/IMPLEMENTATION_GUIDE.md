# EduForge Task System - Implementation Guide

## Overview

This guide will help you set up and use the new Firestore-based hierarchical task system.

## 📋 What Was Created

### 1. Documentation
- **FIRESTORE_SCHEMA.md** - Complete database schema and query examples
- **IMPLEMENTATION_GUIDE.md** - This file

### 2. TypeScript Types (`src/types/task.types.ts`)
- `SubjectMappingDocument` - Curriculum hierarchy nodes
- `TaskDocument` - Task content and metadata
- `TaskRatingDocument` - User ratings
- `TaskContent`, `QuestionBlock`, `SolutionBlock` - Content structures
- API request/response types

### 3. Services
- **`src/services/subject-mapping.service.ts`** - CRUD for curriculum hierarchy
- **`src/services/task.service.ts`** - CRUD for tasks, ratings, views

### 4. Migration Script
- **`src/scripts/migrate-subject-mappings.ts`** - Import JSON → Firestore

### 5. API Routes
- **`src/routes/subject-mapping.routes.ts`** - Curriculum tree endpoints
- **`src/routes/tasks-v2.routes.ts`** - Task CRUD endpoints

---

## 🚀 Step-by-Step Setup

### Step 1: Ensure Firebase is Initialized

The backend already has Firebase configured. Verify the service account file exists:

```bash
ls -la src/config/eduforge-d29d9-firebase-adminsdk-fbsvc-744c4f4757.json
```

If missing, place it there from the Firebase Console (Project Settings → Service Accounts).

### Step 2: Install Dependencies

Ensure all dependencies are installed:

```bash
cd /Users/martonhorvath/Documents/EduForge/app/backend
npm install
```

### Step 3: Run the Migration Script

Import the curriculum JSON data into Firestore:

```bash
# Add script to package.json first
npm run migrate:subjects

# Or run directly
npx ts-node src/scripts/migrate-subject-mappings.ts

# Options:
# --clear    : Delete existing subject mappings before importing
# --subject  : Import only a specific subject (e.g., "mathematics")
```

**Example:**
```bash
npx ts-node src/scripts/migrate-subject-mappings.ts --clear --subject mathematics
```

This will:
1. Read `src/data/subject_mapping/hu_math_grade_9_12_purged.json`
2. Parse the hierarchical structure
3. Create documents in `subjectMappings` Firestore collection
4. Display progress in the console

**Expected Output:**
```
🚀 Starting Subject Mappings Migration
=====================================

Importing Mathematics (mathematics)
============================================================

📚 Processing grade_9_10 (25 main topics)
  [1] Grade 9-10
  [2] Halmazok
    [3] Halmaz fogalma és megadása
      [4] Halmaz megadása felsorolással
      [4] Halmaz megadása utasítással
...

✅ Mathematics import complete!

🎉 Migration Complete!
```

### Step 4: Add NPM Script (Optional)

Add to `package.json`:

```json
{
  "scripts": {
    "migrate:subjects": "ts-node src/scripts/migrate-subject-mappings.ts"
  }
}
```

### Step 5: Start the Backend Server

```bash
npm run dev
```

The server should start successfully with the new routes mounted.

### Step 6: Verify Firestore Data

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `eduforge-d29d9`
3. Navigate to **Firestore Database**
4. You should see a `subjectMappings` collection with documents

---

## 📡 API Endpoints

All new endpoints are prefixed with `/api/v2` to avoid conflicts with legacy task generator.

### Subject Mappings

#### Get Tree Structure
```http
GET /api/subjects/:subject/grades/:grade/tree
```

**Example:**
```bash
curl http://localhost:3000/api/subjects/mathematics/grades/grade_9_10/tree
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mathematics_grade_9_10_root",
      "key": "grade_9_10",
      "name": "Grade 9-10",
      "level": 1,
      "children": [
        {
          "id": "mathematics_grade_9_10_halmazok",
          "key": "halmazok",
          "name": "Halmazok",
          "level": 2,
          "children": [...]
        }
      ]
    }
  ]
}
```

#### Get Leaf Nodes (for Task Creation Form)
```http
GET /api/subjects/:subject/grades/:grade/leaf-nodes
```

**Example:**
```bash
curl http://localhost:3000/api/subjects/mathematics/grades/grade_9_10/leaf-nodes
```

### Tasks V2

#### Create Task (Teachers Only)
```http
POST /api/v2/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Véges halmazok felsorolása - Alapfeladatok",
  "description": "Gyakorlófeladatok véges halmazok megadásához",
  "content": {
    "type": "multiple_choice",
    "questions": [
      {
        "type": "multiple_choice",
        "text": "Melyik halmaz tartalmazza az első 5 természetes számot?",
        "options": ["A = {1,2,3,4,5}", "B = {0,1,2,3,4}", "C = {2,3,4,5,6}", "D = {1,2,3,4}"],
        "correctAnswer": 0,
        "points": 10
      }
    ],
    "solutions": [
      {
        "explanation": "Az első 5 természetes szám: 1, 2, 3, 4, 5"
      }
    ],
    "hints": ["Természetes számok 1-től indulnak"]
  },
  "subjectMappingId": "mathematics_grade_9_10_halmazok_megadas_felsorolassal",
  "educationalModel": "secular",
  "difficultyLevel": "easy",
  "estimatedDurationMinutes": 15,
  "tags": ["halmazok", "alapok"],
  "isPublished": true
}
```

#### Get Tasks (Public)
```http
GET /api/v2/tasks?subject=mathematics&gradeLevel=grade_9_10&sort=rating&limit=20
```

**Query Parameters:**
- `subject` - Filter by subject
- `gradeLevel` - Filter by grade level
- `subjectMappingId` - Filter by specific category
- `difficultyLevel` - easy/medium/hard
- `sort` - rating/views/recent/popular
- `limit` - Results per page (default: 20)
- `offset` - Pagination offset

#### Get Single Task
```http
GET /api/v2/tasks/:id?view=true
```

Set `view=true` to increment view count.

#### Update Task (Owner Only)
```http
PUT /api/v2/tasks/:id
Authorization: Bearer <token>

{
  "title": "Updated title",
  "isPublished": true
}
```

#### Delete Task (Owner Only)
```http
DELETE /api/v2/tasks/:id
Authorization: Bearer <token>
```

#### Submit Rating (Authenticated)
```http
POST /api/v2/tasks/:id/rate
Authorization: Bearer <token>

{
  "rating": 5,
  "reviewText": "Nagyon hasznos feladat!"
}
```

#### Get My Tasks (Teacher)
```http
GET /api/v2/tasks/my?status=published
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - all/published/draft

---

## 🧪 Testing with cURL

### 1. Register a Teacher Account
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "Test1234!",
    "name": "Test Teacher",
    "role": "teacher",
    "country": "HU"
  }'
```

### 2. Verify Email Code
```bash
# Check console for verification code, then:
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "code": "123456"
  }'
```

Save the `token` from the response.

### 3. Get Subject Tree
```bash
curl http://localhost:3000/api/subjects/mathematics/grades/grade_9_10/tree
```

### 4. Create a Test Task
```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:3000/api/v2/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "title": "Test Task: Halmazok",
  "description": "Ez egy teszt feladat",
  "content": {
    "type": "open_ended",
    "questions": [
      {
        "type": "open_ended",
        "text": "Mi a halmaz definíciója?",
        "points": 10
      }
    ]
  },
  "subjectMappingId": "mathematics_grade_9_10_halmazok_halmaz_fogalma_halmaz_megadas_felsorolassal",
  "isPublished": true
}
EOF
```

### 5. Get Tasks
```bash
curl "http://localhost:3000/api/v2/tasks?subject=mathematics&gradeLevel=grade_9_10&isPublished=true"
```

---

## 🔐 Firestore Security Rules

Apply these rules in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isTeacher() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }

    // Subject Mappings - Public read
    match /subjectMappings/{mappingId} {
      allow read: if true;
      allow write: if false; // Admin only via backend
    }

    // Tasks
    match /tasks/{taskId} {
      allow read: if resource.data.isPublished == true ||
                     (isAuthenticated() && request.auth.uid == resource.data.createdBy);
      allow create: if isTeacher();
      allow update, delete: if isAuthenticated() && request.auth.uid == resource.data.createdBy;

      // Ratings subcollection
      match /ratings/{userId} {
        allow read: if true;
        allow create, update: if isAuthenticated() && userId == request.auth.uid;
      }
    }
  }
}
```

---

## 🎨 Frontend Integration

Update your frontend Tasks page to call the new APIs:

```typescript
// Example: Fetch tree structure
const response = await fetch(
  `${API_BASE_URL}/api/subjects/mathematics/grades/grade_9_10/tree`
);
const { data: tree } = await response.json();

// Example: Fetch tasks
const response = await fetch(
  `${API_BASE_URL}/api/v2/tasks?subject=mathematics&gradeLevel=grade_9_10&isPublished=true&sort=rating`
);
const { tasks, total, hasMore } = await response.json();
```

---

## 📊 Database Indexes

Create these composite indexes in Firestore (Firebase will prompt you when queries fail):

### subjectMappings
1. `subject` ASC + `gradeLevel` ASC + `level` ASC + `orderIndex` ASC
2. `subject` ASC + `gradeLevel` ASC + `isLeaf` ASC + `path` ASC
3. `parentId` ASC + `orderIndex` ASC

### tasks
1. `subject` ASC + `gradeLevel` ASC + `isPublished` ASC + `ratingAverage` DESC
2. `subject` ASC + `gradeLevel` ASC + `isPublished` ASC + `viewCount` DESC
3. `subjectMappingId` ASC + `isPublished` ASC + `createdAt` DESC
4. `createdBy` ASC + `createdAt` DESC

---

## 🐛 Troubleshooting

### Migration Script Fails
- **Error: Firebase not initialized**
  - Ensure service account JSON file exists in `src/config/`
  - Check file permissions

- **Error: Cannot find module**
  - Run `npm install`
  - Rebuild TypeScript: `npm run build`

### API Returns 500 Error
- Check backend console logs
- Verify Firestore collection names match schema
- Ensure indexes are created

### Tasks Don't Appear in Frontend
- Verify `isPublished: true` on tasks
- Check Firestore security rules
- Verify API endpoint URL

---

## ✅ Next Steps

1. ✅ Run migration script
2. ✅ Test API endpoints with cURL
3. ✅ Apply Firestore security rules
4. 🔲 Update frontend to use new APIs
5. 🔲 Create UI for teachers to create tasks
6. 🔲 Implement task detail page
7. 🔲 Add rating submission UI
8. 🔲 Implement search functionality

---

## 📚 Additional Resources

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

---

## 🆘 Getting Help

If you encounter issues:
1. Check the backend console for detailed error messages
2. Review FIRESTORE_SCHEMA.md for data structure
3. Verify Firebase project settings
4. Check Firestore security rules

---

**Created:** 2024-11-27
**Version:** 1.0
**Project:** EduForge
