# Required Railway Environment Variables

## Critical for Checkout to Work

These MUST be set in Railway Dashboard → Your Service → Variables:

```env
# Stripe Configuration (REQUIRED FOR PAYMENT)
STRIPE_SECRET_KEY=sk_live_[YOUR_STRIPE_SECRET_KEY_HERE]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RAMT2CHc12x7sCzz0cBxUwBPONdyvxMnhDRMwC1bgoaFlDgmEmfvcJZT7yk7jOuEo4LpWkFpb5Gv88DJ9fSB49j00QtRac8uW

# Medusa Backend Configuration
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://backend-production-7441.up.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81
NEXT_PUBLIC_MEDUSA_REGION_ID=reg_01K3S6NDGAC1DSWH9MCZCWBWWD
NEXT_PUBLIC_SALES_CHANNEL_ID=sc_01JE83JN1YZ9NXRCGBM8WTDHRK

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://storefront-production-c1c6.up.railway.app
NODE_ENV=production

# Build Configuration (Already Set)
NIXPACKS_NODE_VERSION=20
```

## Verification Checklist

1. ✅ Cart page routes to `/checkout-stripe`
2. ✅ Stripe publishable key is hardcoded (backup for env vars)
3. ✅ New API route at `/api/checkout/stripe-payment` for proper Payment Intents
4. ✅ StripeCheckout component with proper error handling
5. ✅ Manual payment fallback for testing
6. ✅ Success page exists at `/checkout/success`

## Payment Flow

1. User adds items to cart
2. Clicks checkout → goes to `/checkout-stripe`
3. Fills shipping info
4. Clicks "Continue to Payment"
5. StripeCheckout component:
   - Calls `/api/checkout/stripe-payment` to create Payment Intent
   - Shows Stripe Payment Element
   - OR shows manual test payment form as fallback
6. On success → redirects to `/checkout/success`

## Testing

Use test card: `4242 4242 4242 4242`
- Any future expiry date (e.g., 12/34)
- Any 3-digit CVC (e.g., 123)
- Any ZIP code (e.g., 12345)

## Troubleshooting

If payment still fails:
1. Check browser console for errors
2. Check Network tab for failed API calls
3. Verify all environment variables are set in Railway
4. Try the manual payment form (click "Having issues?")
5. Check Stripe Dashboard for error logs

## Important Notes

- The Stripe secret key MUST be set as environment variable (not hardcoded)
- The publishable key is hardcoded as fallback but should also be in env vars
- The backend URL must match your actual Medusa backend deployment
- All NEXT_PUBLIC_ variables must be set at build time