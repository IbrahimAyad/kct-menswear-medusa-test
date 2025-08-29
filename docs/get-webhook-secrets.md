# How to Get Your Webhook Secrets

## Important: Each webhook endpoint has its own unique secret

### For your Railway Backend Webhook:

1. **Go to Stripe Dashboard**
   - Navigate to: https://dashboard.stripe.com/webhooks

2. **Find your Railway webhook**
   - Look for: `https://kct-ecommerce-admin-backend-production.up.railway.app/api/webhooks/stripe`
   - Click on it

3. **Get the signing secret**
   - Under "Signing secret" click "Reveal"
   - Copy the secret (starts with `whsec_`)
   - This is your STRIPE_WEBHOOK_SECRET for Railway

4. **Update in Railway**
   - Go to Railway dashboard
   - Find your backend project
   - Go to Variables/Environment Variables
   - Update `STRIPE_WEBHOOK_SECRET` with the value from step 3

### For your Frontend/Vercel Webhook (if needed):

1. **In Stripe Dashboard**
   - Find your Vercel webhook (if you have one separate from Supabase)
   - Click on it
   - Reveal and copy its signing secret

2. **Update in Vercel**
   - Go to Vercel dashboard
   - Project Settings → Environment Variables
   - Update `STRIPE_WEBHOOK_SECRET`

## Key Points:
- ⚠️ **Never share webhook secrets publicly**
- Each webhook endpoint has a DIFFERENT secret
- Secrets always start with `whsec_`
- The secret in Railway must match the one shown in Stripe for that specific endpoint

## Example (not real secrets):
- Railway webhook secret: `whsec_abc123...` (from Stripe dashboard for Railway endpoint)
- Vercel webhook secret: `whsec_xyz789...` (from Stripe dashboard for Vercel endpoint)
- These are DIFFERENT and cannot be interchanged!