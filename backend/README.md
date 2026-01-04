# EduForger Backend

A TypeScript-based Express.js backend for generating educational math tasks with AI-powered text and image generation.

## Features

- RESTful API with Express.js
- TypeScript for type safety
- OpenAI integration (GPT-4o for text, DALL-E-3 for images)
- Structured file storage system
- CORS and security middleware
- Error handling and logging
- Health check endpoint
- Swagger/OpenAPI documentation

## Project Structure

```
src/
├── controllers/       # Request handlers
│   └── task.controller.ts
├── routes/           # API route definitions
│   ├── task.routes.ts
│   └── index.ts
├── services/         # Business logic
│   ├── text-generator.service.ts
│   ├── image-generator.service.ts
│   ├── task-generator.service.ts
│   └── task-storage.service.ts
├── middleware/       # Express middleware
│   └── error-handler.ts
├── types/           # TypeScript type definitions
│   ├── task.types.ts
│   ├── generator.types.ts
│   └── index.ts
├── utils/           # Utility functions
│   ├── id-generator.ts
│   ├── file-manager.ts
│   └── index.ts
├── config/          # Configuration files
│   └── swagger.config.ts
├── genai/           # AI generation assets
│   └── prompts/
│       └── task_generation.md
├── config.ts        # Application configuration
├── app.ts          # Express app setup
└── index.ts        # Server entry point
```

## Storage Structure

Tasks are stored in the following structure:

```
storage/
└── tasks/
    └── task_[32_char_random_string]/
        ├── description.md
        └── images/
            └── image_[32_char_random_string].png
```

## API Endpoints

### POST /generate-task

Generates a new educational math task with description and images.

**Request Body:**
```json
{
  "topic": "optional topic or theme",
  "numImages": 2
}
```

**Response:**
```json
{
  "id": "task_abc123...",
  "description": "Task description in markdown...",
  "images": [
    {
      "id": "image_xyz789...",
      "url": "/storage/tasks/task_abc123.../images/image_xyz789....png"
    }
  ]
}
```

### GET /tasks/:taskId

Retrieves a specific task by ID.

**Response:**
```json
{
  "id": "task_abc123...",
  "description": "Task description in markdown...",
  "images": [
    {
      "id": "image_xyz789...",
      "url": "/storage/tasks/task_abc123.../images/image_xyz789....png"
    }
  ]
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-22T..."
}
```

### GET /storage/*

Serves static files (images, markdown) from the storage directory.

### GET /api-docs

Interactive Swagger UI documentation for the API.

### GET /api-docs.json

OpenAPI 3.0 specification in JSON format.

## Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- OpenAI API key

## Setup

1. **Use the correct Node.js version (with nvm):**
   ```bash
   nvm use
   # This will automatically use Node.js 20 as specified in .nvmrc

   # Or install Node.js 20 if not already installed:
   nvm install 20
   nvm use 20
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your OpenAI API key.

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Start the server:**
   ```bash
   # Development mode
   npm run dev

   # Development mode with auto-reload
   npm run dev:watch

   # Production mode
   npm run prod
   ```

6. **Access API documentation:**
   Open your browser and navigate to `http://localhost:3000/api-docs`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `TEXT_MODEL` | OpenAI text model | `gpt-4o` |
| `IMAGE_MODEL` | OpenAI image model | `dall-e-3` |
| `STORAGE_DIR` | Task storage directory | `./storage` |
| `OUTPUT_DIR` | Output directory | `./output` |
| `CORS_ORIGIN` | CORS allowed origins | `*` |

## Development

The backend follows best practices:

- **Separation of Concerns**: Controllers, services, and routes are separated
- **Type Safety**: Full TypeScript coverage with custom types
- **Error Handling**: Centralized error handling middleware
- **Security**: Helmet.js for security headers, CORS configuration
- **Logging**: Morgan for HTTP request logging
- **Clean Code**: Utility functions, DRY principles

## Scripts

### Development
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start the production server
- `npm run dev` - Start development server
- `npm run dev:watch` - Start development server with auto-reload
- `npm run prod` - Build and start production server
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Lint TypeScript files
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

### Firebase Deployment
- `npm run firebase:deploy` - Deploy everything to Firebase
- `npm run firebase:deploy:firestore` - Deploy Firestore indexes and rules
- `npm run firebase:deploy:indexes` - Deploy only Firestore indexes
- `npm run firebase:deploy:rules` - Deploy only Firestore security rules

### Firebase Testing
- `npm run emulators:start` - Start Firebase Firestore emulator
- `npm run emulators:kill` - Kill Firebase emulator processes
- `npm run test:rules` - Run Firestore security rules tests
- `npm run test:rules:watch` - Run rules tests in watch mode

## Technology Stack

- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.x
- **AI Services**: OpenAI (GPT-4o, DALL-E-3)
- **Documentation**: Swagger/OpenAPI 3.0
- **Security**: Helmet, CORS
- **Logging**: Morgan
- **Runtime**: Node.js 20.x

## API Documentation

The API is fully documented using Swagger/OpenAPI 3.0 specification. Once the server is running, you can access:

- **Interactive Documentation**: `http://localhost:3000/api-docs`
- **OpenAPI Spec (JSON)**: `http://localhost:3000/api-docs.json`

The Swagger UI provides:
- Complete endpoint documentation
- Request/response schemas
- Interactive "Try it out" functionality
- Example requests and responses
- Schema definitions for all data models

## Firebase Setup

### Firestore Database

This project uses Firebase Firestore for data persistence. The following resources are configured:

#### Collections
- **users** - User profiles and authentication data
- **tasks** - Educational tasks created by teachers
- **subjectMappings** - Curriculum hierarchy (subjects, grades, topics)
- **verificationCodes** - Email verification codes

#### Composite Indexes

The application requires 10 composite indexes for efficient querying. Deploy them using:

```bash
npm run firebase:deploy:indexes
```

See `firestore.indexes.json` for the complete index definitions.

#### Security Rules

Firestore security rules protect data access:
- ✅ Published tasks are publicly readable
- ✅ Only verified teachers can create tasks
- ✅ Users can only modify their own data
- ✅ Rating validation (0-5 stars)

Deploy security rules using:

```bash
npm run firebase:deploy:rules
```

See `firestore.rules` for the complete rule definitions.

#### Testing Security Rules

Run automated tests for security rules:

```bash
# Terminal 1: Start emulator
npm run emulators:start

# Terminal 2: Run tests
npm run test:rules
```

### Firebase Deployment Guide

For detailed Firebase deployment instructions, see:
- `FIREBASE_DEPLOYMENT_GUIDE.md` - Complete deployment documentation
- `FIRESTORE_INDEXES_REQUIRED.md` - Index specifications and requirements

Quick deployment:
```bash
# Deploy both indexes and rules
npm run firebase:deploy:firestore

# Wait 5-10 minutes for indexes to build
# Check status at: https://console.firebase.google.com/project/eduforge-d29d9/firestore/indexes
```

## License

MIT
