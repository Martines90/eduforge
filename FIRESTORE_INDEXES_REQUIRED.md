# Required Firestore Composite Indexes for EduForge

This document lists all composite indexes required for the tasks collection queries.

## Collection: `tasks`

### Index 1: Published + SubjectMappingId + Recent Sort
**Use case**: Fetching published tasks for a specific leaf node (default: most recent first)
- Field: `isPublished` - Ascending
- Field: `subjectMappingId` - Ascending
- Field: `createdAt` - **Descending**
- Query scope: Collection

**Error URL**: Already provided in console

---

### Index 2: Published + SubjectMappingId + Rating Sort
**Use case**: Fetching published tasks for a specific leaf node, sorted by rating
- Field: `isPublished` - Ascending
- Field: `subjectMappingId` - Ascending
- Field: `ratingAverage` - **Descending**
- Field: `ratingCount` - **Descending**
- Query scope: Collection

---

### Index 3: Published + SubjectMappingId + Views Sort
**Use case**: Fetching published tasks for a specific leaf node, sorted by views
- Field: `isPublished` - Ascending
- Field: `subjectMappingId` - Ascending
- Field: `viewCount` - **Descending**
- Query scope: Collection

---

### Index 4: Published + SubjectMappingId + Popular Sort
**Use case**: Fetching published tasks for a specific leaf node, sorted by completion count
- Field: `isPublished` - Ascending
- Field: `subjectMappingId` - Ascending
- Field: `completionCount` - **Descending**
- Query scope: Collection

---

### Index 5: Published + Subject + Recent Sort
**Use case**: Browsing published tasks by subject
- Field: `isPublished` - Ascending
- Field: `subject` - Ascending
- Field: `createdAt` - **Descending**
- Query scope: Collection

---

### Index 6: Published + Subject + GradeLevel + Recent Sort
**Use case**: Browsing published tasks by subject and grade level
- Field: `isPublished` - Ascending
- Field: `subject` - Ascending
- Field: `gradeLevel` - Ascending
- Field: `createdAt` - **Descending**
- Query scope: Collection

---

### Index 7: Published + GradeLevel + Recent Sort
**Use case**: Browsing published tasks by grade level
- Field: `isPublished` - Ascending
- Field: `gradeLevel` - Ascending
- Field: `createdAt` - **Descending**
- Query scope: Collection

---

### Index 8: CreatedBy + Recent Sort
**Use case**: Teacher viewing their own tasks (all statuses)
- Field: `createdBy` - Ascending
- Field: `createdAt` - **Descending**
- Query scope: Collection

---

### Index 9: CreatedBy + Published + Recent Sort
**Use case**: Teacher viewing only their published tasks
- Field: `createdBy` - Ascending
- Field: `isPublished` - Ascending
- Field: `createdAt` - **Descending**
- Query scope: Collection

---

### Index 10: Published + Subject + DifficultyLevel + Recent Sort
**Use case**: Filtering published tasks by subject and difficulty
- Field: `isPublished` - Ascending
- Field: `subject` - Ascending
- Field: `difficultyLevel` - Ascending
- Field: `createdAt` - **Descending**
- Query scope: Collection

---

## How to Create Indexes

### Method 1: Wait for errors and click links
The easiest way is to wait for each query to fail, then click the provided link in the error message.

### Method 2: Create manually in Firebase Console
1. Go to: https://console.firebase.google.com/project/eduforge-d29d9/firestore/indexes
2. Click "Create Index"
3. Select collection: `tasks`
4. Add fields in the exact order listed above
5. Set ascending/descending as specified
6. Save and wait for index to build (2-5 minutes)

### Method 3: Use firestore.indexes.json (Recommended for deployment)
Create a `firestore.indexes.json` file with all indexes defined, then deploy using Firebase CLI.

## Priority Order

For immediate functionality, create these first:
1. **Index 1** (most common: leaf node tasks)
2. **Index 8** (teacher's own tasks)
3. **Index 5** (browsing by subject)
4. **Index 6** (browsing by subject + grade)

The remaining indexes can be created as needed when those specific sorting/filtering combinations are used.

## Notes

- Each index takes 2-5 minutes to build
- Indexes don't retroactively apply to existing queries - you may need to retry failed requests
- Firebase has limits on the number of indexes (200 composite indexes per project)
- Consider using Algolia or similar for more complex search requirements
