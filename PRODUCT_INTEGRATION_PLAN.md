# 🛍️ Product Integration Plan - Core + Supabase

## Current State ✅
- **Core Products**: Static files, fast loading, Stripe integrated
- **Supabase Products**: Dynamic inventory, database-driven, images from R2

## Integration Strategy

### 1. Unified Cart System
```typescript
// Update cart item structure
interface UnifiedCartItem {
  productId: string;
  productSource: 'core' | 'supabase';  // Track source
  stripePriceId: string;                // Required for both
  quantity: number;
  size: string;
  name: string;
  price: number;
  image?: string;
  metadata?: any;
}
```

### 2. Stripe Integration for Supabase Products

**Option A: Add to Supabase Schema**
```sql
ALTER TABLE products ADD COLUMN stripe_price_id VARCHAR(255);
ALTER TABLE product_variants ADD COLUMN stripe_price_id VARCHAR(255);
```

**Option B: Use additional_info JSON**
```typescript
// In Supabase product
additional_info: {
  stripe_price_id: "price_xxx",
  stripe_product_id: "prod_xxx"
}
```

### 3. Checkout Flow Updates

```typescript
// In CheckoutButton.tsx
const createCheckoutSession = async (items: UnifiedCartItem[]) => {
  const lineItems = await Promise.all(items.map(async (item) => {
    let stripePriceId;
    
    if (item.productSource === 'core') {
      // Use existing static mapping
      stripePriceId = getStaticStripePriceId(item);
    } else {
      // Get from Supabase product
      const product = await getSupabaseProduct(item.productId);
      stripePriceId = product.stripe_price_id;
    }
    
    return {
      price: stripePriceId,
      quantity: item.quantity,
    };
  }));
  
  // Continue with existing Stripe session creation
};
```

### 4. Product Display Strategy

**Collections Page Structure:**
- `/collections/suits` - Core products only (performance)
- `/collections/accessories` - Mix of both
- `/collections/new-arrivals` - Primarily Supabase
- `/collections/seasonal` - Supabase products

**Product Components:**
- Use `ProductCard` for core products
- Use `SupabaseProductCard` for Supabase products
- Both work with same cart system

### 5. Search & Filter Integration

```typescript
// Unified search across both product types
const searchProducts = async (query: string) => {
  const [coreResults, supabaseResults] = await Promise.all([
    searchCoreProducts(query),
    searchSupabaseProducts(query)
  ]);
  
  return [...coreResults, ...supabaseResults];
};
```

## Implementation Steps

### Phase 1: Cart Unification (Today)
1. Update cart store to support product source
2. Modify cart components to handle both types
3. Test adding both product types to cart

### Phase 2: Stripe Setup (Tomorrow)
1. Add Stripe price IDs to Supabase products
2. Create Stripe products for Supabase items
3. Update checkout to handle mixed carts

### Phase 3: Display Integration (This Week)
1. Create unified product grid component
2. Update collection pages for mixed products
3. Implement cross-type search

### Phase 4: Testing (Next Week)
1. Test mixed cart scenarios
2. Verify Stripe payments for both types
3. Check inventory management

## Benefits of This Approach

✅ **Performance**: Core products stay fast (no DB calls)
✅ **Flexibility**: Supabase for dynamic inventory
✅ **Unified Experience**: Single cart, single checkout
✅ **Scalability**: Easy to move products between systems
✅ **SEO**: Static products better for SEO

## Example: Mixed Collection Page

```typescript
// New Arrivals page mixing both types
export default function NewArrivalsPage() {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    // Load both types
    Promise.all([
      getCoreNewArrivals(),      // Static featured items
      getSupabaseNewArrivals()    // Dynamic inventory
    ]).then(([core, dynamic]) => {
      setProducts([...core, ...dynamic]);
    });
  }, []);
  
  return (
    <ProductGrid 
      products={products}
      renderItem={(product) => 
        product.source === 'core' 
          ? <ProductCard {...product} />
          : <SupabaseProductCard {...product} />
      }
    />
  );
}
```

## Key Points

1. **Both Systems Coexist**: Not replacing, but enhancing
2. **Single Payment Flow**: Everything through Stripe
3. **Mixed Collections**: Some pages pure, some mixed
4. **Unified Cart**: Handle all products together
5. **Future Flexibility**: Can migrate products between systems

This gives you the best of both worlds - performance for core products and flexibility for dynamic inventory!