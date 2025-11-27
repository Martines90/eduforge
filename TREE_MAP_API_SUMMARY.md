# Tree Map API Implementation Summary

## Overview
Implemented a complete API solution to fetch hierarchical curriculum tree data from Firestore and display it in the frontend TaskTreeView component.

## Backend Changes

### 1. Export Script (`/backend/src/scripts/export-tree-map.ts`)
- Fetches all curriculum nodes from Firestore for a given subject and grade level
- Builds hierarchical tree structure from flat Firestore data
- Adjusts levels so root starts at level 0
- Unwraps grade-level container if it's the only root node
- Usage: `npx ts-node src/scripts/export-tree-map.ts --subject=mathematics --grade=grade_9_10`

### 2. API Route (`/backend/src/routes/tree-map.routes.ts`)
- **Endpoint**: `GET /api/tree-map/:subject/:gradeLevel`
- Returns full hierarchical tree structure with metadata
- Response format:
```json
{
  "success": true,
  "data": {
    "subject": "mathematics",
    "gradeLevel": "grade_9_10",
    "totalNodes": 429,
    "rootNodes": 17,
    "tree": [
      {
        "key": "halmazok",
        "name": "Halmazok",
        "short_description": "...",
        "level": 1,
        "subTopics": [...]
      }
    ]
  }
}
```

### 3. Route Registration (`/backend/src/routes/index.ts`)
- Registered tree-map routes at `/api/tree-map`

## Frontend Changes

### 1. Tasks Page (`/frontend/app/tasks/page.tsx`)
- Added `useEffect` hook to fetch tree data from API
- Loading state while data is fetching
- Error handling with fallback to sample data
- Dynamic data display based on API response
- Refetches data when subject or grade filter changes

### 2. Features
- ✅ Fetches real data from Firestore via API
- ✅ Loading indicator while fetching
- ✅ Error handling with user-friendly messages
- ✅ Fallback to sample data if API fails
- ✅ Reactive updates when filters change

## Data Structure

### Firestore Collection: `subjectMappings`
- 429 nodes for Mathematics Grade 9-10
- 17 main topics (root level)
- Up to 5 levels deep
- Each node contains:
  - `key`: Unique identifier
  - `name`: Display name
  - `level`: Depth in hierarchy
  - `parentId`: Reference to parent node
  - `path`: Full path from root
  - `isLeaf`: Whether node can have tasks
  - `short_description`: Optional description
  - `orderIndex`: For sorting

### Tree Structure Levels (Mathematics Grade 9-10):
- **Level 0**: 17 main topics
  - Halmazok
  - Matematikai logika
  - Kombinatorika, gráfok
  - Számhalmazok, műveletek
  - Hatvány, gyök
  - Betűs kifejezések
  - Arányosság, százalékszámítás
  - Elsőfokú egyenletek
  - Másodfokú egyenletek
  - A függvény fogalma
  - Geometriai alapismeretek
  - Háromszögek
  - Négyszögek, sokszögek
  - A kör és részei
  - Transzformációk
  - Leíró statisztika
  - Valószínűség-számítás

- **Level 1**: 98 subtopics
- **Level 2**: 254 sub-subtopics
- **Level 3**: 54 deep nodes
- **Level 4**: 5 deepest nodes

## Testing

### Test API Endpoint:
```bash
curl http://localhost:3000/api/tree-map/mathematics/grade_9_10
```

### Expected Response:
- Status: 200 OK
- Returns full tree with 17 root nodes
- Total of 429 nodes in the tree

## Generated Files

### Static Tree Map Export:
- `/backend/src/data/generated/task-tree-map.json`
- Contains full tree structure in JSON format
- Can be used for reference or static fallback
- Generated via: `npx ts-node src/scripts/export-tree-map.ts > src/data/generated/task-tree-map.json`

## Next Steps

### To Add More Subjects:
1. Run migration script for the subject:
   ```bash
   npx ts-node src/scripts/migrate-subject-mappings.ts --subject=physics --grade=grade_9_10
   ```

2. The API will automatically serve the new data at:
   ```
   GET /api/tree-map/physics/grade_9_10
   ```

### To Connect Tasks to Tree Nodes:
- Tasks should reference `subjectMappingId` (the document ID of the leaf node)
- Use the `/api/v2/tasks` endpoint to fetch tasks for a specific mapping
- Update TaskTreeView to fetch tasks when leaf nodes are expanded

## Architecture Benefits

1. **Scalable**: Can handle thousands of nodes efficiently
2. **Dynamic**: Data updates in Firestore reflect immediately via API
3. **Flexible**: Easy to add new subjects/grades without code changes
4. **Fast**: Tree building happens server-side, reducing client load
5. **Type-safe**: Full TypeScript support throughout the stack
