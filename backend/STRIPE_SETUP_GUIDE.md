# Stripe Setup Guide for EduForge

## ✅ Step 1: Add Your Stripe API Keys (DONE)

Your Stripe test keys have been added to `/backend/.env`:

```bash
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY_HERE
```

**Publishable Key** (for reference, not used in backend):
```
pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

---

## 🛠️ Step 2: Create Products & Prices in Stripe Dashboard

You need to create **3 Products** with **Annual Prices** in your Stripe Dashboard.

### Go to Stripe Dashboard:
1. Login to: https://dashboard.stripe.com/test/products
2. Click **"+ Add product"** for each tier

### Product 1: Basic Plan
- **Name:** `EduForge Basic`
- **Description:** `Basic subscription with task viewing and downloading`
- **Pricing:**
  - **Price:** `€99.00 EUR`
  - **Billing period:** `Yearly`
  - **Price ID will be generated** (e.g., `price_1AbC2dEfG3hIjKlM`)
- **Metadata (optional but recommended):**
  - `tier`: `basic`
  - `credits`: `0`
  - `collections`: `1000`

### Product 2: Normal Plan
- **Name:** `EduForge Normal`
- **Description:** `Normal subscription with task generation credits`
- **Pricing:**
  - **Price:** `€199.00 EUR`
  - **Billing period:** `Yearly`
  - **Price ID will be generated** (e.g., `price_2XyZ3aBcD4eF5gHi`)
- **Metadata (optional but recommended):**
  - `tier`: `normal`
  - `credits`: `1000`
  - `collections`: `1000`

### Product 3: Pro Plan (School License)
- **Name:** `EduForge Pro (School License)`
- **Description:** `Pro subscription for schools with multiple teachers`
- **Pricing:**
  - **Price:** `€599.00 EUR`
  - **Billing period:** `Yearly`
  - **Price ID will be generated** (e.g., `price_3MnO4pQrS5tUvWxY`)
- **Metadata (optional but recommended):**
  - `tier`: `pro`
  - `credits`: `10000`
  - `collections`: `unlimited`
  - `teachers`: `10`

---

## 📝 Step 3: Copy Price IDs to .env

After creating the products, **copy the Price IDs** from Stripe Dashboard and update your `.env`:

```bash
# Replace these with your actual Stripe Price IDs
STRIPE_PRICE_ID_BASIC_ANNUAL=price_1AbC2dEfG3hIjKlM
STRIPE_PRICE_ID_NORMAL_ANNUAL=price_2XyZ3aBcD4eF5gHi
STRIPE_PRICE_ID_PRO_ANNUAL=price_3MnO4pQrS5tUvWxY
```

**Where to find Price IDs:**
1. Go to https://dashboard.stripe.com/test/products
2. Click on a product
3. Copy the **Price ID** (starts with `price_`)

---

## 🪝 Step 4: Set Up Webhook (Required for Production)

Webhooks allow Stripe to notify your backend about subscription events (renewals, cancellations, etc.).

### For Local Development:
Use **Stripe CLI** to forward webhook events to localhost:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to localhost
stripe listen --forward-to http://localhost:3000/api/subscription/webhook
```

This will output a webhook secret like:
```
whsec_abc123def456ghi789jkl012mno345pqr
```

**Update your `.env`:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_abc123def456ghi789jkl012mno345pqr
USE_MOCK_PAYMENTS=false  # Enable real Stripe payments
```

### For Production (Firebase/Cloud):
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **"+ Add endpoint"**
3. Enter your endpoint URL:
   ```
   https://your-domain.com/api/subscription/webhook
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)
6. Add to Firebase environment config (see Step 6)

---

## 🧪 Step 5: Test Locally

### Option A: Test with Mock Payments (Easiest)
Keep this setting in `.env`:
```bash
USE_MOCK_PAYMENTS=true
```

No Stripe setup needed! Mock payments automatically succeed without real Stripe API calls.

### Option B: Test with Real Stripe (Recommended)
Update `.env`:
```bash
USE_MOCK_PAYMENTS=false
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_step_4
```

**Test the flow:**
1. Start backend: `npm run dev` (in `/backend`)
2. Start frontend: `npm run dev` (in `/frontend`)
3. Start Stripe CLI webhook forwarding (if testing webhooks):
   ```bash
   stripe listen --forward-to http://localhost:3000/api/subscription/webhook
   ```
4. Go to http://localhost:3001/my-subscription
5. Click "Subscribe" on a plan
6. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

**Expected behavior:**
- Redirects to Stripe Checkout
- After payment, redirects to success page
- Subscription activated in Firestore
- Credits added to user account

---

## 🚀 Step 6: Deploy to Firebase

### Update Firebase Environment Config

You need to set environment variables in Firebase Functions:

```bash
cd /Users/martonhorvath/Documents/EduForge/app/backend

# Set Stripe Secret Key
firebase functions:config:set stripe.secret_key="sk_test_YOUR_TEST_KEY_HERE"

# Set Webhook Secret (from Step 4 - Production)
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_PRODUCTION_WEBHOOK_SECRET"

# Set Price IDs (from Step 3)
firebase functions:config:set stripe.price_id_basic_annual="price_1AbC2dEfG3hIjKlM"
firebase functions:config:set stripe.price_id_normal_annual="price_2XyZ3aBcD4eF5gHi"
firebase functions:config:set stripe.price_id_pro_annual="price_3MnO4pQrS5tUvWxY"

# Disable mock payments in production
firebase functions:config:set payments.use_mock="false"
```

### Update Your Code to Read Firebase Config

If you're using Firebase Functions, update your config loading:

**In `backend/src/config/stripe.config.ts`**, add Firebase config support:

```typescript
import * as functions from 'firebase-functions';

// Try to load from Firebase config first, fallback to .env
const STRIPE_SECRET_KEY =
  functions.config().stripe?.secret_key ||
  process.env.STRIPE_SECRET_KEY ||
  "";

const STRIPE_WEBHOOK_SECRET =
  functions.config().stripe?.webhook_secret ||
  process.env.STRIPE_WEBHOOK_SECRET ||
  "";

export const STRIPE_PRICE_IDS = {
  basic_annual:
    functions.config().stripe?.price_id_basic_annual ||
    process.env.STRIPE_PRICE_ID_BASIC_ANNUAL ||
    "price_basic_annual",
  normal_annual:
    functions.config().stripe?.price_id_normal_annual ||
    process.env.STRIPE_PRICE_ID_NORMAL_ANNUAL ||
    "price_normal_annual",
  pro_annual:
    functions.config().stripe?.price_id_pro_annual ||
    process.env.STRIPE_PRICE_ID_PRO_ANNUAL ||
    "price_pro_annual",
};
```

### Deploy
```bash
firebase deploy --only functions,hosting
```

---

## 🔒 Security Notes

### ✅ What's Secure:
- **Secret Key** is server-side only (never exposed to frontend)
- **Webhook Secret** validates requests are from Stripe
- All payments processed through Stripe (PCI compliant)
- Automatic tax calculation enabled

### ⚠️ Important:
- **Never commit** `.env` file to git (already in `.gitignore`)
- Use **test keys** (`sk_test_...`) for development
- Use **live keys** (`sk_live_...`) only in production
- Rotate keys if exposed

---

## 📚 Subscription Flow Summary

### 1. User Clicks "Subscribe" (Frontend)
- Frontend calls: `POST /api/subscription/create-checkout-session`
- Sends: `{ tier: "normal", successUrl, cancelUrl }`
- Backend creates Stripe Checkout session
- User redirects to Stripe payment page

### 2. User Completes Payment (Stripe)
- Stripe processes payment
- Redirects to: `successUrl?session_id=cs_test_...`
- Frontend calls: `POST /api/subscription/checkout-success`

### 3. Backend Activates Subscription
- Retrieves session from Stripe
- Creates/updates subscription in Firestore
- Allocates credits based on tier
- Webhook events keep subscription in sync

### 4. Subscription Lifecycle (Webhooks)
- **Renewal:** `customer.subscription.updated` → Update endDate
- **Cancellation:** `customer.subscription.deleted` → Mark cancelled
- **Payment failed:** `invoice.payment_failed` → Mark past_due

---

## 🧪 Testing with Stripe Test Cards

Use these test cards in Stripe Checkout:

| Scenario | Card Number | Behavior |
|----------|-------------|----------|
| **Success** | `4242 4242 4242 4242` | Payment succeeds |
| **Decline** | `4000 0000 0000 0002` | Card declined |
| **Insufficient funds** | `4000 0000 0000 9995` | Insufficient funds |
| **3D Secure** | `4000 0025 0000 3155` | Requires authentication |

All test cards:
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

---

## ✅ Checklist

Before going to production:

- [ ] Backend `.env` has real Stripe keys
- [ ] Created 3 products in Stripe Dashboard
- [ ] Copied Price IDs to `.env`
- [ ] Tested checkout flow locally
- [ ] Set up production webhook endpoint
- [ ] Added webhook secret to `.env`
- [ ] Set Firebase environment variables
- [ ] Updated code to read Firebase config
- [ ] Tested on staging/production
- [ ] Enabled Stripe Tax (automatic tax calculation)
- [ ] Switched to live keys for production (`sk_live_...`)

---

## 🆘 Troubleshooting

### "Invalid API key provided"
- Check that `STRIPE_SECRET_KEY` is set correctly
- Make sure it starts with `sk_test_` or `sk_live_`
- Restart backend server after changing `.env`

### "No such price: price_basic_annual"
- Create products in Stripe Dashboard (Step 2)
- Copy actual Price IDs to `.env` (Step 3)

### "Webhook signature verification failed"
- Check `STRIPE_WEBHOOK_SECRET` is correct
- For local dev, use `stripe listen` to get signing secret
- Make sure webhook endpoint is: `/api/subscription/webhook`

### Subscription not activating after payment
- Check webhook is set up correctly
- Look at webhook logs in Stripe Dashboard
- Check backend logs for errors
- Verify Firestore permissions allow subscription writes

---

## 📖 Additional Resources

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe API Docs: https://stripe.com/docs/api
- Stripe CLI: https://stripe.com/docs/stripe-cli
- Test Cards: https://stripe.com/docs/testing
- Webhooks Guide: https://stripe.com/docs/webhooks

---

## 🎯 Quick Start (TL;DR)

```bash
# 1. Create products in Stripe Dashboard
# Go to: https://dashboard.stripe.com/test/products
# Create: Basic (€99), Normal (€199), Pro (€599)

# 2. Update .env with Price IDs
# STRIPE_PRICE_ID_BASIC_ANNUAL=price_xxx
# STRIPE_PRICE_ID_NORMAL_ANNUAL=price_yyy
# STRIPE_PRICE_ID_PRO_ANNUAL=price_zzz

# 3. Test locally with mock payments
# USE_MOCK_PAYMENTS=true (already set)

# 4. For real Stripe testing:
stripe listen --forward-to http://localhost:3000/api/subscription/webhook
# Copy the webhook secret to .env
# Set USE_MOCK_PAYMENTS=false

# 5. Deploy to Firebase
firebase functions:config:set stripe.secret_key="sk_test_..."
firebase functions:config:set stripe.price_id_basic_annual="price_..."
firebase deploy
```

**That's it!** Your subscription system is ready to accept payments. 🎉
