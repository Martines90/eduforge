# Database Schema for Hierarchical Task Structure

## Overview

This document describes the recommended database schema for storing educational tasks in a hierarchical structure based on the curriculum mapping from `hu_math_grade_9_12_purged.json`.

## Design Approach

The hierarchical structure (Subject → Grade → Main Category → Sub Category → ... → Tasks) will be stored using **Nested Set Model** or **Materialized Path** pattern for efficient querying.

## Recommended: Materialized Path Approach

### Tables

#### 1. `subject_mappings`
Stores the hierarchical curriculum structure.

```sql
CREATE TABLE subject_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) NOT NULL,
  name VARCHAR(500) NOT NULL,
  short_description TEXT,
  level INTEGER NOT NULL, -- 0=subject, 1=grade, 2+=categories
  parent_id UUID REFERENCES subject_mappings(id) ON DELETE CASCADE,
  path VARCHAR(1000) NOT NULL, -- Materialized path: 'mathematics/grade_9_10/halmazok/halmaz_fogalma'
  subject VARCHAR(100) NOT NULL, -- 'mathematics', 'physics', etc.
  grade_level VARCHAR(50), -- 'grade_9_10', 'grade_11_12'
  order_index INTEGER DEFAULT 0, -- For maintaining order within same parent
  is_leaf BOOLEAN DEFAULT FALSE, -- TRUE if this is a leaf node that can have tasks
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(path),
  INDEX idx_subject_grade (subject, grade_level),
  INDEX idx_parent (parent_id),
  INDEX idx_path (path),
  INDEX idx_leaf (is_leaf)
);
```

**Example Data:**
```json
{
  "id": "uuid-1",
  "key": "halmazok",
  "name": "Halmazok",
  "short_description": "Halmazelméleti alapfogalmak...",
  "level": 2,
  "parent_id": "uuid-grade-9-10",
  "path": "mathematics/grade_9_10/halmazok",
  "subject": "mathematics",
  "grade_level": "grade_9_10",
  "order_index": 1,
  "is_leaf": false
}
```

#### 2. `tasks`
Stores individual educational tasks.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  content JSONB NOT NULL, -- Task content (questions, answers, etc.)

  -- Curriculum mapping
  subject_mapping_id UUID NOT NULL REFERENCES subject_mappings(id) ON DELETE RESTRICT,
  subject VARCHAR(100) NOT NULL, -- Denormalized for faster queries
  grade_level VARCHAR(50) NOT NULL, -- Denormalized for faster queries

  -- Metadata
  educational_model VARCHAR(100) DEFAULT 'secular',
  difficulty_level VARCHAR(50), -- 'easy', 'medium', 'hard'
  estimated_duration_minutes INTEGER,

  -- Ratings and engagement
  rating_average DECIMAL(3,2) DEFAULT 0, -- 0.00 to 5.00
  rating_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,

  -- Ownership
  created_by UUID NOT NULL REFERENCES users(id),
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_mapping (subject_mapping_id),
  INDEX idx_subject_grade (subject, grade_level),
  INDEX idx_published (is_published, published_at),
  INDEX idx_rating (rating_average DESC),
  INDEX idx_views (view_count DESC),
  INDEX idx_creator (created_by)
);
```

#### 3. `task_ratings`
Stores user ratings for tasks.

```sql
CREATE TABLE task_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(task_id, user_id),
  INDEX idx_task (task_id)
);
```

#### 4. `task_views`
Tracks task views (optional, for analytics).

```sql
CREATE TABLE task_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous
  viewed_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_task (task_id),
  INDEX idx_user (user_id),
  INDEX idx_viewed_at (viewed_at)
);
```

## Key Design Decisions

### 1. **Materialized Path**
- **Path column**: Stores full path as string (e.g., `'mathematics/grade_9_10/halmazok/halmaz_fogalma'`)
- **Benefits**:
  - Fast ancestor queries: `WHERE path LIKE 'mathematics/grade_9_10/%'`
  - Easy to get full path for breadcrumbs
  - Simple to understand and implement
- **Drawbacks**:
  - Renaming requires updating all children's paths
  - Path length limit (mitigated with VARCHAR(1000))

### 2. **Denormalization**
- Store `subject` and `grade_level` in tasks table for faster filtering
- Store aggregated stats (rating_average, view_count) for performance

### 3. **Leaf Node Flag**
- `is_leaf` boolean indicates nodes that can have tasks assigned
- Prevents tasks from being assigned to intermediate categories

## Migration Strategy

### Step 1: Parse JSON and Insert Hierarchy

```javascript
// Pseudo-code for migration
function migrateSubjectMapping(jsonData, subject) {
  for (const [gradeName, categories] of Object.entries(jsonData)) {
    const gradeNode = insertNode({
      key: gradeName,
      name: formatGradeName(gradeName),
      level: 1,
      subject: subject,
      grade_level: gradeName,
      parent_id: null,
      path: `${subject}/${gradeName}`
    });

    for (const category of categories) {
      insertCategoryRecursive(category, gradeNode.id, `${subject}/${gradeName}`, 2);
    }
  }
}

function insertCategoryRecursive(node, parentId, parentPath, level) {
  const path = `${parentPath}/${node.key}`;
  const isLeaf = !node.sub_topics || node.sub_topics.length === 0;

  const dbNode = insertNode({
    key: node.key,
    name: node.name,
    short_description: node.short_description,
    level: level,
    parent_id: parentId,
    path: path,
    subject: extractSubject(path),
    grade_level: extractGrade(path),
    is_leaf: isLeaf
  });

  if (node.sub_topics) {
    for (const subTopic of node.sub_topics) {
      insertCategoryRecursive(subTopic, dbNode.id, path, level + 1);
    }
  }
}
```

### Step 2: Optimize Indexes

```sql
-- After migration, analyze and optimize
ANALYZE subject_mappings;
ANALYZE tasks;

-- Create additional indexes if needed
CREATE INDEX idx_subject_mappings_subject_path ON subject_mappings(subject, path);
CREATE INDEX idx_tasks_published_rating ON tasks(is_published, rating_average DESC) WHERE is_published = TRUE;
```

## Query Examples

### 1. Get all leaf nodes for a subject and grade

```sql
SELECT * FROM subject_mappings
WHERE subject = 'mathematics'
  AND grade_level = 'grade_9_10'
  AND is_leaf = TRUE
ORDER BY path;
```

### 2. Get all categories under a parent

```sql
SELECT * FROM subject_mappings
WHERE path LIKE 'mathematics/grade_9_10/halmazok/%'
  AND level = 3
ORDER BY order_index;
```

### 3. Get tree structure with task counts

```sql
SELECT
  sm.*,
  COUNT(t.id) as task_count,
  AVG(t.rating_average) as avg_rating
FROM subject_mappings sm
LEFT JOIN tasks t ON t.subject_mapping_id = sm.id AND t.is_published = TRUE
WHERE sm.subject = 'mathematics'
  AND sm.grade_level = 'grade_9_10'
GROUP BY sm.id
ORDER BY sm.path;
```

### 4. Get tasks with full category path

```sql
SELECT
  t.*,
  sm.path as category_path,
  sm.name as category_name,
  u.name as creator_name
FROM tasks t
JOIN subject_mappings sm ON t.subject_mapping_id = sm.id
JOIN users u ON t.created_by = u.id
WHERE t.is_published = TRUE
  AND t.subject = 'mathematics'
  AND t.grade_level = 'grade_9_10'
ORDER BY t.rating_average DESC, t.view_count DESC
LIMIT 50;
```

### 5. Get breadcrumb path for a task

```sql
SELECT
  t.title,
  sm.path,
  string_to_array(sm.path, '/') as breadcrumb_keys
FROM tasks t
JOIN subject_mappings sm ON t.subject_mapping_id = sm.id
WHERE t.id = 'task-uuid';
```

## API Endpoints Needed

### Backend Implementation

1. **GET `/api/subjects/:subject/grades/:grade/tree`**
   - Returns hierarchical tree structure with task counts
   - Used for rendering the tree view

2. **GET `/api/tasks`**
   - Query params: `subject`, `grade`, `category_path`, `search`, `sort`
   - Returns filtered and sorted task list

3. **GET `/api/tasks/:id`**
   - Returns task details with full category path

4. **POST `/api/tasks`** (Teachers only)
   - Creates a new task
   - Requires `subject_mapping_id` (must be a leaf node)

5. **PUT `/api/tasks/:id`** (Teachers only, own tasks)
   - Updates existing task

6. **POST `/api/tasks/:id/rate`** (Authenticated users)
   - Submits a rating (0-5 stars)
   - Updates aggregate rating in tasks table

## Benefits of This Approach

✅ **Flexible**: Easy to add new subjects, grades, or categories
✅ **Fast Queries**: Indexed paths and denormalized data for performance
✅ **Referential Integrity**: Tasks are linked to leaf nodes via foreign keys
✅ **Scalable**: Can handle thousands of tasks and categories
✅ **Breadcrumbs**: Easy to generate navigation paths
✅ **Analytics**: Track views, ratings, and completions

## Next Steps

1. Create migration script to parse JSON files and populate `subject_mappings`
2. Implement backend API endpoints
3. Add Firebase Authentication integration for task creation
4. Implement task rating and view tracking
5. Add search functionality (consider PostgreSQL full-text search or Elasticsearch)
