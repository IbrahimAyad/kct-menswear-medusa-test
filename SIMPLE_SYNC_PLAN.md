# 🔄 Simple Sync Plan - Stop the Circle

## For Backend Claude in Cursor:

### Step 1: Copy This Exact Code
Create file: `src/lib/shared/supabase-products.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

// For Vite - use import.meta.env
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || 'https://gvcswimqaxvylgxbklbz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test function
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .limit(5);
    
    return { success: !error, data, error };
  } catch (err) {
    return { success: false, data: null, error: err };
  }
}

// Get all products
export async function fetchProductsWithImages(options?: {
  category?: string;
  limit?: number;
}) {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        images:product_images(*),
        variants:product_variants(*)
      `);
    
    if (options?.category) {
      query = query.eq('category', options.category);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    return {
      success: !error,
      data: data || [],
      error: error?.message || null
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

### Step 2: Test It
Create a test component and check if you can see the same products:
- Emerald Green Vest & Tie Set
- Black Sparkle Vest & Bowtie Set
- etc.

### Step 3: Report Back
Just tell me:
1. ✅/❌ Can you see products?
2. How many products total?

## The Key Point
Both projects should see the EXACT SAME products from the SAME Supabase instance. No separate databases, no different data.