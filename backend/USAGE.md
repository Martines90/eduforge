# API Usage Examples

## Starting the Server

```bash
# Development mode
npm run dev

# Development with auto-reload
npm run dev:watch

# Production mode
npm run prod
```

The server will start on `http://localhost:3000` by default.

## Generate a New Task

### Using curl

```bash
# Generate a task with default settings (2 images)
curl -X POST http://localhost:3000/generate-task \
  -H "Content-Type: application/json"

# Generate a task with a specific topic
curl -X POST http://localhost:3000/generate-task \
  -H "Content-Type: application/json" \
  -d '{"topic": "Ancient Roman architecture and engineering"}'

# Generate a task with custom number of images
curl -X POST http://localhost:3000/generate-task \
  -H "Content-Type: application/json" \
  -d '{"topic": "Renaissance mathematics", "numImages": 3}'
```

### Using JavaScript/Fetch

```javascript
// Generate a task
const response = await fetch('http://localhost:3000/generate-task', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    topic: 'Medieval trade routes',
    numImages: 2
  })
});

const task = await response.json();
console.log('Task ID:', task.id);
console.log('Description:', task.description);
console.log('Images:', task.images);
```

### Response Example

```json
{
  "id": "task_a1b2c3d4e5f6789012345678901234ab",
  "description": "# The Great Canal of 1855\n\nAs chief engineer for the Imperial Navigation Company in March 1855...",
  "images": [
    {
      "id": "image_x1y2z3a4b5c6789012345678901234xy",
      "url": "/storage/tasks/task_a1b2c3d4e5f6789012345678901234ab/images/image_x1y2z3a4b5c6789012345678901234xy.png"
    },
    {
      "id": "image_m1n2o3p4q5r6789012345678901234mn",
      "url": "/storage/tasks/task_a1b2c3d4e5f6789012345678901234ab/images/image_m1n2o3p4q5r6789012345678901234mn.png"
    }
  ]
}
```

## Get a Task by ID

### Using curl

```bash
curl http://localhost:3000/tasks/task_a1b2c3d4e5f6789012345678901234ab
```

### Using JavaScript/Fetch

```javascript
const taskId = 'task_a1b2c3d4e5f6789012345678901234ab';
const response = await fetch(`http://localhost:3000/tasks/${taskId}`);
const task = await response.json();

console.log('Task:', task);
```

### Response Example

```json
{
  "id": "task_a1b2c3d4e5f6789012345678901234ab",
  "description": "# The Great Canal of 1855\n\nAs chief engineer...",
  "images": [
    {
      "id": "image_x1y2z3a4b5c6789012345678901234xy",
      "url": "/storage/tasks/task_a1b2c3d4e5f6789012345678901234ab/images/image_x1y2z3a4b5c6789012345678901234xy.png"
    }
  ]
}
```

## Access Task Files Directly

Once a task is generated, you can access its files directly:

### Description (Markdown)
```
http://localhost:3000/storage/tasks/task_a1b2c3d4.../description.md
```

### Images (PNG)
```
http://localhost:3000/storage/tasks/task_a1b2c3d4.../images/image_x1y2z3a4....png
```

## Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-22T10:30:00.000Z"
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

### 404 - Task Not Found
```json
{
  "error": "Task not found",
  "message": "No task found with ID: task_invalid123"
}
```

### 500 - Internal Server Error
```json
{
  "error": "Error message here",
  "stack": "Stack trace (only in development mode)"
}
```

## File Storage Structure

Generated tasks are stored in the following structure:

```
storage/
└── tasks/
    └── task_[32_char_random_string]/
        ├── description.md
        └── images/
            ├── image_[32_char_random_string].png
            └── image_[32_char_random_string].png
```

Each task and image ID is a cryptographically secure random 32-character hexadecimal string, ensuring uniqueness and preventing collisions.
