# 🚨 URGENT: Fix Supabase Permissions

## The Problem
The Supabase connection is working, but we're getting "permission denied for table products" error (401 Unauthorized).

## Quick Fix - Run This SQL in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run this EXACT query:

```sql
-- Option 1: QUICK FIX - Disable RLS temporarily (for testing)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;

-- Test if it works now
SELECT COUNT(*) FROM products;
```

## If Quick Fix Works, Then Apply Proper Security

After confirming the connection works with RLS disabled, re-enable it with proper policies:

```sql
-- Re-enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Create simple public read policies
CREATE POLICY "public_read_products" ON products
FOR SELECT USING (true);

CREATE POLICY "public_read_images" ON product_images
FOR SELECT USING (true);

CREATE POLICY "public_read_variants" ON product_variants
FOR SELECT USING (true);
```

## Test URLs

After running the SQL:

1. Test API: http://localhost:3000/api/test-supabase
2. Test Page: http://localhost:3000/test-products

## Expected Result

You should see:
```json
{
  "success": true,
  "message": "Supabase connection successful",
  "productsFound": 3,
  "products": [...]
}
```

## Current Status

- ✅ Environment variables are loaded correctly
- ✅ Supabase client is connecting
- ❌ RLS policies are blocking access
- 🔧 Need to fix permissions in Supabase Dashboard

## Next Steps

1. Run the Quick Fix SQL above
2. Test the connection
3. If it works, apply proper security policies
4. Report back the results!