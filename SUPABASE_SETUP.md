# Supabase Environment Variables Setup for Vercel

## Required Environment Variables

To connect your Supabase database to the production deployment, you need to add these environment variables in Vercel:

### 1. NEXT_PUBLIC_SUPABASE_URL
- **Value**: Your Supabase project URL (e.g., `https://your-project.supabase.co`)
- **Where to find**: Supabase Dashboard > Settings > API > Project URL
- **Visibility**: Can be public (NEXT_PUBLIC_ prefix)

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Value**: Your Supabase anonymous/public key
- **Where to find**: Supabase Dashboard > Settings > API > Project API keys > anon/public key
- **Visibility**: Can be public (NEXT_PUBLIC_ prefix)

### 3. SUPABASE_SERVICE_ROLE_KEY
- **Value**: Your Supabase service role key (secret)
- **Where to find**: Supabase Dashboard > Settings > API > Project API keys > service_role key
- **Visibility**: Must be kept SECRET (no NEXT_PUBLIC_ prefix)
- **Important**: This key has admin privileges - never expose it client-side!

## How to Add to Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable:
   - Name: Copy the exact variable name from above
   - Value: Paste your Supabase value
   - Environment: Select "Production", "Preview", and "Development"
4. Click "Save" for each variable
5. Trigger a new deployment for changes to take effect

## Testing the Connection

After adding the environment variables and redeploying:

1. Visit: `https://your-domain.vercel.app/api/supabase/test`
2. You should see a JSON response showing:
   - Whether each variable is set
   - Connection test results
   - Product count from your database

## Troubleshooting

If you're still seeing errors:

1. **Double-check the values**: Ensure no extra spaces or quotes
2. **Verify URL format**: Should start with `https://` and end with `.supabase.co`
3. **Check key permissions**: The service role key should have full access
4. **Redeploy**: After adding variables, you must redeploy for changes to take effect
5. **Check Supabase logs**: Visit Supabase Dashboard > Logs to see any connection errors

## Local Development

For local development, create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Security Notes

- The service role key bypasses Row Level Security (RLS)
- Only use it in server-side code (API routes, server components)
- Never expose it in client-side code or commit it to git
- Consider using Row Level Security for additional protection

## Current Status

The application is configured to:
- Show mock data when Supabase is not configured
- Display helpful error messages
- Gracefully handle missing environment variables
- Provide a test endpoint for verification

Once you add the environment variables to Vercel, your 183 products from Supabase will automatically appear on the shop page!