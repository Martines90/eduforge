# ⚠️ CRITICAL: Update Stripe Webhook URL

## 🚨 Action Required

Your Stripe webhook is currently pointing to the **wrong URL** and needs to be updated immediately for subscriptions to work.

---

## Current Status

| Item | Status | Value |
|------|--------|-------|
| **Backend Functions** | ✅ DEPLOYED | `https://api-dvzsjor7ja-uc.a.run.app` |
| **Webhook Endpoint** | ✅ LIVE | `https://api-dvzsjor7ja-uc.a.run.app/api/subscription/webhook` |
| **Webhook URL in Stripe** | ❌ WRONG | `https://eduforge-d29d9.web.app/api/subscription/webhook` |

---

## 🔧 How to Update Webhook URL

### Step 1: Open Stripe Dashboard
Go to: **https://dashboard.stripe.com/webhooks**

### Step 2: Find Your Webhook
- Look for webhook named: **"EduForger Subscriptions"**
- Destination ID: `we_1SjjVS2NF3WxtUjyaTIIjBaX`
- Click on it to open details

### Step 3: Update the URL
1. Click the **"..."** menu (three dots) in the top-right corner
2. Select **"Update details"**
3. Find the **"Endpoint URL"** field
4. **Change from:**
   ```
   https://eduforge-d29d9.web.app/api/subscription/webhook
   ```
   **To:**
   ```
   https://api-dvzsjor7ja-uc.a.run.app/api/subscription/webhook
   ```
5. Click **"Update endpoint"**

### Step 4: Verify the Update
After updating, the webhook details should show:
- ✅ **Endpoint URL:** `https://api-dvzsjor7ja-uc.a.run.app/api/subscription/webhook`
- ✅ **Status:** Active
- ✅ **API Version:** 2025-12-15.clover
- ✅ **Events:** 4 events selected

---

## ✅ Test After Updating

### Test 1: Send Test Event
In the Stripe Dashboard webhook page:
1. Click **"Send test webhook"**
2. Select `checkout.session.completed`
3. Click **"Send test webhook"**
4. Should see ✅ **200 OK** response

### Test 2: Check Firebase Logs
```bash
cd /Users/martonhorvath/Documents/EduForger/app/backend
firebase functions:log --limit 20
```

Look for:
```
[Webhook] Received event: checkout.session.completed
[Subscription Service] Processing subscription...
```

---

## 🧪 Test Production Subscription

Once webhook URL is updated, test the full flow:

### 1. Start Local Frontend
```bash
cd /Users/martonhorvath/Documents/EduForger/app/frontend
npm run dev
```

### 2. Test Subscription
1. Open: http://localhost:3001/my-subscription
2. Click **"Subscribe"** on any plan
3. You'll be redirected to **Stripe Checkout** (LIVE MODE)
4. Use test card: **4242 4242 4242 4242**
5. Complete payment

### 3. Verify Success
Check that:
- ✅ Redirected to success page
- ✅ Subscription created in Firestore
- ✅ Credits allocated to user
- ✅ Webhook delivered in Stripe Dashboard (check "Recent deliveries")

---

## 📊 Monitor Production

### Stripe Dashboard
- **Webhooks:** https://dashboard.stripe.com/webhooks/we_1SjjVS2NF3WxtUjyaTIIjBaX
- **Payments:** https://dashboard.stripe.com/payments
- **Subscriptions:** https://dashboard.stripe.com/subscriptions

### Firebase Console
- **Functions:** https://console.firebase.google.com/project/eduforge-d29d9/functions
- **Firestore:** https://console.firebase.google.com/project/eduforge-d29d9/firestore
- **Logs:** https://console.firebase.google.com/project/eduforge-d29d9/logs

---

## ⚠️ Why This Is Critical

Until you update the webhook URL:
- ❌ Stripe will send events to the **old URL** (Firebase Hosting)
- ❌ Events will fail (404 or routing error)
- ❌ Subscriptions won't activate in Firestore
- ❌ Users won't get credits
- ❌ Payments will succeed but subscriptions won't work

After you update the webhook URL:
- ✅ Stripe sends events to **new URL** (Cloud Function)
- ✅ Events are processed correctly
- ✅ Subscriptions activate automatically
- ✅ Credits allocated immediately
- ✅ Everything works end-to-end

---

## 🎯 Quick Checklist

- [ ] Open Stripe Dashboard webhooks page
- [ ] Find "EduForger Subscriptions" webhook
- [ ] Update endpoint URL to: `https://api-dvzsjor7ja-uc.a.run.app/api/subscription/webhook`
- [ ] Send test webhook event
- [ ] Verify 200 OK response
- [ ] Test subscription flow with test card
- [ ] Monitor webhook deliveries

---

## ✅ Once Updated

After updating the webhook URL, your Stripe subscription system will be **FULLY OPERATIONAL** in production! 🎉

You can then:
1. Accept real payments from users
2. Process subscriptions automatically
3. Allocate credits based on tier
4. Handle renewals automatically

**Congratulations!** Your subscription system is production-ready! 🚀💰
