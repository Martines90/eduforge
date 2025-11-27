# Testing the Protected Task Generation Endpoint

This guide provides step-by-step instructions to test the newly protected task generation endpoint.

## Prerequisites

- Backend server running on `http://localhost:3000`
- curl, Postman, or similar HTTP client

## Testing Flow

### Step 1: Register a Teacher Account

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123",
    "name": "John Teacher",
    "role": "teacher",
    "country": "US"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Verification code sent to email. Please verify to complete registration.",
  "data": {
    "code": "123456"
  }
}
```

Note the verification code from the response (in development mode).

### Step 2: Verify Email with Code

```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "code": "123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Email verified successfully. Account created.",
  "data": {
    "user": {
      "uid": "abc123xyz",
      "email": "teacher@example.com",
      "name": "John Teacher",
      "emailVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJhYmMxMjN4eXoiLCJlbWFpbCI6InRlYWNoZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoidGVhY2hlciIsImlhdCI6MTY5..."
  }
}
```

**Important:** Save the `token` value from the response. You'll need it for the next steps.

### Step 3: Test Task Generation (With Token - Should Succeed)

```bash
curl -X POST http://localhost:3000/api/generate-task \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "curriculum_path": "math:grade_9_10:algebra:linear_equations:solving_basic_equations",
    "country_code": "US",
    "target_group": "mixed",
    "difficulty_level": "medium",
    "educational_model": "secular",
    "number_of_images": 0,
    "display_template": "modern",
    "precision_settings": {
      "constant_precision": 2,
      "intermediate_precision": 4,
      "final_answer_precision": 2,
      "use_exact_values": false
    },
    "custom_keywords": [],
    "template_id": ""
  }'
```

Replace `YOUR_TOKEN_HERE` with the actual token from Step 2.

**Expected Response (Success):**
```json
{
  "task_id": "task_abc123...",
  "status": "generated",
  "task_data": {
    "description": "...",
    "images": []
  }
}
```

### Step 4: Test Without Token (Should Fail with 401)

```bash
curl -X POST http://localhost:3000/api/generate-task \
  -H "Content-Type: application/json" \
  -d '{
    "curriculum_path": "math:grade_9_10:algebra:linear_equations:solving_basic_equations",
    "country_code": "US",
    "target_group": "mixed",
    "difficulty_level": "medium",
    "educational_model": "secular",
    "number_of_images": 0
  }'
```

**Expected Response (Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authorization header is required"
}
```

### Step 5: Register a Non-Teacher Account

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123",
    "name": "Jane Student",
    "role": "general_user",
    "country": "US"
  }'
```

Then verify with the code:

```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "code": "CODE_FROM_PREVIOUS_RESPONSE"
  }'
```

Save the token from this response.

### Step 6: Test Non-Teacher Access (Should Fail with 403)

```bash
curl -X POST http://localhost:3000/api/generate-task \
  -H "Authorization: Bearer STUDENT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "curriculum_path": "math:grade_9_10:algebra:linear_equations:solving_basic_equations",
    "country_code": "US",
    "target_group": "mixed",
    "difficulty_level": "medium",
    "educational_model": "secular",
    "number_of_images": 0
  }'
```

**Expected Response (Forbidden):**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "This endpoint requires teacher role"
}
```

## Quick Test Script

Save this as `test-auth.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3000"

echo "=== Step 1: Register Teacher ==="
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123",
    "name": "John Teacher",
    "role": "teacher",
    "country": "US"
  }')

echo $REGISTER_RESPONSE | jq '.'

CODE=$(echo $REGISTER_RESPONSE | jq -r '.data.code')
echo "Verification Code: $CODE"

echo -e "\n=== Step 2: Verify Email ==="
VERIFY_RESPONSE=$(curl -s -X POST $API_URL/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"teacher@example.com\",
    \"code\": \"$CODE\"
  }")

echo $VERIFY_RESPONSE | jq '.'

TOKEN=$(echo $VERIFY_RESPONSE | jq -r '.data.token')
echo "JWT Token: $TOKEN"

echo -e "\n=== Step 3: Test Task Generation (Should Succeed) ==="
curl -s -X POST $API_URL/api/generate-task \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "curriculum_path": "math:grade_9_10:algebra:linear_equations:solving_basic_equations",
    "country_code": "US",
    "target_group": "mixed",
    "difficulty_level": "medium",
    "educational_model": "secular",
    "number_of_images": 0,
    "display_template": "modern",
    "precision_settings": {
      "constant_precision": 2,
      "intermediate_precision": 4,
      "final_answer_precision": 2,
      "use_exact_values": false
    },
    "custom_keywords": [],
    "template_id": ""
  }' | jq '.'

echo -e "\n=== Step 4: Test Without Token (Should Fail) ==="
curl -s -X POST $API_URL/api/generate-task \
  -H "Content-Type: application/json" \
  -d '{
    "curriculum_path": "math:grade_9_10:algebra:linear_equations:solving_basic_equations",
    "country_code": "US",
    "target_group": "mixed",
    "difficulty_level": "medium",
    "educational_model": "secular",
    "number_of_images": 0
  }' | jq '.'
```

Make it executable and run:
```bash
chmod +x test-auth.sh
./test-auth.sh
```

## Expected Results Summary

| Test Case | Expected Status | Expected Message |
|-----------|----------------|------------------|
| Teacher with valid token | ✅ 201 Created | Task generated successfully |
| No token provided | ❌ 401 Unauthorized | Authorization header is required |
| Invalid/expired token | ❌ 401 Unauthorized | Invalid or expired token |
| Non-teacher with valid token | ❌ 403 Forbidden | This endpoint requires teacher role |

## Troubleshooting

### "Email already registered"
The email was used before. Either:
- Use a different email
- Delete the user from Firebase Console
- Check the `users` collection in Firestore

### "Invalid token"
The token might be expired (7 days expiration). Login again to get a new token.

### "Firebase not initialized"
Make sure your `.env` file has valid Firebase credentials:
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### Server not responding
Make sure the backend server is running:
```bash
cd backend
npm run dev
```

## Integration with Frontend

Once tested, update your frontend to include the token in requests:

```typescript
const response = await fetch('http://localhost:3000/api/generate-task', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(taskRequest),
});

if (response.status === 401) {
  // Redirect to login
  router.push('/login');
} else if (response.status === 403) {
  // Show "Teacher access required" message
  alert('This feature is only available to teachers');
}
```
