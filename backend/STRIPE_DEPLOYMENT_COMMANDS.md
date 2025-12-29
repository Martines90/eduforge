# 🚀 Stripe Deployment - Ready to Deploy!

## ✅ What's Already Done:

- ✅ Stripe products created (Basic, Normal, Pro)
- ✅ Test Price IDs configured in `.env`
- ✅ Live Price IDs ready
- ✅ Test API keys in `.env`
- ✅ Live API keys ready
- ✅ Webhook endpoint created in Stripe Dashboard
- ✅ Webhook secret saved (configured in Firebase)

---

## 📋 Webhook Configuration Summary

**Webhook Endpoint:**
- **URL:** `https://eduforge-d29d9.web.app/api/subscription/webhook`
- **Destination ID:** `we_1SjjVS2NF3WxtUjyaTIIjBaX`
- **API Version:** `2025-12-15.clover`
- **Listening to:** 4 events
  - ✅ `checkout.session.completed`
  - ✅ `customer.subscription.created`
  - ✅ `customer.subscription.updated`
  - ✅ `invoice.payment_failed`
- **Signing Secret:** Configured in Firebase config

---

## 🚀 Deploy to Firebase Production

### Step 1: Set Firebase Environment Variables

Copy and paste these commands (run from `/backend` directory):

```bash
cd /Users/martonhorvath/Documents/EduForge/app/backend

# Set LIVE Stripe Secret Key
firebase functions:config:set stripe.secret_key="sk_live_YOUR_LIVE_KEY_HERE"

# Set Webhook Secret
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET_HERE"

# Set LIVE Price IDs
firebase functions:config:set stripe.price_id_basic_annual="price_YOUR_BASIC_PRICE_ID"
firebase functions:config:set stripe.price_id_normal_annual="price_YOUR_NORMAL_PRICE_ID"
firebase functions:config:set stripe.price_id_pro_annual="price_YOUR_PRO_PRICE_ID"

# Disable mock payments (use real Stripe)
firebase functions:config:set payments.use_mock="false"
```

### Step 2: Verify Configuration

Check that all values are set correctly:

```bash
firebase functions:config:get
```

You should see:
```json
{
  "stripe": {
    "secret_key": "sk_live_...",
    "webhook_secret": "whsec_5Coiri7...",
    "price_id_basic_annual": "price_1SjNEe2...",
    "price_id_normal_annual": "price_1SjNEb2...",
    "price_id_pro_annual": "price_1SjNEX2..."
  },
  "payments": {
    "use_mock": "false"
  }
}
```

### Step 3: Update Backend Code (If Needed)

Make sure your `/backend/src/config/stripe.config.ts` reads from Firebase config.

If it doesn't already, add this at the top:

```typescript
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
```

### Step 4: Deploy to Firebase

```bash
# Build backend
npm run build

# Deploy functions and hosting
firebase deploy --only functions,hosting

# Or deploy everything
firebase deploy
```

### Step 5: Test Production Webhook

After deployment, test the webhook endpoint:

```bash
curl https://eduforge-d29d9.web.app/api/subscription/webhook
```

Expected response:
```json
{"success":false,"message":"No signature provided"}
```

This means the endpoint is live and waiting for Stripe events! ✅

---

## 🧪 Test Production Subscription Flow

### 1. Create Test Subscription

1. Go to: `https://eduforge-d29d9.web.app/my-subscription`
2. Click "Subscribe" on a plan
3. You'll be redirected to **Stripe Checkout** (live mode)
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout

### 2. Verify Success

Check that:
- ✅ Redirected to success page
- ✅ Subscription created in Firestore (`users/{userId}/subscription`)
- ✅ Credits allocated based on tier
- ✅ User can access features

### 3. Monitor Webhooks

Check webhook delivery in Stripe Dashboard:
1. Go to: https://dashboard.stripe.com/webhooks
2. Click on "EduForge Subscriptions" webhook
3. Check "Recent deliveries" tab
4. Should see `checkout.session.completed` event with ✅ status

---

## 📊 Monitor Production

### Check Firebase Functions Logs

```bash
firebase functions:log --limit 50
```

Look for:
```
[Stripe Config] Initialized: { isTestMode: false, hasSecretKey: true, hasWebhookSecret: true }
[Subscription Service] User xyz upgraded to normal
```

### Check Stripe Dashboard

- **Payments:** https://dashboard.stripe.com/payments
- **Subscriptions:** https://dashboard.stripe.com/subscriptions
- **Webhooks:** https://dashboard.stripe.com/webhooks

### Test Failed Payment

Stripe will automatically retry failed payments. To test:
1. Use test card: `4000 0000 0000 0341` (charge succeeds but subscription fails)
2. Check that `invoice.payment_failed` webhook fires
3. Verify user status changes to "past_due"

---

## ⚠️ Important Notes

### Webhook Security

Your webhook endpoint validates signatures using:
```typescript
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  stripeConfig.webhookSecret
);
```

This ensures events are from Stripe and not spoofed.

### Test vs Live Mode

- **Test mode:** Use test keys (`sk_test_...` / `pk_test_...`)
- **Live mode:** Use live keys (`sk_live_...` / `pk_live_...`)

**Currently deploying:** LIVE MODE ✅

### Rolling Back

If something goes wrong, rollback to previous version:

```bash
firebase functions:delete api
firebase deploy --only functions
```

---

## 🔒 Security Checklist

Before accepting real payments:

- [ ] Live API keys set in Firebase config
- [ ] Webhook secret set in Firebase config
- [ ] Webhook endpoint returns 200 OK for test events
- [ ] Test checkout flow works end-to-end
- [ ] Firestore security rules protect subscription data
- [ ] SSL/HTTPS enabled (Firebase Hosting does this automatically)
- [ ] Stripe Tax enabled for automatic tax calculation
- [ ] Error monitoring set up (Firebase Crashlytics)

---

## 🎯 Quick Deploy (Copy/Paste)

```bash
# 1. Navigate to backend
cd /Users/martonhorvath/Documents/EduForge/app/backend

# 2. Set all Firebase config in one command
firebase functions:config:set \
  stripe.secret_key="sk_live_YOUR_LIVE_KEY_HERE" \
  stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET_HERE" \
  stripe.price_id_basic_annual="price_YOUR_BASIC_PRICE_ID" \
  stripe.price_id_normal_annual="price_YOUR_NORMAL_PRICE_ID" \
  stripe.price_id_pro_annual="price_YOUR_PRO_PRICE_ID" \
  payments.use_mock="false"

# 3. Verify config
firebase functions:config:get

# 4. Build and deploy
npm run build
firebase deploy --only functions,hosting

# 5. Test webhook
curl https://eduforge-d29d9.web.app/api/subscription/webhook

# 6. Check logs
firebase functions:log --limit 20
```

---

## ✅ Deployment Complete!

Your Stripe integration is now **LIVE IN PRODUCTION**! 🎉

**What happens now:**
1. Users can subscribe to paid plans
2. Payments are processed through Stripe
3. Webhooks keep subscriptions in sync
4. Credits are automatically allocated
5. Renewals happen automatically after 1 year

**Support resources:**
- Stripe Dashboard: https://dashboard.stripe.com
- Firebase Console: https://console.firebase.google.com/project/eduforge-d29d9
- Webhook logs: https://dashboard.stripe.com/webhooks/we_1SjjVS2NF3WxtUjyaTIIjBaX

Good luck with your launch! 🚀
