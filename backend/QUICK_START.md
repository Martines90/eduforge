# Quick Start Guide

Get the EduForge backend up and running in minutes!

## Prerequisites

- Node.js 20+ installed
- npm 10+ installed
- nvm (Node Version Manager) - recommended
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Installation

```bash
# 1. Use the correct Node.js version
nvm use
# Or if Node.js 20 is not installed:
# nvm install 20 && nvm use 20

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env

# 4. Edit .env and add your OpenAI API key
# OPENAI_API_KEY=your_key_here
```

## Running the Server

```bash
# Development mode (recommended for development)
npm run dev

# Development with auto-reload on file changes
npm run dev:watch

# Production mode
npm run build
npm start
```

## First Request

Once the server is running on `http://localhost:3000`:

### Generate a Task

```bash
curl -X POST http://localhost:3000/generate-task \
  -H "Content-Type: application/json" \
  -d '{"topic": "Renaissance mathematics", "numImages": 2}'
```

**Response:**
```json
{
  "id": "task_abc123...",
  "description": "# Your Generated Task...",
  "images": [
    {
      "id": "image_xyz789...",
      "url": "/storage/tasks/task_abc123.../images/image_xyz789....png"
    }
  ]
}
```

### Get a Task

```bash
curl http://localhost:3000/tasks/task_abc123...
```

### Health Check

```bash
curl http://localhost:3000/health
```

## API Documentation

Open your browser and navigate to:

**http://localhost:3000/api-docs**

Here you can:
- Browse all endpoints
- Try requests interactively
- View request/response schemas
- See example data

## Project Structure Overview

```
src/
├── controllers/    # Request handlers
├── routes/        # API routes with Swagger docs
├── services/      # Business logic (AI generation, storage)
├── middleware/    # Express middleware
├── types/         # TypeScript interfaces
├── utils/         # Helper functions
├── config/        # Configuration (Swagger, etc.)
└── genai/         # AI generation prompts
```

## Common Tasks

### Change Server Port
Edit `.env`:
```env
PORT=8080
```

### View Server Logs
Logs are automatically printed to console. In development mode, you'll see:
- HTTP request logs (via Morgan)
- Generation progress logs
- File storage logs

### Access Generated Files

Files are stored in `./storage/tasks/`:

**View task description:**
```
http://localhost:3000/storage/tasks/task_abc123.../description.md
```

**View task image:**
```
http://localhost:3000/storage/tasks/task_abc123.../images/image_xyz789....png
```

## Troubleshooting

### "No OpenAI API key found"
Make sure you've set `OPENAI_API_KEY` in your `.env` file.

### "Port already in use"
Change the port in `.env` or kill the process using port 3000:
```bash
lsof -ti:3000 | xargs kill -9
```

### Build errors
Clean and rebuild:
```bash
rm -rf dist/
npm run build
```

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Check [SWAGGER.md](./SWAGGER.md) for API documentation details
- Review [USAGE.md](./USAGE.md) for more API examples

## Support

For issues or questions, check the documentation or create an issue in the repository.
