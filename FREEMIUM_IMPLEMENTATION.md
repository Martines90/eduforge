# EduForge Freemium Implementation

## Overview
This document tracks the implementation of the freemium model for EduForge, allowing guest users to generate 3 free tasks before requiring registration.

## Completed ✅

### Backend
1. **Guest Authentication System** (`backend/src/services/guest-auth.service.ts`)
   - JWT-based guest tokens with 24-hour expiry
   - In-memory session tracking (sessionId → GuestSession)
   - Generation limit enforcement (3 free generations)
   - Rate limiting by IP address
   - Automatic session cleanup

2. **Guest Auth Middleware** (`backend/src/middleware/guest-auth.middleware.ts`)
   - `authenticateOrGuest`: Allows both authenticated and guest requests
   - `requireAuthOrGuest`: Blocks requests without valid auth/guest token
   - Extended request types with guest metadata

3. **Guest Auth Controller** (`backend/src/controllers/guest-auth.controller.ts`)
   - `POST /api/auth/guest-token`: Create guest session
   - `GET /api/auth/guest-status`: Check remaining generations

4. **Task Generation for Guests** (`backend/src/controllers/task.controller.ts`)
   - `POST /generate-task-guest`: Generate tasks without auth
   - Tracks generation count per guest session
   - Returns guest metadata (generations used/remaining)
   - Images stored permanently in Firebase Storage

5. **Routes** (`backend/src/routes/`)
   - Added guest-auth.routes.ts
   - Added /generate-task-guest endpoint to task.routes.ts
   - Integrated into main index.ts

## In Progress 🚧

### Frontend
1. **Freemium Hook** (`frontend/lib/hooks/useFreemiumGeneration.ts`)
   - Track generation count in sessionStorage
   - Manage guest tokens
   - Check if user can generate more tasks
   - Store pending tasks for post-registration

## Pending ⏳

### Frontend
1. **Public /task_generator Page**
   - Parse URL params (subject, grade_lvl, lvl_1, lvl_2, etc.)
   - No authentication required
   - Show "X/3 free generations remaining" banner
   - Use useFreemiumGeneration hook
   - Disable Save/Download until registered

2. **TaskResult Component Updates**
   - Add `freemiumMode` prop
   - Lock Save/Download buttons with overlay
   - Show "Sign up to save and download" CTA

3. **Rename /tasks → /task-search**
   - Update page route
   - Add subject selection filter
   - Make publicly accessible
   - Update all internal links

4. **Update Home Page**
   - Remove authentication requirement
   - Show different CTAs for guests vs authenticated

5. **Navigation Updates**
   - Update Header component
   - Fix all internal links to new routes

## Backend API Endpoints

### Guest Authentication
- `POST /api/auth/guest-token` - Create a guest session
  - Returns: `{ token, sessionId, maxGenerations, generationsRemaining }`

- `GET /api/auth/guest-status` - Check guest session status
  - Requires: Guest token in Authorization header
  - Returns: Session details and remaining generations

### Task Generation
- `POST /generate-task-guest` - Generate task (guest or authenticated)
  - Requires: Guest token OR user token
  - Body: Standard TaskGeneratorRequest
  - Returns: Task data + guest_metadata (if guest)

### Existing Endpoints (Authenticated Only)
- `POST /generate-task` - Generate task (requires teacher + subscription)
- `POST /save-task` - Save task to database (requires auth)

## Google Ads URL Structure

```
https://eduforger.com/task_generator?subject=physics&grade_lvl=9_10&lvl_1=motion&lvl_2=newton_first_law

https://eduforger.com/task_generator?subject=mathematics&grade_lvl=11_12&lvl_1=calculus&lvl_2=derivatives
```

## SessionStorage Schema

```typescript
interface FreemiumSession {
  guestToken: string;
  sessionId: string;
  generationsUsed: number;
  generationsLimit: number;
  pendingTasks: PendingTask[];
}

interface PendingTask {
  taskId: string;
  description: string;
  solution: string;
  images: { id: string; url: string }[];
  curriculumPath: string;
  timestamp: number;
}
```

## Migration Strategy

### Phase 1: Parallel Routes (Current)
- Keep `/task_creator` (authenticated, teacher-only)
- Add `/task_generator` (public, freemium)
- Both routes coexist for testing

### Phase 2: Google Ads Launch
- Point all Google Ads to `/task_generator`
- Monitor conversion rates
- A/B test generation limits (3 vs 5)

### Phase 3: Consolidation (Optional)
- Merge routes if freemium proves successful
- Redirect authenticated users appropriately

## Conversion Funnel

1. **Google Ad Click** → `/task_generator?subject=...`
2. **Landing** → No login required, auto-create guest token
3. **Generation 1-3** → Track in sessionStorage
4. **Attempt to Save/Download** → Block with registration modal
5. **Registration** → Restore pending tasks from sessionStorage
6. **Post-Registration** → Redirect back to task, enable save/download

## Anti-Abuse Measures

1. **Session Limits**: 3 generations per guest token
2. **IP Rate Limiting**: 10 generations per IP per hour
3. **Token Expiry**: Guest tokens expire after 24 hours
4. **Session Cleanup**: Expired sessions removed hourly
5. **Future**: Add CAPTCHA after 2nd generation

## Testing Checklist

### Backend
- [ ] Guest token creation works
- [ ] Guest token verification works
- [ ] Generation counting increments correctly
- [ ] Limit enforcement blocks 4th generation
- [ ] IP rate limiting works
- [ ] Session cleanup runs periodically

### Frontend
- [ ] Guest can generate 3 tasks without auth
- [ ] Generation counter displays correctly
- [ ] Save/Download buttons locked for guests
- [ ] Registration modal shows on button click
- [ ] Pending tasks restored after registration
- [ ] URL params parsed and applied correctly

## Next Steps

1. Complete frontend useFreemiumGeneration hook
2. Create public /task_generator page
3. Update TaskResult component for freemium mode
4. Rename /tasks to /task-search
5. Update home page to be public
6. Update navigation and all internal links
7. Test end-to-end guest flow
8. Deploy to staging
9. Set up Google Ads campaigns
10. Monitor conversion metrics
