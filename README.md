# EduForge

An educational task management platform for teachers and students, featuring AI-powered task generation, curriculum-based organization, and comprehensive task browsing capabilities.

**Live at**: [https://eduforger.com](https://eduforger.com)

## 🎯 Project Overview

EduForge is a full-stack application that enables:
- **Teachers**: Create, manage, and publish educational tasks aligned with curriculum standards
- **Students**: Browse, search, and complete educational tasks organized by subject and grade level
- **Administrators**: Manage curriculum mappings and user accounts

## 🏗️ Architecture

### Frontend (Next.js 14)
- **Location**: `/frontend`
- **Framework**: Next.js 14 (App Router)
- **UI Library**: Material-UI (MUI)
- **Styling**: SCSS Modules
- **State Management**: React Hooks
- **Authentication**: Firebase Auth
- **Hosting**: Firebase Hosting
- **Domain**: eduforger.com
- **Language**: TypeScript

### Backend (Express.js + TypeScript)
- **Location**: `/backend`
- **Framework**: Express.js 5.x
- **Database**: Firebase Firestore
- **Authentication**: Firebase Admin SDK + JWT
- **AI Services**: OpenAI (GPT-4o, DALL-E-3)
- **Hosting**: Firebase Cloud Functions
- **Language**: TypeScript

## 📁 Project Structure

```
app/
├── frontend/                 # Next.js frontend application
│   ├── app/                 # Next.js 14 app directory
│   │   ├── tasks/          # Task browsing page
│   │   ├── task_creator/   # Task creation interface
│   │   ├── my-tasks/       # Teacher's task management
│   │   └── profile/        # User profile page
│   ├── components/          # React components
│   │   ├── atoms/          # Basic UI components
│   │   ├── molecules/      # Composite components
│   │   └── organisms/      # Complex components (TaskTreeView, etc.)
│   ├── lib/                # Utilities and helpers
│   │   ├── firebase/       # Firebase client SDK setup
│   │   ├── i18n/           # Internationalization (EN/HU)
│   │   └── hooks/          # Custom React hooks
│   └── types/              # TypeScript type definitions
│
├── backend/                 # Express.js backend
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── controllers/    # Request controllers
│   │   ├── middleware/     # Express middleware
│   │   └── types/          # TypeScript types
│   ├── firestore.rules     # Firestore security rules
│   ├── firestore.indexes.json  # Firestore composite indexes
│   └── test-firestore-rules.js # Security rules test suite
│
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- Firebase account and project
- OpenAI API key (for AI generation features)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Firebase and OpenAI credentials

# Deploy Firestore indexes and rules
npm run firebase:deploy:firestore

# Start development server
npm run dev
```

Backend runs on: `http://localhost:3000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:3001`

## 🔥 Firebase Setup

### Required Configuration

1. **Create Firebase Project**: https://console.firebase.google.com
2. **Enable Services**:
   - Authentication (Email/Password)
   - Firestore Database
3. **Get Credentials**: Download service account key for backend
4. **Deploy Firestore Resources**:

```bash
cd backend

# Deploy composite indexes (required for queries)
npm run firebase:deploy:indexes

# Deploy security rules
npm run firebase:deploy:rules

# Or deploy both together
npm run firebase:deploy:firestore
```

**Important**: Index deployment takes 5-10 minutes. Monitor progress at:
```
https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/indexes
```

### Firestore Collections

| Collection | Purpose |
|------------|---------|
| `users` | User profiles and authentication data |
| `tasks` | Educational tasks created by teachers |
| `subjectMappings` | Curriculum hierarchy (subjects → grades → topics) |
| `verificationCodes` | Email verification codes |

### Security Rules

- ✅ Published tasks are publicly readable
- ✅ Only verified teachers can create/edit tasks
- ✅ Users can only modify their own data
- ✅ Ratings must be 0-5 stars
- 🔒 Unpublished tasks visible only to creator

Test security rules locally:
```bash
cd backend
npm run emulators:start    # Terminal 1
npm run test:rules          # Terminal 2
```

## 🌟 Key Features

### Task Browsing (TaskTreeView)
- Hierarchical curriculum tree navigation
- Expandable leaf nodes with lazy-loaded tasks
- Filter by subject and grade level
- Sort by rating, views, or recency
- Teacher-specific "Create Task" CTAs

### Task Creation
- Pre-populated curriculum path from URL params
- AI-powered task generation (optional)
- Rich text editor for task content
- Difficulty level selection
- Tag management
- Publish/Draft status

### User Authentication
- Firebase Authentication
- Email verification required for teachers
- Role-based access control (teacher/student)
- Subject specialization for teachers

### Internationalization
- English (EN) and Hungarian (HU) support
- Translation keys in `/frontend/lib/i18n/translations/`
- Easy to add more languages

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Verify email with code

### Tasks (v2)
- `GET /api/v2/tasks` - List tasks (with filters, pagination)
- `GET /api/v2/tasks/:id` - Get task by ID
- `POST /api/v2/tasks` - Create task (teachers only)
- `PUT /api/v2/tasks/:id` - Update task (owner only)
- `DELETE /api/v2/tasks/:id` - Delete task (owner only)
- `POST /api/v2/tasks/:id/rate` - Rate a task
- `GET /api/v2/tasks/:id/ratings` - Get task ratings

### Curriculum
- `GET /api/tree-map/:subject/:gradeLevel` - Get curriculum tree
- `GET /api/subject-mapping` - List subject mappings
- `GET /api/subject-mapping/:id` - Get specific mapping

### Health & Docs
- `GET /health` - Health check
- `GET /api-docs` - Swagger UI documentation

See backend README for detailed API documentation.

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Test security rules
npm run emulators:start
npm run test:rules
```

### Frontend Build
```bash
cd frontend
npm run build
```

## 📝 Development Scripts

### Backend
```bash
npm run dev              # Start dev server
npm run build            # Compile TypeScript
npm run test             # Run tests
npm run lint             # Lint code
npm run firebase:deploy  # Deploy to Firebase
```

### Frontend
```bash
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Lint code
```

## 🔒 Environment Variables

### Backend (.env)
```env
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=your_openai_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
JWT_SECRET=your_jwt_secret
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

## 📚 Documentation

- **Backend**: `/backend/README.md` - API, Firebase setup, scripts
- **Frontend**: `/frontend/README.md` - Components, routing, styling
- **Firebase Deployment**: `/backend/FIREBASE_DEPLOYMENT_GUIDE.md`
- **Firestore Indexes**: `/backend/FIRESTORE_INDEXES_REQUIRED.md`
- **Tree Map API**: `/TREE_MAP_API_SUMMARY.md`

## 🌐 Deployment

### Production Deployment (Firebase)

**Live URL**: https://eduforger.com (and https://www.eduforger.com)
**Firebase Project**: eduforge-d29d9

#### Deploy Full Application
```bash
cd backend
firebase deploy
```

This deploys:
- Frontend (Next.js) → Firebase Hosting
- Backend (Express) → Firebase Cloud Functions
- Firestore rules and indexes

#### Deploy Specific Components
```bash
# Frontend only
firebase deploy --only hosting

# Backend functions only
firebase deploy --only functions

# Firestore rules and indexes
firebase deploy --only firestore

# Cloud Functions
firebase deploy --only functions:api
```

### Custom Domain Configuration

Domain: **eduforger.com** (registered via Squarespace Domains)

**DNS Records** (configured in Squarespace):
```
Type: A
Host: @
Data: 199.36.158.100

Type: TXT
Host: @
Data: hosting-site=eduforge-d29d9

Type: CNAME
Host: www
Data: eduforge-d29d9.web.app
```

**SSL Certificate**: Automatically provisioned by Firebase (Let's Encrypt)

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test
3. Lint and format: `npm run lint:fix && npm run format`
4. Commit changes: `git commit -m "Add my feature"`
5. Push and create PR

## 📄 License

MIT

## 🆘 Support

For issues and questions:
1. Check documentation in `/backend` and `/frontend` directories
2. Review Firebase console for errors
3. Check browser console for client-side errors
4. Review backend logs for server-side errors

---

**Built with**: Next.js, Express.js, Firebase, OpenAI, TypeScript, Material-UI

**Production URL**: https://eduforger.com

**Last Updated**: 2025-12-24
