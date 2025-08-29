# 🔗 Supabase Integration Guide - Breaking the Circle

## 📋 Current Situation

We have two projects that need to share the same Supabase database:
1. **Main KCT Site** - Core products stored locally, fetches additional products from Supabase
2. **Admin Backend** - Manages 500+ products, customers, analytics in Supabase

### The Problem
- Products load → Images break → Fix images → Admin breaks → Fix admin → Products break
- Different connection methods causing sync issues
- Permission errors: "permission denied for table products"

## 🎯 The Solution: ONE Shared Service

Both projects will use IDENTICAL code to interact with Supabase.

## 📁 File Structure

```
BOTH PROJECTS need these files:
├── src/
│   ├── lib/
│   │   ├── shared/
│   │   │   └── supabase-products.ts  (EXACT SAME FILE)
│   │   └── supabase/
│   │       └── client.ts              (EXACT SAME FILE)
```

## 🔧 Implementation Steps

### Step 1: Fix Supabase Permissions

**In Supabase Dashboard:**
```sql
-- Enable read access for products
CREATE POLICY "Enable read access for all users" ON "public"."products"
FOR SELECT USING (true);

-- Enable read access for product_images
CREATE POLICY "Enable read access for all users" ON "public"."product_images"
FOR SELECT USING (true);

-- Enable read access for product_variants
CREATE POLICY "Enable read access for all users" ON "public"."product_variants"
FOR SELECT USING (true);
```

### Step 2: Create Shared Supabase Client

**File: `/src/lib/supabase/client.ts`** (BOTH PROJECTS)
```typescript
import { createClient } from '@supabase/supabase-js';

// Singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    });
  }

  return supabaseInstance;
}
```

### Step 3: Environment Variables

**Both projects need in `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://gvcswimqaxvylgxbklbz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24
```

### Step 4: Copy Shared Service

The file `/src/lib/shared/supabase-products.ts` has been created in the main project. 
**Copy it EXACTLY to the admin backend.**

Key functions:
- `fetchProductsWithImages()` - List products with images and variants
- `getProduct()` - Get single product by slug or ID
- `getProductImageUrl()` - Get image URL with fallback
- `testSupabaseConnection()` - Verify connection

## 🧪 Testing

### 1. Test Connection (Both Projects)
```typescript
// In any component or page
import { testSupabaseConnection } from '@/lib/shared/supabase-products';

const result = await testSupabaseConnection();
console.log(result); // Should show { success: true, message: 'Supabase connection successful' }
```

### 2. Test Products Fetch
```typescript
import { fetchProductsWithImages } from '@/lib/shared/supabase-products';

const result = await fetchProductsWithImages({ limit: 5 });
console.log(`Found ${result.data.length} products`);
```

## 🚨 Common Issues & Solutions

### Issue: "permission denied for table products"
**Solution:** Run the SQL policies above in Supabase dashboard

### Issue: "Cannot read properties of undefined"
**Solution:** Check environment variables are loaded

### Issue: Images not loading
**Solution:** Use `getProductImageUrl()` function - it has fallback logic

### Issue: Different data between projects
**Solution:** Ensure BOTH projects use the EXACT same service file

## 📝 For Claude Code Instances

### Main Project Claude (this one):
1. ✅ Created shared service at `/src/lib/shared/supabase-products.ts`
2. ✅ Created test page at `/test-products`
3. ⏳ Waiting for Supabase permissions to be fixed

### Backend Project Claude (in Cursor):
1. ⏳ Copy `/src/lib/shared/supabase-products.ts` from main project
2. ⏳ Replace ALL product fetching logic with shared functions
3. ⏳ Test the connection
4. ⏳ Update any components using old methods

## 🎯 Success Criteria

When this is working correctly:
- ✅ Both projects can fetch products
- ✅ Images load properly in both projects
- ✅ Changes in one project don't break the other
- ✅ Same product data appears in both projects

## 🚀 Next Steps

1. **Fix Supabase permissions** (most important!)
2. **Backend Claude**: Copy the shared service file
3. **Test in both projects** simultaneously
4. **Celebrate** - no more circles! 🎉

---

**Remember:** The key is using IDENTICAL code in both projects. No variations, no "improvements" - just copy and paste!