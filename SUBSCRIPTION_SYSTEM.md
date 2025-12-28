# EduForge Subscription System

## Overview

This document describes the subscription system implementation for EduForge, including payment processing via Stripe, subscription tiers, and the mock payment system for localhost testing.

## Subscription Tiers

### 1. Trial (Free - 3 months)
- **Price**: Free
- **Duration**: 3 months
- **Features**:
  - View/download tasks from task library
  - Design 100 custom task collections
  - 100 task creation credits
  - 72-hour email support

### 2. Basic (€99/year)
- **Price**: €99/year
- **Features**:
  - View/download tasks from task library
  - Design 1,000 custom task collections
  - 48-hour email support service
  - **No task generation credits** (library access only)

### 3. Normal (€199/year)
- **Price**: €199/year
- **Features**:
  - Everything in Basic
  - **1,000 task creation credits**
  - Access to EduForge creator contests
  - Access to private Discord channel
  - 10% discount on EduForge webstore

### 4. Pro - School License (€599/year)
- **Price**: €599/year
- **Features**:
  - **10,000 task creation credits**
  - Add up to 10 teachers from your school
  - Can attend "Best School of the Year" EduForge contest/ranking
  - Priority 24-hour email support
  - Unlimited custom task collections
  - 15% discount on EduForge webstore

## Backend Implementation

### Files Created

1. **`src/types/subscription.types.ts`**
   - Type definitions for subscription tiers, statuses, and plans
   - `SUBSCRIPTION_PLANS` configuration object with all tier details

2. **`src/config/stripe.config.ts`**
   - Stripe SDK initialization
   - Configuration for test/production modes
   - Price ID mappings

3. **`src/services/subscription.service.ts`**
   - Checkout session creation
   - Webhook handling for Stripe events
   - Subscription management (cancel/reactivate)
   - User subscription updates in Firestore

4. **`src/services/mock-payment.service.ts`**
   - Mock payment system for localhost development
   - Simulates Stripe checkout without actual payment
   - Automatically activates subscriptions for testing

5. **`src/controllers/subscription.controller.ts`**
   - API endpoints for subscription management
   - Automatically switches between Stripe and mock payments based on environment

6. **`src/routes/subscription.routes.ts`**
   - Express routes for subscription API
   - Swagger documentation

### API Endpoints

All endpoints are prefixed with `/api/subscription`:

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/plans` | No | Get all available subscription plans |
| POST | `/create-checkout-session` | Yes | Create a checkout session |
| POST | `/checkout-success` | No | Handle successful checkout |
| POST | `/webhook` | No | Handle Stripe webhook events |
| POST | `/cancel` | Yes | Cancel subscription at period end |
| POST | `/reactivate` | Yes | Reactivate cancelled subscription |
| GET | `/details` | Yes | Get user's subscription details |

### Database Schema Updates

Updated `UserDocument` in Firestore:

```typescript
subscription?: {
  tier: 'trial' | 'basic' | 'normal' | 'pro';
  status: 'active' | 'expired' | 'cancelled' | 'past_due';
  startDate: Timestamp;
  endDate: Timestamp;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  cancelAtPeriodEnd?: boolean;
  schoolId?: string;  // For pro tier
  schoolName?: string;
  associatedTeachers?: string[];  // Array of UIDs
}
```

## Environment Configuration

### Required Environment Variables

Add to `/backend/.env`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_PRICE_ID_BASIC_ANNUAL=price_xxx
STRIPE_PRICE_ID_NORMAL_ANNUAL=price_xxx
STRIPE_PRICE_ID_PRO_ANNUAL=price_xxx

# Payment Configuration
USE_MOCK_PAYMENTS=true  # Set to 'false' for production
```

## Mock Payment System (Development)

When `USE_MOCK_PAYMENTS=true`:

1. **No real payment processing** - Perfect for localhost testing
2. **Instant subscription activation** - No waiting for webhooks
3. **Full feature testing** - Test all subscription tiers without Stripe account

### Testing with Mock Payments

```bash
# 1. Start backend with mock payments enabled
cd backend
npm run dev

# 2. Create checkout session
POST /api/subscription/create-checkout-session
{
  "tier": "normal",
  "successUrl": "http://localhost:3001/subscription/success",
  "cancelUrl": "http://localhost:3001/subscription/cancel"
}

# 3. System will return a mock URL with session_id
# 4. Call checkout-success endpoint
POST /api/subscription/checkout-success
{
  "sessionId": "mock_session_xxx",
  "userId": "user_uid",
  "tier": "normal"
}

# 5. User is now subscribed with 1,000 credits!
```

## Setting Up Real Stripe (Production)

### For Individual/Sole Proprietor:

1. **Register at Stripe** (https://dashboard.stripe.com/register)
   - Select "Individual" as business type
   - Provide your personal tax ID/tax number
   - Complete identity verification

2. **Create Products & Prices**
   ```
   - Product: EduForge Basic Annual
     Price: €99/year (Recurring)

   - Product: EduForge Normal Annual
     Price: €199/year (Recurring)

   - Product: EduForge Pro Annual
     Price: €599/year (Recurring)
   ```

3. **Get API Keys**
   - Go to Developers > API keys
   - Copy "Secret key" (sk_live_xxx)
   - Copy "Publishable key" (pk_live_xxx)

4. **Set Up Webhook**
   - Go to Developers > Webhooks
   - Add endpoint: `https://yourdomain.com/api/subscription/webhook`
   - Listen for events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`

5. **Update Environment Variables**
   ```bash
   USE_MOCK_PAYMENTS=false
   STRIPE_SECRET_KEY=sk_live_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   STRIPE_PRICE_ID_BASIC_ANNUAL=price_xxx
   STRIPE_PRICE_ID_NORMAL_ANNUAL=price_xxx
   STRIPE_PRICE_ID_PRO_ANNUAL=price_xxx
   ```

## Next Steps (TODO)

The backend is complete! Still need to implement:

1. **Frontend Components**
   - [ ] Refactor `/my-subscription` page with plan selection cards
   - [ ] Create checkout flow UI
   - [ ] Add success/cancel pages
   - [ ] Update frontend types to match new subscription structure

2. **Subscription Enforcement**
   - [ ] Add middleware to check task creation credits
   - [ ] Enforce plan limits (custom collections, etc.)
   - [ ] Add UI warnings when credits are low

3. **Testing**
   - [ ] Test complete flow with mock payments
   - [ ] Test subscription upgrades
   - [ ] Test cancellation and reactivation

## Testing Checklist

- [ ] User can view subscription plans
- [ ] User can create checkout session
- [ ] Mock payment succeeds and activates subscription
- [ ] Credits are added to user account
- [ ] User can cancel subscription
- [ ] User can reactivate subscription
- [ ] Subscription status updates correctly
- [ ] Task generation respects credit limits

## Important Notes

- **Development**: Always use `USE_MOCK_PAYMENTS=true` for localhost
- **Stripe Test Mode**: Use test keys (sk_test_xxx) before going live
- **Invoicing**: Stripe handles invoice generation automatically
- **Tax**: Configure tax settings in Stripe Dashboard for your country
- **Individual Account**: No company needed - you can use personal tax ID

---

**Status**: Backend Complete ✅
**Next**: Frontend Implementation 🚧
