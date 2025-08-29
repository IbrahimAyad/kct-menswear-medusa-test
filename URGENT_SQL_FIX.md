# 🚨 URGENT: Simple SQL Fix for Supabase

## The Problem
RLS policies are blocking access to products tables.

## The Solution - Run This NOW

### Option 1: FASTEST FIX (Disable RLS)
```sql
-- Just run these 3 lines to disable security temporarily
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;
```

Then test: http://localhost:3000/api/test-supabase

### Option 2: Keep RLS but Allow Public Access
```sql
-- First, drop ALL existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Allow anonymous read access to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated read access to products" ON products;
DROP POLICY IF EXISTS "public_read_products" ON products;

-- Then create a simple public policy
CREATE POLICY "anyone_can_read" ON products
FOR SELECT TO public USING (true);

-- Repeat for other tables
CREATE POLICY "anyone_can_read" ON product_images
FOR SELECT TO public USING (true);

CREATE POLICY "anyone_can_read" ON product_variants
FOR SELECT TO public USING (true);
```

## After Running Either Option

1. Go to: http://localhost:3000/api/test-supabase
2. You should see: `{"success": true, ...}`

If it works, the products page will load!

## Current Status
- ✅ Supabase credentials are correct
- ✅ Connection is established
- ❌ RLS is blocking queries
- 🔧 Run the SQL above to fix it!