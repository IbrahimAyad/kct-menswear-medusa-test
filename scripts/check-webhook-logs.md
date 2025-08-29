# Debugging Webhook Errors

## Steps to check webhook errors:

### 1. Check Vercel Function Logs
Go to your Vercel dashboard and navigate to:
- Project: kct-menswear-v2
- Functions tab
- Look for `/api/stripe/webhook` 
- Click on it to see the logs

### 2. Test webhook endpoint manually
Run this command to test if the endpoint is accessible:

```bash
curl -X POST https://kct-menswear-v2.vercel.app/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

This should return an error about missing stripe-signature header.

### 3. Use Stripe CLI to test
Install Stripe CLI and run:

```bash
stripe listen --forward-to https://kct-menswear-v2.vercel.app/api/stripe/webhook
```

Then trigger a test event:
```bash
stripe trigger checkout.session.completed
```

### 4. Check in Stripe Dashboard
1. Go to Stripe Dashboard > Developers > Webhooks
2. Click on your webhook endpoint
3. Click on "Webhook attempts" to see the specific error messages

### 5. Common issues and solutions:

**Issue: "No signatures found matching the expected signature for payload"**
- Solution: The STRIPE_WEBHOOK_SECRET in Vercel doesn't match the one in Stripe Dashboard

**Issue: "Webhook endpoint not configured on server"**
- Solution: STRIPE_WEBHOOK_SECRET is not set in Vercel environment variables

**Issue: Timeout errors**
- Solution: The webhook is taking too long to process. We've set maxDuration to 10 seconds.

### 6. Verify environment variables
In Vercel dashboard:
1. Go to Settings > Environment Variables
2. Verify these exist:
   - STRIPE_SECRET_KEY (should start with sk_live_ or sk_test_)
   - STRIPE_WEBHOOK_SECRET (should start with whsec_)

### 7. Test with Stripe's webhook test
In Stripe Dashboard:
1. Go to your webhook endpoint
2. Click "Send test webhook"
3. Select "checkout.session.completed" 
4. Click "Send test webhook"
5. Check the response