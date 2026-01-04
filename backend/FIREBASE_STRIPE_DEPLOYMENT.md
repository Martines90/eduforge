# Firebase Stripe Deployment Guide

## ✅ Current Status: Local Development Ready

Your Stripe is now configured for **local development** with test mode:
- ✅ Test API keys in `.env`
- ✅ Test Price IDs configured
- ✅ Mock payments enabled for easy testing

---

## 🧪 Test Locally First

Before deploying to Firebase, test the subscription flow locally:

### 1. Start your servers:
```bash
# Terminal 1 - Backend
cd /Users/martonhorvath/Documents/EduForger/app/backend
npm run dev

# Terminal 2 - Frontend
cd /Users/martonhorvath/Documents/EduForger/app/frontend
npm run dev
```

### 2. Test with Mock Payments:
1. Go to: http://localhost:3001/my-subscription
2. Click "Subscribe" on any plan
3. You'll see a mock success message (no real Stripe checkout)
4. Check that subscription is activated in your user profile

### 3. Test with Real Stripe (Optional):
Update `.env`:
```bash
USE_MOCK_PAYMENTS=false
```

Then:
1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to http://localhost:3000/api/subscription/webhook`
4. Copy the webhook secret (starts with `whsec_`) to your `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_abc123...
   ```
5. Restart backend server
6. Test checkout with test card: `4242 4242 4242 4242`

---

## 🚀 Deploy to Firebase Production

### Step 1: Set Firebase Environment Variables

Run these commands from your backend directory:

```bash
cd /Users/martonhorvath/Documents/EduForger/app/backend

# Set LIVE Stripe API Keys
firebase functions:config:set stripe.secret_key="sk_live_YOUR_LIVE_KEY_HERE"

# Set LIVE Price IDs
firebase functions:config:set stripe.price_id_basic_annual="price_YOUR_BASIC_PRICE_ID"
firebase functions:config:set stripe.price_id_normal_annual="price_YOUR_NORMAL_PRICE_ID"
firebase functions:config:set stripe.price_id_pro_annual="price_YOUR_PRO_PRICE_ID"

# Disable mock payments for production
firebase functions:config:set payments.use_mock="false"
```

### Step 2: Set Up Production Webhook

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Enter your production URL:
   ```
   https://your-production-domain.com/api/subscription/webhook
   ```
   Or if using Firebase Functions directly:
   ```
   https://us-central1-eduforge-d29d9.cloudfunctions.net/api/subscription/webhook
   ```
4. Select these events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add it to Firebase config:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_YOUR_LIVE_WEBHOOK_SECRET"
   ```

### Step 3: Update Backend Code for Firebase Config

Your code needs to read from Firebase config in production. Update `/backend/src/config/stripe.config.ts`:

```typescript
import Stripe from "stripe";
import * as functions from "firebase-functions";

// Read from Firebase Functions config first, fallback to .env
const STRIPE_SECRET_KEY =
  functions.config().stripe?.secret_key ||
  process.env.STRIPE_SECRET_KEY ||
  "";

const STRIPE_WEBHOOK_SECRET =
  functions.config().stripe?.webhook_secret ||
  process.env.STRIPE_WEBHOOK_SECRET ||
  "";

// Use test mode when in development or if no key is provided
const isTestMode = process.env.NODE_ENV !== "production" || !STRIPE_SECRET_KEY;

// Initialize Stripe with the secret key
export const stripe = new Stripe(STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

export const stripeConfig = {
  secretKey: STRIPE_SECRET_KEY,
  webhookSecret: STRIPE_WEBHOOK_SECRET,
  isTestMode,
};

// Stripe Price IDs
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

console.log("[Stripe Config] Initialized:", {
  isTestMode,
  hasSecretKey: !!STRIPE_SECRET_KEY,
  hasWebhookSecret: !!STRIPE_WEBHOOK_SECRET,
});
```

### Step 4: Deploy to Firebase

```bash
# From backend directory
cd /Users/martonhorvath/Documents/EduForger/app/backend

# Build your backend
npm run build

# Deploy functions and hosting
firebase deploy --only functions,hosting

# Or deploy everything
firebase deploy
```

### Step 5: Verify Deployment

1. Check Firebase Functions logs:
   ```bash
   firebase functions:log
   ```

2. Test the webhook endpoint:
   ```bash
   curl https://your-production-domain.com/api/subscription/webhook
   ```
   Should return: `{"success":false,"message":"No signature provided"}`

3. Go to your production URL and test checkout

---

## 🔐 Security Checklist

Before going live:

- [ ] Live API keys set in Firebase config (not in `.env`)
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] Webhook secret set in Firebase config
- [ ] `USE_MOCK_PAYMENTS` disabled in production
- [ ] Test checkout flow with real card in test mode
- [ ] Verify webhooks are received (check Stripe Dashboard → Webhooks → Logs)
- [ ] Enable Stripe Tax for automatic tax calculation
- [ ] Test subscription renewal (or schedule test for 1 month)
- [ ] Test cancellation flow
- [ ] Verify Firestore security rules allow subscription updates

---

## 📋 Environment Variables Summary

### Local Development (.env)
```bash
# TEST MODE
STRIPE_SECRET_KEY=sk_test_51Sj60c2O01owZowS...
STRIPE_WEBHOOK_SECRET=whsec_... (from stripe listen)
STRIPE_PRICE_ID_BASIC_ANNUAL=price_1SjMtu2O01owZowScFslorCa
STRIPE_PRICE_ID_NORMAL_ANNUAL=price_1SjMy42O01owZowSybDb6fpx
STRIPE_PRICE_ID_PRO_ANNUAL=price_1SjN3W2O01owZowSAY317KlT
USE_MOCK_PAYMENTS=true
```

### Firebase Production (firebase functions:config)
```bash
# LIVE MODE
stripe.secret_key=sk_live_YOUR_LIVE_KEY_HERE
stripe.webhook_secret=whsec_YOUR_WEBHOOK_SECRET (from Stripe Dashboard)
stripe.price_id_basic_annual=price_YOUR_BASIC_PRICE_ID
stripe.price_id_normal_annual=price_YOUR_NORMAL_PRICE_ID
stripe.price_id_pro_annual=price_YOUR_PRO_PRICE_ID
payments.use_mock=false
```

---

## 🆘 Troubleshooting

### "Webhook signature verification failed"
- Check webhook secret is correct in Firebase config
- Verify webhook endpoint URL matches exactly
- Check Stripe Dashboard → Webhooks → Recent deliveries for error details

### "Invalid API key"
- Verify live key is set in Firebase config
- Check key starts with `sk_live_` not `sk_test_`
- Run: `firebase functions:config:get` to verify

### Subscription not activating
- Check webhook is configured in Stripe Dashboard
- Look at webhook delivery logs in Stripe
- Check Firebase Functions logs: `firebase functions:log`
- Verify Firestore permissions

### "No such price"
- Verify Price IDs are from LIVE mode (not test mode)
- Check Firebase config: `firebase functions:config:get stripe`
- Ensure prices are in EUR and set to Yearly

---

## 📊 Monitoring Production

### Check Firebase Functions Logs
```bash
firebase functions:log --limit 50
```

### Check Stripe Dashboard
- Payments: https://dashboard.stripe.com/payments
- Subscriptions: https://dashboard.stripe.com/subscriptions
- Webhooks: https://dashboard.stripe.com/webhooks (check delivery status)
- Logs: https://dashboard.stripe.com/logs

### Monitor Failed Payments
Set up email alerts in Stripe Dashboard:
- Settings → Email notifications
- Enable: "Failed payments", "Subscription cancellations"

---

## 🎯 Quick Deploy Commands

```bash
# 1. Set Firebase config (one-time setup)
firebase functions:config:set \
  stripe.secret_key="sk_live_YOUR_LIVE_KEY_HERE" \
  stripe.price_id_basic_annual="price_YOUR_BASIC_PRICE_ID" \
  stripe.price_id_normal_annual="price_YOUR_NORMAL_PRICE_ID" \
  stripe.price_id_pro_annual="price_YOUR_PRO_PRICE_ID" \
  payments.use_mock="false"

# 2. Add webhook secret (after creating webhook in Stripe Dashboard)
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_SECRET"

# 3. Deploy
firebase deploy --only functions,hosting
```

---

## ✅ You're All Set!

Your Stripe integration is now ready:
- ✅ Test mode configured for local development
- ✅ Live mode credentials ready for production
- ✅ All Price IDs configured
- 📝 Webhook setup pending (do this before deploying)

**Next steps:**
1. Test locally with mock payments
2. Set up production webhook in Stripe Dashboard
3. Deploy to Firebase
4. Test production checkout

Good luck! 🚀
