# Mock Payment Testing Guide

## Overview

**Mock payments in EduForger are automatically enabled in development mode.** This means when you test on localhost, you **will NOT see the Stripe checkout page**. Instead, you'll be immediately redirected to the success page with a simulated payment.

## How Mock Payments Work

### Question: "Can we see the Stripe side or that will be ignored?"

**Answer:** In development mode (localhost), **Stripe is completely bypassed**. Here's what happens:

```
User clicks "Upgrade"
  ↓
Backend detects development mode
  ↓
Backend creates MOCK session ID (not real Stripe session)
  ↓
Backend returns direct URL to success page (skips Stripe entirely)
  ↓
User immediately redirected to /subscription/success
  ↓
Backend activates subscription in Firestore
  ↓
User sees success page with credits
```

### In Production Mode

```
User clicks "Upgrade"
  ↓
Backend creates REAL Stripe Checkout session
  ↓
User redirected to REAL Stripe payment page
  ↓
User enters payment details on Stripe
  ↓
Stripe processes payment
  ↓
User redirected to /subscription/success OR /subscription/cancel
  ↓
Stripe webhook notifies backend
  ↓
Backend activates subscription
```

## Mock Payment Configuration

### Automatic Activation

Mock payments are **automatically enabled** in these conditions:

```typescript
// From mock-payment.service.ts
export function isMockPaymentMode(): boolean {
  // Always use mock payments in development unless explicitly disabled
  if (process.env.NODE_ENV === 'development') {
    return process.env.USE_MOCK_PAYMENTS !== 'false';
  }

  // In production, only use mock if explicitly enabled
  return process.env.USE_MOCK_PAYMENTS === 'true';
}
```

**Default behavior:**
- ✅ Development mode → Mock payments ENABLED
- ❌ Production mode → Mock payments DISABLED

### Override Settings

**To DISABLE mock payments in development:**
```bash
export USE_MOCK_PAYMENTS=false
```

**To ENABLE mock payments in production (for testing):**
```bash
export USE_MOCK_PAYMENTS=true
```

## Mock Payment Flow Details

### 1. Creating Checkout Session

**Real Stripe:**
```javascript
// Backend creates actual Stripe Checkout session
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  mode: 'subscription',
  payment_method_types: ['card'],
  // ... Stripe configuration
});

// Returns Stripe-hosted checkout URL
return { url: session.url };  // e.g., "https://checkout.stripe.com/c/pay/cs_..."
```

**Mock Payment:**
```javascript
// Backend creates mock session ID
const sessionId = `mock_session_${Date.now()}_${userId}_${tier}`;

// Returns direct success URL (skips Stripe)
const mockUrl = `${successUrl}?session_id=${sessionId}&mock=true&tier=${tier}`;
return { url: mockUrl };  // e.g., "http://localhost:3001/subscription/success?..."
```

### 2. Session ID Format

**Real Stripe:** `cs_test_a1b2c3d4...` (from Stripe API)

**Mock Payment:** `mock_session_1735342800000_userId_normal`

Format: `mock_session_{timestamp}_{userId}_{tier}`

### 3. Success Page Handling

The success page detects mock vs real:

```typescript
const sessionId = searchParams.get('session_id');
const isMock = searchParams.get('mock') === 'true';
const tierParam = searchParams.get('tier');

if (isMock && user.profile?.token) {
  // Mock payment - call backend to activate
  await subscriptionService.handleCheckoutSuccess(
    sessionId,
    userId,
    extractedTier
  );
} else {
  // Real Stripe - webhook already handled activation
  // Just show success message
}
```

## Payment Failure/Cancel Page

### When It's Used

**Real Stripe:**
- User clicks "Back" button on Stripe checkout
- Payment is declined by bank
- Card validation fails
- Network error during payment

**Mock Payments:**
- Not used in mock mode (always succeeds)
- To test cancel page, navigate directly: `http://localhost:3001/subscription/cancel?cancelled=true`

### Cancel Page URLs

**User Cancellation:**
```
http://localhost:3001/subscription/cancel?cancelled=true
```

**Payment Failure:**
```
http://localhost:3001/subscription/cancel?error=Card%20declined
```

## Testing Checklist

### Mock Payment Tests (Localhost)

#### Test 1: Basic Plan Upgrade (Trial → Basic)
```bash
# Prerequisites
- User registered with trial subscription (3 months, 100 credits)
- User is logged in as teacher

# Steps
1. Navigate to http://localhost:3001/my-subscription
2. Click "Upgrade to Basic" button
3. Observe immediate redirect (NO Stripe page)
4. Should land on /subscription/success
5. Check credits: should be 0 (Basic has no generation credits)
6. Check subscription tier: should show "Basic"
7. Try accessing task library: should work
8. Try generating task: should fail with "no credits" error
```

#### Test 2: Normal Plan Upgrade (Trial → Normal)
```bash
# Prerequisites
- User registered with trial subscription
- User is logged in as teacher

# Steps
1. Navigate to http://localhost:3001/my-subscription
2. Click "Upgrade to Normal" button
3. Observe immediate redirect (NO Stripe page)
4. Should land on /subscription/success
5. Should see "Create Your First Task" message
6. Check credits: should be 1,000
7. Check subscription tier: should show "Normal"
8. Click "Create Task" button → should go to /task-generator
9. Try generating task: should work
```

#### Test 3: Pro Plan Upgrade (Trial → Pro)
```bash
# Prerequisites
- User registered with trial subscription
- User is logged in as teacher

# Steps
1. Navigate to http://localhost:3001/my-subscription
2. Click "Upgrade to Pro" button
3. Observe immediate redirect (NO Stripe page)
4. Should land on /subscription/success
5. Should see "Add Teachers to Your School" message
6. Check credits: should be 10,000
7. Check subscription tier: should show "Pro"
8. Click "Add Teachers" button → should go to /school/teachers
9. Try generating task: should work with 10,000 credits
```

#### Test 4: Cancel Page
```bash
# Steps
1. Navigate directly to:
   http://localhost:3001/subscription/cancel?cancelled=true
2. Should see "Payment Cancelled" message
3. Should show orange icon
4. Click "Try Again" → goes to /my-subscription
5. Click "Go to Home" → goes to /

# Test with error
1. Navigate to:
   http://localhost:3001/subscription/cancel?error=Card%20declined
2. Should see "Payment Failed" message
3. Should show red error icon
4. Should display error details
```

### Subscription Validation Tests

#### Test 5: Task Generation with No Credits
```bash
# Prerequisites
- User has Basic plan (0 credits)
- User is logged in

# Steps
1. Navigate to /task-generator
2. Fill in task generation form
3. Click "Generate Task"
4. Should see error: "You run out of credits! Subscribe for any plan to get more credits at 'My Subscription'."
5. Error should have errorCode: "NO_CREDITS"
```

#### Test 6: Task Library with Trial Subscription
```bash
# Prerequisites
- User has trial subscription
- User is logged in

# Steps
1. Try accessing: GET /api/v2/tasks
2. Should get 403 error
3. Error message: "Task library access requires at least a Basic plan subscription. Go to My Subscriptions and upgrade!"
4. Error code: "BASIC_PLAN_REQUIRED"
```

#### Test 7: Expired Subscription
```bash
# Prerequisites
- User had subscription but it expired
- Update Firestore: set subscription.endDate to past date
- User is logged in

# Steps
1. Try generating task: POST /generate-task
2. Should get 403 error
3. Error message: "Your [Tier] plan subscription has ended! Go to My Subscriptions and pick/restart a plan!"
4. Error code: "SUBSCRIPTION_EXPIRED"
```

#### Test 8: Task Library with Basic Plan
```bash
# Prerequisites
- User has Basic plan
- User is logged in

# Steps
1. Navigate to task library page
2. Try: GET /api/v2/tasks
3. Should succeed (200 OK)
4. Should return list of published tasks
5. Try: GET /api/v2/tasks/search?q=algebra
6. Should succeed (200 OK)
7. Should return search results
```

## Testing with cURL

### Test Subscription Plans Endpoint
```bash
curl http://localhost:3000/api/subscription/plans
```

Expected response:
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "basic",
        "name": "Basic",
        "price": 99,
        "currency": "eur",
        "interval": "year",
        "features": { ... }
      },
      // ... normal and pro
    ]
  }
}
```

### Test Create Checkout Session (Mock)
```bash
# Replace YOUR_JWT_TOKEN with actual token
curl -X POST http://localhost:3000/api/subscription/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "tier": "normal",
    "successUrl": "http://localhost:3001/subscription/success?session_id={CHECKOUT_SESSION_ID}",
    "cancelUrl": "http://localhost:3001/subscription/cancel?cancelled=true"
  }'
```

Expected response (mock mode):
```json
{
  "success": true,
  "data": {
    "sessionId": "mock_session_1735342800000_userId_normal",
    "url": "http://localhost:3001/subscription/success?session_id=mock_session_1735342800000_userId_normal&mock=true&tier=normal"
  }
}
```

### Test Checkout Success (Mock)
```bash
curl -X POST http://localhost:3000/api/subscription/checkout-success \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "mock_session_1735342800000_userId_normal",
    "userId": "USER_ID_HERE",
    "tier": "normal"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Subscription activated successfully"
}
```

### Test Task Generation with No Credits
```bash
curl -X POST http://localhost:3000/generate-task \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "curriculum_path": "math:grade_9_10:algebra:linear_equations",
    "country_code": "US",
    "target_group": "mixed",
    "difficulty_level": "medium",
    "educational_model": "secular",
    "number_of_images": 0
  }'
```

Expected response (if no credits):
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

## Console Logs to Watch

When testing mock payments, watch the backend console for these logs:

```
[Mock Payment] Created mock checkout session: {
  sessionId: 'mock_session_1735342800000_userId_normal',
  userId: 'abc123',
  tier: 'normal',
  user: 'teacher@example.com'
}

[Mock Payment] Processing mock payment success: {
  sessionId: 'mock_session_1735342800000_userId_normal',
  userId: 'abc123',
  tier: 'normal'
}

[Mock Payment] Successfully upgraded user: {
  userId: 'abc123',
  tier: 'normal',
  credits: 1000,
  email: 'teacher@example.com'
}
```

## Switching to Real Stripe

To test with real Stripe in development:

1. Set up Stripe account
2. Create products and prices in Stripe Dashboard
3. Get API keys from Stripe Dashboard
4. Update `.env`:
```bash
STRIPE_SECRET_KEY=sk_test_your_real_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID_BASIC_ANNUAL=price_real_id_basic
STRIPE_PRICE_ID_NORMAL_ANNUAL=price_real_id_normal
STRIPE_PRICE_ID_PRO_ANNUAL=price_real_id_pro
USE_MOCK_PAYMENTS=false  # Disable mock payments
```
5. Restart backend server
6. Test checkout → should now go to real Stripe page

## Summary

| Aspect | Mock Payments (Development) | Real Stripe (Production) |
|--------|----------------------------|--------------------------|
| **Stripe Page** | ❌ Skipped entirely | ✅ Real Stripe checkout UI |
| **Payment Processing** | ✅ Instant (simulated) | ⏱️ Real-time (actual charge) |
| **Session ID** | `mock_session_...` | `cs_test_...` |
| **Success URL** | Immediate redirect | After payment success |
| **Cancel URL** | Not used (always succeeds) | User can cancel |
| **Webhook** | Not needed | Required for activation |
| **Testing Speed** | ⚡ Instant | 🐌 Requires payment form |
| **Cost** | 💰 Free | 💳 Test mode (free) or real charges |

**Bottom line:** On localhost with default settings, **you will NOT see the Stripe checkout page** - the payment is mocked and you're immediately redirected to the success page.
