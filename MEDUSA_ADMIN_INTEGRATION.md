# Medusa Admin Integration Guide

## Current Status
- ✅ Payments work correctly through Stripe
- ✅ Customers see order confirmation
- ❌ Orders don't appear in Medusa admin
- ❌ Inventory not updated

## To Connect Orders to Medusa Admin

### Option 1: Stripe Webhook (Recommended)
1. **Set up Stripe Webhook in Dashboard:**
   - Go to https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - URL: `https://storefront-production-c1c6.up.railway.app/api/webhooks/stripe`
   - Events: Select `payment_intent.succeeded`
   - Copy the webhook secret (starts with `whsec_`)

2. **Add to Railway Environment Variables:**
   ```
   STRIPE_WEBHOOK_SECRET=whsec_[your_webhook_secret]
   ```

3. **How it works:**
   - When payment succeeds, Stripe calls our webhook
   - Webhook creates order in Medusa backend
   - Order appears in admin dashboard

### Option 2: Fix Medusa Backend (Permanent Solution)
The real issue is in the Medusa backend - it's multiplying prices by 100.

1. **In Medusa Backend, find and fix:**
   ```javascript
   // Look for payment amount calculations
   // Change from:
   amount: cart.total * 100  // This causes 100x bug
   
   // To:
   amount: cart.total  // Cart total is already in cents
   ```

2. **Common locations to check:**
   - `/src/services/payment-provider.ts`
   - `/src/strategies/stripe.ts`
   - Any Stripe payment plugin files

### Option 3: Manual Order Entry
For now, you can manually create orders in Medusa admin:
1. Go to Medusa Admin → Orders
2. Create new order
3. Use payment intent ID from Stripe as reference

## Testing the Integration

1. **Make a test purchase**
2. **Check Stripe Dashboard** - Payment should show as succeeded
3. **Check Railway Logs** - Look for "Order created in Medusa"
4. **Check Medusa Admin** - Order should appear

## Current Workaround
Orders are being tracked in:
- Stripe Dashboard (payments)
- Customer receives confirmation
- You can export from Stripe for fulfillment

## Need Help?
The webhook code is at: `/api/webhooks/stripe/route.ts`
It attempts to complete the cart in Medusa after payment succeeds.