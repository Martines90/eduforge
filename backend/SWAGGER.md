# Swagger API Documentation

This project includes comprehensive API documentation using Swagger/OpenAPI 3.0.

## Accessing the Documentation

Once the server is running, you can access the documentation at:

- **Interactive UI**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api-docs.json

## Features

### Interactive Documentation
The Swagger UI provides an interactive interface where you can:
- View all available endpoints
- See request/response schemas
- Test endpoints directly from the browser
- View example requests and responses
- Understand data models and types

### Try It Out
Each endpoint has a "Try it out" button that allows you to:
1. Fill in request parameters
2. Execute the request
3. View the response in real-time
4. See response headers and status codes

## API Overview

### Tags
The API is organized into logical groups:
- **Tasks**: Task generation and retrieval operations
- **Health**: Health check and status endpoints

### Endpoints

#### POST /generate-task
Generate a new educational math task with AI-powered description and images.

**Request Body** (optional):
```json
{
  "topic": "Ancient Roman architecture and engineering",
  "numImages": 2
}
```

**Response** (201 Created):
```json
{
  "id": "task_a1b2c3d4e5f6789012345678901234ab",
  "description": "# Task Title\n\nTask description...",
  "images": [
    {
      "id": "image_x1y2z3a4b5c6789012345678901234xy",
      "url": "/storage/tasks/task_a1b2.../images/image_x1y2....png"
    }
  ]
}
```

#### GET /tasks/{taskId}
Retrieve a previously generated task by its unique ID.

**Parameters**:
- `taskId` (path, required): Unique task identifier

**Response** (200 OK):
```json
{
  "id": "task_a1b2c3d4e5f6789012345678901234ab",
  "description": "# Task Title\n\nTask description...",
  "images": [...]
}
```

**Error Response** (404 Not Found):
```json
{
  "error": "Task not found",
  "message": "No task found with ID: task_invalid123"
}
```

#### GET /health
Check the health status of the API server.

**Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2025-11-22T10:30:00.000Z"
}
```

## Data Models

### Task
Main task object containing generated content.

**Properties**:
- `id` (string): Unique identifier (32-character hex)
- `description` (string): Task description in Markdown
- `images` (TaskImage[]): Array of associated images

### TaskImage
Image associated with a task.

**Properties**:
- `id` (string): Unique image identifier (32-character hex)
- `url` (string): URL path to the image file

### GenerateTaskRequest
Request body for task generation.

**Properties**:
- `topic` (string, optional): Topic or theme for the task
- `numImages` (integer, optional): Number of images (1-5, default: 2)

## Configuration

The Swagger documentation is configured in `src/config/swagger.config.ts`:

```typescript
{
  openapi: "3.0.0",
  info: {
    title: "EduForger API",
    version: "1.0.0",
    description: "...",
  },
  servers: [...],
  tags: [...],
  components: {
    schemas: {...},
    responses: {...}
  }
}
```

## Customization

### Adding New Endpoints
To document a new endpoint, add JSDoc comments to your route file:

```typescript
/**
 * @swagger
 * /your-endpoint:
 *   get:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [YourTag]
 *     parameters:
 *       - in: path
 *         name: paramName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 */
router.get('/your-endpoint/:paramName', handler);
```

### Adding New Schemas
Define new schemas in `swagger.config.ts`:

```typescript
components: {
  schemas: {
    YourNewSchema: {
      type: "object",
      required: ["field1", "field2"],
      properties: {
        field1: {
          type: "string",
          description: "Description",
          example: "Example value"
        },
        field2: {
          type: "integer",
          description: "Description",
          example: 42
        }
      }
    }
  }
}
```

### Changing Swagger UI Appearance
Modify the Swagger UI setup in `src/app.ts`:

```typescript
swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Your API Title",
  customfavIcon: "/your-icon.ico",
})
```

## Security

The Swagger UI is configured to work with Helmet.js security middleware. If you need to modify CSP settings, update `src/app.ts`:

```typescript
helmet({
  contentSecurityPolicy: {
    directives: {
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "https:"],
    },
  },
})
```

## Exporting Documentation

### JSON Format
Export the OpenAPI specification in JSON:
```bash
curl http://localhost:3000/api-docs.json > openapi.json
```

### YAML Format
To convert to YAML, use a tool like `js-yaml`:
```bash
npm install -g js-yaml
curl http://localhost:3000/api-docs.json | js-yaml > openapi.yaml
```

## Best Practices

1. **Keep Documentation Updated**: Update Swagger comments when modifying endpoints
2. **Use Examples**: Provide realistic example values in schemas
3. **Document Errors**: Include all possible error responses
4. **Version Your API**: Use semantic versioning in the API info
5. **Group by Tags**: Organize endpoints logically with tags
6. **Add Descriptions**: Provide clear, concise descriptions for all endpoints

## Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
