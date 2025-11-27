# Authentication & Authorization Middleware Guide

This guide explains how to use authentication and authorization middleware in the EduForge backend API.

## Overview

The backend now has comprehensive authentication and authorization middleware to protect sensitive endpoints. The task generation endpoint (`POST /generate-task`) now requires:
1. **Authentication** - User must be logged in with a valid JWT token
2. **Authorization** - User must have the `teacher` role

## Middleware Components

### 1. `authenticate` Middleware

Location: `/src/middleware/auth.middleware.ts`

Verifies JWT token and attaches user information to the request object.

**What it does:**
- Extracts JWT token from `Authorization` header
- Verifies token validity and expiration
- Attaches decoded user info to `req.user`
- Returns 401 if token is missing or invalid

**Usage:**
```typescript
import { authenticate } from '../middleware/auth.middleware';

router.get('/protected', authenticate, controller.method);
```

**Request:**
```bash
curl -X GET http://localhost:3000/api/protected \
  -H "Authorization: Bearer <jwt_token>"
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

### 2. `requireTeacher` Middleware

Location: `/src/middleware/auth.middleware.ts`

Checks if the authenticated user has the `teacher` role.

**What it does:**
- Checks `req.user.role` (set by `authenticate` middleware)
- Returns 403 if user is not a teacher
- Must be used after `authenticate` middleware

**Usage:**
```typescript
import { authenticate, requireTeacher } from '../middleware/auth.middleware';

router.post('/teacher-only', authenticate, requireTeacher, controller.method);
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User is not a teacher

### 3. `requireAuthenticatedTeacher` Combined Middleware

Location: `/src/middleware/auth.middleware.ts`

Convenience middleware that combines both `authenticate` and `requireTeacher`.

**Usage:**
```typescript
import { requireAuthenticatedTeacher } from '../middleware/auth.middleware';

router.post('/teacher-only', requireAuthenticatedTeacher, controller.method);
```

## Protected Endpoints

### Task Generation - Teacher Only

**Endpoint:** `POST /api/generate-task`

**Requirements:**
- Valid JWT token
- User role: `teacher`

**Request:**
```bash
curl -X POST http://localhost:3000/api/generate-task \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "curriculum_path": "math:grade_9_10:algebra:linear_equations",
    "country_code": "US",
    "target_group": "mixed",
    "difficulty_level": "medium",
    "educational_model": "secular",
    "number_of_images": 2
  }'
```

**Responses:**

✅ **201 Created** - Task generated successfully
```json
{
  "task_id": "task_abc123...",
  "status": "generated",
  "task_data": {
    "description": "...",
    "images": [...]
  }
}
```

❌ **401 Unauthorized** - No token or invalid token
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authorization header is required"
}
```

❌ **403 Forbidden** - User is not a teacher
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "This endpoint requires teacher role"
}
```

## Authentication Flow

### 1. User Registration

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "teacher@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "role": "teacher",
  "country": "US"
}
```

**Response:** Verification code sent (check server logs in development)

### 2. Email Verification

```bash
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "teacher@example.com",
  "code": "123456"
}
```

**Response:** User created and JWT token returned
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "uid": "abc123",
      "email": "teacher@example.com",
      "name": "John Doe",
      "emailVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Login (Returning Users)

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "teacher@example.com",
  "password": "securepassword"
}
```

**Response:** JWT token returned
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "uid": "abc123",
      "email": "teacher@example.com",
      "name": "John Doe",
      "role": "teacher"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. Use Token for Protected Endpoints

Store the JWT token and include it in the `Authorization` header for all protected requests:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## JWT Token Structure

The JWT token contains the following payload:

```typescript
{
  uid: string;           // User ID from Firebase
  email: string;         // User email
  role: 'teacher' | 'general_user';  // User role
  iat: number;           // Issued at timestamp
  exp: number;           // Expiration timestamp (7 days)
}
```

## Adding Protection to New Endpoints

### Example 1: Require Authentication Only

```typescript
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

router.get('/profile', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.uid;

  // Your logic here
});
```

### Example 2: Require Teacher Role

```typescript
import { requireAuthenticatedTeacher, AuthRequest } from '../middleware/auth.middleware';

router.post('/create-assignment', requireAuthenticatedTeacher, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const teacherId = authReq.user?.uid;

  // Your logic here - only teachers can reach this
});
```

### Example 3: Custom Role Check

```typescript
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;

  // Add custom admin check logic
  if (authReq.user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Admin access required'
    });
    return;
  }

  next();
};

router.delete('/users/:id', authenticate, requireAdmin, controller.deleteUser);
```

## Accessing User Info in Controllers

After authentication middleware runs, user info is available on the request:

```typescript
import { AuthRequest } from '../middleware/auth.middleware';

export class MyController {
  myMethod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthRequest;

    // Access authenticated user info
    const userId = authReq.user?.uid;
    const userEmail = authReq.user?.email;
    const userRole = authReq.user?.role;

    console.log(`Request from ${userEmail} (${userRole})`);

    // Your logic here
  };
}
```

## Testing Protected Endpoints

### Using cURL

```bash
# 1. Login to get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"password"}' \
  | jq -r '.data.token')

# 2. Use token to access protected endpoint
curl -X POST http://localhost:3000/api/generate-task \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "curriculum_path": "math:grade_9_10:algebra:linear_equations",
    "country_code": "US",
    "target_group": "mixed",
    "difficulty_level": "medium",
    "educational_model": "secular",
    "number_of_images": 0
  }'
```

### Using Postman

1. **Login:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "teacher@example.com",
       "password": "password"
     }
     ```
   - Copy the `token` from response

2. **Generate Task:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/generate-task`
   - Headers:
     - `Authorization`: `Bearer <paste_token_here>`
     - `Content-Type`: `application/json`
   - Body (JSON): Task generation request

### Using JavaScript Fetch

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'teacher@example.com',
    password: 'password',
  }),
});

const { data } = await loginResponse.json();
const token = data.token;

// 2. Generate task
const taskResponse = await fetch('http://localhost:3000/api/generate-task', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    curriculum_path: 'math:grade_9_10:algebra:linear_equations',
    country_code: 'US',
    target_group: 'mixed',
    difficulty_level: 'medium',
    educational_model: 'secular',
    number_of_images: 2,
  }),
});

const taskData = await taskResponse.json();
console.log('Task generated:', taskData);
```

## Error Handling

### Common Errors

**401 Unauthorized - Missing Token**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authorization header is required"
}
```

**401 Unauthorized - Invalid Token**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

**403 Forbidden - Not a Teacher**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "This endpoint requires teacher role"
}
```

## Security Best Practices

1. **Never expose JWT_SECRET** - Keep it in `.env` file and never commit it
2. **Use HTTPS in production** - Tokens should always be transmitted over secure connections
3. **Set appropriate token expiration** - Default is 7 days, adjust based on security requirements
4. **Validate token on every request** - Never trust client-side role checks
5. **Log authentication failures** - Monitor for suspicious activity
6. **Rotate secrets regularly** - Update JWT_SECRET periodically in production

## Environment Variables

Required environment variables:

```bash
# .env file
JWT_SECRET=your-secure-random-secret-key-change-this-in-production
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Swagger Documentation

The protected endpoints are documented in Swagger with security requirements:

```yaml
security:
  - bearerAuth: []
```

Access Swagger UI at: `http://localhost:3000/api-docs`

Click "Authorize" button and enter: `Bearer <your_token>`

## Troubleshooting

**Problem:** "Authorization header is required"
- **Solution:** Add `Authorization: Bearer <token>` header to request

**Problem:** "Invalid or expired token"
- **Solution:** Login again to get a fresh token (tokens expire after 7 days)

**Problem:** "This endpoint requires teacher role"
- **Solution:** Ensure the user account has `role: 'teacher'` in the database

**Problem:** Token works locally but not in production
- **Solution:** Ensure JWT_SECRET is set correctly in production environment

## Related Files

- `/src/middleware/auth.middleware.ts` - Middleware implementation
- `/src/routes/task.routes.ts` - Task routes with protection
- `/src/services/auth.service.ts` - Authentication service
- `/src/types/auth.types.ts` - Type definitions
