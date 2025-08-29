# Vercel Environment Variables Setup

## Required Environment Variables

You need to add these environment variables in your Vercel project settings:

### 1. Go to Vercel Dashboard
- Navigate to your project: https://vercel.com/dashboard
- Click on your project "kct-menswear-ai-enhanced"
- Go to "Settings" tab
- Click on "Environment Variables"

### 2. Add These Variables

#### Supabase (Required for Products)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Stripe (Required for Checkout)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```

#### Optional Services
```
# SendGrid (for emails)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_from_email

# Facebook Pixel
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=your_facebook_pixel_id

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_measurement_id
```

### 3. Important Notes

- Make sure to add these for all environments (Production, Preview, Development)
- After adding, redeploy your project for changes to take effect
- You can find your Supabase credentials at: https://app.supabase.com/project/_/settings/api
- Stripe keys are at: https://dashboard.stripe.com/apikeys

### 4. Verify Setup

After deployment, check the Vercel function logs to ensure environment variables are loaded:
- Go to Functions tab in Vercel
- Check logs for "Supabase env check: { hasSupabaseUrl: true, hasSupabaseKey: true }"

## Troubleshooting

If products aren't loading:
1. Check that Supabase environment variables are set correctly
2. Verify Supabase project is active and not paused
3. Check Vercel function logs for errors
4. Ensure your Supabase tables have proper RLS policies for anonymous access

## Current Status

The API has been updated with:
- Better error handling
- Graceful degradation (shows bundles if Supabase fails)
- Environment variable checking
- Detailed error messages in logs