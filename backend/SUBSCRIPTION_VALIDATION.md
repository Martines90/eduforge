# Subscription Validation and Access Control

This document describes the subscription validation middleware and access control implemented for EduForge.

## Overview

All task-related operations now properly validate:
1. User authentication
2. Active subscription status
3. Subscription tier requirements
4. Task generation credits

## Middleware Functions

### 1. `requireActiveSubscription`

**Purpose:** Ensures user has an active (non-expired) subscription before allowing task operations.

**Location:** `/backend/src/middleware/role.middleware.ts`

**Checks:**
- User has a subscription
- Subscription status is 'active'
- Subscription end date has not passed

**Error Messages:**
- No subscription: `"Your subscription has ended! Go to My Subscriptions and pick a plan!"`
- Inactive status: `"Your [Tier] plan subscription has ended! Go to My Subscriptions and pick/restart a plan!"`
- Expired date: `"Your [Tier] plan subscription has ended! Go to My Subscriptions and pick/restart a plan!"`

**Error Codes:**
- `NO_SUBSCRIPTION`
- `SUBSCRIPTION_INACTIVE`
- `SUBSCRIPTION_EXPIRED`

### 2. `requireBasicPlan`

**Purpose:** Ensures user has at least a Basic plan subscription (for task library access).

**Location:** `/backend/src/middleware/role.middleware.ts`

**Checks:**
- User has an active subscription
- Subscription tier is one of: `basic`, `normal`, or `pro` (trial is not enough)

**Error Messages:**
- No active subscription: `"Your subscription has ended! Go to My Subscriptions and pick/restart a plan!"`
- Trial tier: `"Task library access requires at least a Basic plan subscription. Go to My Subscriptions and upgrade!"`

**Error Codes:**
- `NO_ACTIVE_SUBSCRIPTION`
- `BASIC_PLAN_REQUIRED`

### 3. `requireTaskCredits` (Updated)

**Purpose:** Ensures user has at least 1 task generation credit before allowing task creation.

**Location:** `/backend/src/middleware/role.middleware.ts`

**Checks:**
- User has taskCredits > 0

**Error Message:**
- `"You run out of credits! Subscribe for any plan to get more credits at \"My Subscription\"."`

**Error Code:**
- `NO_CREDITS`

## Protected Endpoints

### Task Generation Endpoints (Require Active Subscription + Credits)

All task generation endpoints now validate:
- ✅ User is authenticated (`requireAuthenticatedTeacher`)
- ✅ User has active subscription (`requireActiveSubscription`)
- ✅ User has at least 1 credit (`requireTaskCredits`)

**Endpoints:**
```
POST /generate-task
POST /generate-task-text
POST /generate-task-solution
POST /generate-task-images
POST /save-task
```

**Middleware Chain:**
```javascript
requireAuthenticatedTeacher, requireActiveSubscription, requireTaskCredits
```

### Task Selection Endpoint (Requires Active Subscription Only)

**Endpoint:**
```
POST /select-best-task
```

**Middleware Chain:**
```javascript
requireAuthenticatedTeacher, requireActiveSubscription
```

**Note:** Selection doesn't consume credits, so only active subscription is required.

### Task Library Endpoints (Require Basic Plan)

All task browsing/searching endpoints now validate:
- ✅ User is authenticated (`authenticateUser`)
- ✅ User has at least Basic plan (`requireBasicPlan`)

**Endpoints:**
```
GET /api/v2/tasks              (Browse/filter tasks)
GET /api/v2/tasks/search       (Search tasks)
GET /api/v2/tasks/:id          (View specific task)
```

**Middleware Chain:**
```javascript
authenticateUser, requireBasicPlan
```

## Subscription Tier Access Matrix

| Feature | Trial | Basic | Normal | Pro |
|---------|-------|-------|--------|-----|
| Task Library (Browse/Search/View) | ❌ | ✅ | ✅ | ✅ |
| Task Generation | ✅ (with credits) | ❌ | ✅ | ✅ |
| Custom Collections | ✅ | ✅ (1000) | ✅ (unlimited) | ✅ (unlimited) |
| Task Credits | 100 | 0 | 1,000 | 10,000 |

## Error Response Format

All middleware return consistent error responses:

```json
{
  "success": false,
  "message": "Human-readable error message with action guidance",
  "errorCode": "MACHINE_READABLE_CODE",
  "data": {
    "additionalInfo": "value"
  }
}
```

### Example Error Responses

**No Credits:**
```json
{
  "success": false,
  "message": "You run out of credits! Subscribe for any plan to get more credits at \"My Subscription\".",
  "errorCode": "NO_CREDITS",
  "data": {
    "remainingCredits": 0
  }
}
```

**Expired Subscription:**
```json
{
  "success": false,
  "message": "Your Normal plan subscription has ended! Go to My Subscriptions and pick/restart a plan!",
  "errorCode": "SUBSCRIPTION_EXPIRED",
  "data": {
    "subscriptionTier": "normal",
    "endDate": "2024-12-01T00:00:00.000Z"
  }
}
```

**Basic Plan Required:**
```json
{
  "success": false,
  "message": "Task library access requires at least a Basic plan subscription. Go to My Subscriptions and upgrade!",
  "errorCode": "BASIC_PLAN_REQUIRED",
  "data": {
    "currentTier": "trial",
    "requiredTiers": ["basic", "normal", "pro"]
  }
}
```

## Frontend Integration

Frontend should:

1. **Handle Error Codes:** Check `errorCode` field to determine specific error type
2. **Display User-Friendly Messages:** Use the `message` field for user display
3. **Redirect Appropriately:**
   - For `NO_CREDITS`, `NO_SUBSCRIPTION`, `SUBSCRIPTION_INACTIVE`, `SUBSCRIPTION_EXPIRED` → Redirect to `/my-subscription`
   - For `BASIC_PLAN_REQUIRED` → Redirect to `/my-subscription` with upgrade prompt
4. **Show Additional Data:** Use `data` object for contextual information (e.g., remaining credits, current tier)

### Example Frontend Error Handling

```typescript
try {
  const response = await fetch('/api/generate-task', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(taskData)
  });

  const result = await response.json();

  if (!result.success) {
    // Handle specific error codes
    switch (result.errorCode) {
      case 'NO_CREDITS':
        router.push('/my-subscription?message=no-credits');
        break;
      case 'SUBSCRIPTION_EXPIRED':
      case 'SUBSCRIPTION_INACTIVE':
      case 'NO_SUBSCRIPTION':
        router.push('/my-subscription?message=expired');
        break;
      case 'BASIC_PLAN_REQUIRED':
        router.push('/my-subscription?message=upgrade-required');
        break;
      default:
        showError(result.message);
    }
  }
} catch (error) {
  showError('Network error occurred');
}
```

## Testing Checklist

### Task Generation Flow
- [ ] Trial user with credits can generate tasks
- [ ] Trial user with 0 credits sees "run out of credits" message
- [ ] User with expired subscription cannot generate tasks
- [ ] User with inactive subscription cannot generate tasks
- [ ] Normal/Pro user with credits can generate tasks
- [ ] Credits are properly deducted after task save

### Task Library Flow
- [ ] Trial user cannot browse task library
- [ ] Trial user sees "Basic plan required" message
- [ ] Basic/Normal/Pro user can browse task library
- [ ] Expired subscription cannot access task library
- [ ] Unauthenticated user cannot access task library

### Subscription Status
- [ ] Active subscription passes all checks
- [ ] Expired subscription (by date) fails all checks
- [ ] Cancelled subscription fails all checks
- [ ] Past due subscription fails all checks

## Notes

- All middleware properly attach user/subscription data to request object for downstream use
- Middleware is chainable and should be used in the correct order
- Error messages are user-friendly and include actionable guidance
- Error codes allow for programmatic error handling on frontend
