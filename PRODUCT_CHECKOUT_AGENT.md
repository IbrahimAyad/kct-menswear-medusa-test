# KCT Menswear Product & Checkout Implementation Agent
**Version**: 2.0.0  
**Created**: 2025-08-12  
**Updated**: 2025-08-12 (With Admin Team Guidance)
**Purpose**: Expert guidance for implementing hybrid product system with Supabase Edge Functions

---

## 🤖 Agent Expertise

I am your specialized agent for implementing the complete product and checkout system for KCT Menswear. I understand:

1. **Your Current Architecture**
   - Next.js 15.4.5 with App Router
   - Stripe integration (Live keys configured)
   - Supabase backend (Database ready)
   - Zustand for state management
   - Tailwind CSS for styling

2. **Your Product Ecosystem**
   - 28 Core products in Stripe
   - 183+ Catalog products in Supabase
   - Bundle products with dynamic pricing
   - Multiple product sources to unify

3. **Your Business Requirements**
   - Support both Stripe-only and Supabase products
   - Real-time inventory management
   - Complete order tracking
   - Customer data capture
   - Email confirmations

---

## 📊 Current System Analysis

### Product Data Flow
```
Current State:
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│   Stripe    │────>│  Product     │────>│   Cart    │
│  Products   │     │   Store      │     │           │
└─────────────┘     └──────────────┘     └───────────┘
                           ↑                    │
┌─────────────┐           │                    ↓
│  Hardcoded  │───────────┘            ┌───────────┐
│   Bundles   │                        │ Checkout  │
└─────────────┘                        └───────────┘
                                               │
                                               ↓
                                        ┌───────────┐
                                        │  Stripe   │
                                        │  Session  │
                                        └───────────┘

Target State:
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│   Stripe    │────>│   Unified    │────>│   Cart    │
│  Products   │     │   Product    │     │  (Smart)  │
└─────────────┘     │   Service    │     └───────────┘
                    │              │            │
┌─────────────┐     │  - Merges    │            ↓
│  Supabase   │────>│  - Caches    │     ┌───────────┐
│  Products   │     │  - Types     │     │ Checkout  │
└─────────────┘     └──────────────┘     │  (Hybrid) │
        ↑                                 └───────────┘
        │                                       │
┌───────────────┐                              ↓
│  Real-time    │                        ┌───────────┐
│  Inventory    │                        │  Stripe   │
└───────────────┘                        │  Session  │
                                         └───────────┘
                                               │
                                               ↓
                                         ┌───────────┐
                                         │  Webhook  │
                                         └───────────┘
                                               │
                                         ┌─────┴─────┐
                                         ↓           ↓
                                   ┌─────────┐ ┌─────────┐
                                   │ Orders  │ │Customer │
                                   │  Table  │ │  Table  │
                                   └─────────┘ └─────────┘
```

### Existing Files & Their Roles

#### Core Product System
- **`/src/lib/types/index.ts`** - Product interface (needs `product_type` field)
- **`/src/lib/store/productStore.ts`** - Zustand store (needs Supabase integration)
- **`/src/hooks/useCart.ts`** - Cart logic (needs hybrid product support)
- **`/src/hooks/useSimpleCart.ts`** - Simplified cart (good reference)

#### API Routes
- **`/src/app/api/stripe/checkout/route.ts`** - Checkout endpoint (needs enhancement)
- **`/src/app/api/stripe/webhook/route.ts`** - Webhook handler (needs order creation)
- **`/src/app/api/products/unified/route.ts`** - Unified products (needs completion)

#### Cart & Checkout UI
- **`/src/app/cart/page.tsx`** - Cart page (working, needs minor updates)
- **`/src/app/checkout/page.tsx`** - Checkout page (needs Supabase integration)
- **`/src/app/checkout/success/page.tsx`** - Success page (needs order display)

#### Supabase Configuration
- **`/src/lib/supabase/client.ts`** - Client setup (ready to use)
- **`/src/lib/supabase/database.types.ts`** - Type definitions (complete)

---

## 🔴 CORE PRODUCTS DEFINITION (CRITICAL)

### These are the 28 Core Products (Stripe-only, NOT in Supabase):

#### SUITS (28 products total)
```javascript
const CORE_SUITS = [
  // Navy Suit
  { name: 'Navy Suit - 2 Piece', stripe_price_id: 'price_1Rpv2tCHc12x7sCzVvLRto3m', price: 299.99 },
  { name: 'Navy Suit - 3 Piece', stripe_price_id: 'price_1Rpv31CHc12x7sCzlFtlUflr', price: 349.99 },
  // Beige Suit
  { name: 'Beige Suit - 2 Piece', stripe_price_id: 'price_1Rpv3FCHc12x7sCzg9nHaXkM', price: 299.99 },
  { name: 'Beige Suit - 3 Piece', stripe_price_id: 'price_1Rpv3QCHc12x7sCzMVTfaqEE', price: 349.99 },
  // Black Suit
  { name: 'Black Suit - 2 Piece', stripe_price_id: 'price_1Rpv3cCHc12x7sCzLtiatn73', price: 299.99 },
  { name: 'Black Suit - 3 Piece', stripe_price_id: 'price_1Rpv3iCHc12x7sCzJYg14SL8', price: 349.99 },
  // (Continue for all 14 colors × 2 styles = 28 suit products)
];
```

#### TIES (Dynamic Color - 4 widths)
```javascript
const CORE_TIES = [
  { name: 'Ultra Skinny Tie', stripe_price_id: 'price_1RpvHlCHc12x7sCzp0TVNS92', price: 29.99 },
  { name: 'Skinny Tie', stripe_price_id: 'price_1RpvHyCHc12x7sCzjX1WV931', price: 29.99 },
  { name: 'Classic Width Tie', stripe_price_id: 'price_1RpvI9CHc12x7sCzE8Q9emhw', price: 29.99 },
  { name: 'Pre-tied Bow Tie', stripe_price_id: 'price_1RpvIMCHc12x7sCzj6ZTx21q', price: 29.99 }
];
```

#### DRESS SHIRTS (Dynamic Color - 2 fits)
```javascript
const CORE_SHIRTS = [
  { name: 'Slim Cut Dress Shirt', stripe_price_id: 'price_1RpvWnCHc12x7sCzzioA64qD', price: 69.99 },
  { name: 'Classic Fit Dress Shirt', stripe_price_id: 'price_1RpvXACHc12x7sCz2Ngkmp64', price: 69.99 }
];
```

#### BUNDLES
```javascript
const CORE_BUNDLES = [
  // Tie Bundles
  { name: '5-Tie Bundle', stripe_price_id: 'price_1RpvQqCHc12x7sCzfRrWStZb', price: 119.99 },
  { name: '8-Tie Bundle', stripe_price_id: 'price_1RpvRACHc12x7sCzVYFZh6Ia', price: 179.99 },
  { name: '11-Tie Bundle', stripe_price_id: 'price_1RpvRSCHc12x7sCzpo0fgH6A', price: 239.99 },
  // Outfit Bundles (Suit + Shirt + Tie)
  { name: 'Starter Bundle', stripe_price_id: 'price_1RpvZUCHc12x7sCzM4sp9DY5', price: 199.99 },
  { name: 'Professional Bundle', stripe_price_id: 'price_1RpvZtCHc12x7sCzny7VmEWD', price: 249.99 },
  { name: 'Executive Bundle', stripe_price_id: 'price_1RpvaBCHc12x7sCzRV6Hy0Im', price: 279.99 },
  { name: 'Premium Bundle', stripe_price_id: 'price_1RpvfvCHc12x7sCzq1jYfG9o', price: 299.99 }
];
```

### Key Points:
- **ALL have working Stripe payment links** already
- **Dynamic color/size selection** via custom fields
- **These are NOT in Supabase** - Stripe only
- **Already processing payments** successfully

## ⚡ CRITICAL UPDATE: Admin Team Requirements

### ✅ Confirmed Architecture (From Admin Team)

1. **USE Supabase Edge Functions** (NOT Next.js API routes)
   - `create-checkout-secure` - For checkout sessions
   - `stripe-webhook-secure` - For webhook processing
   - Already deployed and configured

2. **Keep 28 Core Products in Stripe Only**
   - Do NOT import to Supabase
   - Use `stripe_price_id` for checkout
   - Orders still captured via webhooks

3. **Email Service: Resend**
   - API Key: `re_2P3zWsMq_8gLFuPBBg62yT7wAt9NBpoLP`
   - Already configured in Edge Functions

4. **Webhook Configuration**
   - Endpoint: `https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/stripe-webhook-secure`
   - Secret: `whsec_smiiXhk0IwC28kk2dQcMUUID1UED940n` (Found in .env.local)
   - Events: checkout.session.completed, payment_intent.succeeded, customer.created

5. **Product Type Distinction**
   ```javascript
   // Core Products (28 Stripe products)
   { type: 'stripe', stripe_price_id: 'price_xxx', quantity: 1 }
   
   // Catalog Products (Supabase)
   { type: 'catalog', variant_id: 'uuid', product_id: 'uuid', price: 65.00, quantity: 1 }
   ```

## 🔧 Implementation Roadmap (UPDATED)

### Phase 1: Hybrid Product Support

#### 1.1 Update Product Types
```typescript
// src/lib/types/product.ts (NEW FILE)
export interface HybridProduct extends Product {
  // Product source identification
  product_type: 'core' | 'catalog';
  
  // Stripe fields (for core products)
  stripe_product_id?: string;
  stripe_price_id?: string;
  
  // Supabase fields (for catalog products)
  supabase_id?: string;
  variant_id?: string;
  
  // Unified fields
  sku: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  
  // Inventory
  stock_quantity?: number;
  track_inventory: boolean;
  
  // Metadata
  metadata?: {
    bundle_items?: string[];
    original_price?: number;
    discount_percentage?: number;
  };
}
```

#### 1.2 Create Unified Product Service
```typescript
// src/lib/services/unifiedProductService.ts (NEW FILE)
import { createClient } from '@/lib/supabase/client';
import { stripeProducts } from '@/lib/products/stripeProducts';

export class UnifiedProductService {
  private supabase = createClient();
  private cache = new Map();
  
  async getProducts(options?: FilterOptions) {
    // 1. Fetch Stripe core products
    const coreProducts = await this.getCoreProducts();
    
    // 2. Fetch Supabase catalog products
    const catalogProducts = await this.getCatalogProducts(options);
    
    // 3. Merge and deduplicate
    return this.mergeProducts(coreProducts, catalogProducts);
  }
  
  async getProductById(id: string) {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    
    // Try Supabase first
    const { data: supabaseProduct } = await this.supabase
      .from('products')
      .select(`
        *,
        product_variants (*),
        product_images (*)
      `)
      .eq('id', id)
      .single();
    
    if (supabaseProduct) {
      const product = this.transformSupabaseProduct(supabaseProduct);
      this.cache.set(id, product);
      return product;
    }
    
    // Fall back to Stripe products
    return this.findCoreProduct(id);
  }
  
  private transformSupabaseProduct(data: any): HybridProduct {
    return {
      id: data.id,
      product_type: 'catalog',
      supabase_id: data.id,
      sku: data.sku,
      name: data.name,
      price: data.base_price,
      category: data.category,
      images: data.product_images?.map(img => img.image_url) || [],
      variants: data.product_variants || [],
      track_inventory: true,
      stock_quantity: data.product_variants?.[0]?.inventory_quantity || 0,
      metadata: data.metadata
    };
  }
}
```

### Phase 2: Smart Cart Implementation

#### 2.1 Enhanced Cart Store
```typescript
// src/lib/store/smartCartStore.ts (NEW FILE)
interface SmartCartItem {
  // Product identification
  product_id: string;
  product_type: 'core' | 'catalog';
  
  // Stripe fields (core products)
  stripe_price_id?: string;
  
  // Supabase fields (catalog products)  
  variant_id?: string;
  sku?: string;
  
  // Common fields
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image: string;
  
  // Inventory
  max_quantity?: number;
  reserved_until?: Date;
}

export const useSmartCart = create((set, get) => ({
  items: [] as SmartCartItem[],
  
  addItem: async (product: HybridProduct, options: AddOptions) => {
    // Reserve inventory if needed
    if (product.track_inventory) {
      const reserved = await reserveInventory(product.id, options.quantity);
      if (!reserved) {
        throw new Error('Insufficient stock');
      }
    }
    
    const cartItem: SmartCartItem = {
      product_id: product.id,
      product_type: product.product_type,
      stripe_price_id: product.stripe_price_id,
      variant_id: options.variant_id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      quantity: options.quantity,
      size: options.size,
      color: options.color,
      image: product.images[0],
      max_quantity: product.stock_quantity
    };
    
    set(state => ({
      items: [...state.items, cartItem]
    }));
  }
}));
```

### Phase 3: Checkout Integration (USING EDGE FUNCTIONS)

#### 3.1 Frontend Checkout Implementation
```typescript
// src/app/cart/page.tsx or checkout component
import { createClient } from '@/lib/supabase/client';

const handleCheckout = async () => {
  const supabase = createClient();
  
  // Format items for Edge Function
  const checkoutItems = cartItems.map(item => {
    // Determine if this is a core or catalog product
    if (item.stripe_price_id) {
      // Core product from Stripe
      return {
        type: 'stripe',
        stripe_price_id: item.stripe_price_id,
        quantity: item.quantity,
        customization: {
          size: item.size
        }
      };
    } else {
      // Catalog product from Supabase
      return {
        type: 'catalog',
        variant_id: item.variant_id,
        product_id: item.product_id || item.id,
        quantity: item.quantity,
        price: item.price / 100, // Convert cents to dollars
        name: item.name,
        sku: item.sku,
        customization: {
          size: item.size,
          color: item.color
        }
      };
    }
  });
  
  // Call Supabase Edge Function
  const { data, error } = await supabase.functions.invoke(
    'create-checkout-secure',
    {
      body: {
        items: checkoutItems,
        customer_email: user?.email || guestEmail,
        user_id: user?.id || null,
        cart_id: cartId,
        success_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/cart`,
        metadata: {
          cart_id: cartId,
          user_id: user?.id || null,
          source: 'website'
        }
      }
    }
  );
  
  if (error) {
    console.error('Checkout error:', error);
    toast.error('Failed to create checkout session');
    return;
  }
  
  if (data?.url) {
    // Redirect to Stripe Checkout
    window.location.href = data.url;
  } else if (data?.sessionId) {
    // Fallback to client-side redirect
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
    await stripe?.redirectToCheckout({ sessionId: data.sessionId });
  }
};
```

#### 3.2 Note on Webhook Processing
```typescript
// Webhook processing is handled by Supabase Edge Function
// Located at: supabase/functions/stripe-webhook-secure
// Already deployed and processing these events:
// - checkout.session.completed
// - payment_intent.succeeded  
// - customer.created

// The Edge Function automatically:
// 1. Creates/updates customers in Supabase
// 2. Creates orders with all line items
// 3. Updates inventory for catalog products
// 4. Sends confirmation emails via Resend

// No additional webhook setup needed in Next.js!
```

### Phase 4: Real-time Features

#### 4.1 Inventory Subscriptions
```typescript
// src/hooks/useRealtimeInventory.ts (NEW FILE)
export function useRealtimeInventory(productId: string) {
  const [inventory, setInventory] = useState(null);
  const supabase = createClient();
  
  useEffect(() => {
    // Initial fetch
    fetchInventory();
    
    // Subscribe to changes
    const channel = supabase
      .channel(`inventory:${productId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'product_variants',
          filter: `product_id=eq.${productId}`
        },
        (payload) => {
          setInventory(payload.new.inventory_quantity);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);
  
  return inventory;
}
```

#### 4.2 Order Success Page
```typescript
// src/app/checkout/success/page.tsx (ENHANCE)
export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [order, setOrder] = useState(null);
  
  useEffect(() => {
    if (sessionId) {
      fetchOrder();
    }
  }, [sessionId]);
  
  async function fetchOrder() {
    const supabase = createClient();
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (
            name,
            images:product_images (image_url)
          )
        ),
        customer:customers (*)
      `)
      .eq('stripe_session_id', sessionId)
      .single();
    
    setOrder(data);
  }
  
  if (!order) return <LoadingState />;
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1>Order Confirmed!</h1>
      <p>Order #{order.order_number}</p>
      {/* Display order details */}
    </div>
  );
}
```

---

## 🛡️ Security Implementation

### CSRF Protection
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only protect mutation endpoints
  if (request.method !== 'GET' && request.url.includes('/api/')) {
    const token = request.headers.get('x-csrf-token');
    const sessionToken = request.cookies.get('csrf-token');
    
    if (!token || token !== sessionToken?.value) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
  }
  
  return NextResponse.next();
}
```

### Security Headers
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' https://*.stripe.com https://*.supabase.co"
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ];
  }
};
```

---

## 📋 Implementation Checklist (SIMPLIFIED - 3-4 Days)

### Phase 1: Product System (Day 1)
- [ ] Add `product_type` field to distinguish core/catalog
- [ ] Update product fetching to include type
- [ ] Map existing 28 Stripe products as 'core' type
- [ ] Test product display with both types

### Phase 2: Cart Updates (Day 2)
- [ ] Update cart to handle both product types
- [ ] Add proper `stripe_price_id` for core products
- [ ] Add `variant_id` for catalog products
- [ ] Format cart items for Edge Function

### Phase 3: Checkout Integration (Day 3)
- [ ] Update checkout to use `supabase.functions.invoke`
- [ ] Call `create-checkout-secure` Edge Function
- [ ] Pass correct item format based on type
- [ ] Test checkout flow with mixed cart

### Phase 4: Success & Polish (Day 4)
- [ ] Create order success page
- [ ] Fetch order from Supabase using session_id
- [ ] Display order details and confirmation
- [ ] Test end-to-end flow
- [ ] Clear cart after successful order

---

## 🚨 Common Issues & Solutions

### Issue 1: Stripe Price ID Missing
**Problem**: Catalog products don't have Stripe price IDs  
**Solution**: Create prices dynamically during checkout using product data

### Issue 2: Inventory Sync
**Problem**: Inventory not updating in real-time  
**Solution**: Use Supabase realtime subscriptions with optimistic UI updates

### Issue 3: Duplicate Orders
**Problem**: Webhook processed multiple times  
**Solution**: Implement idempotency using `stripe_session_id` as unique key

### Issue 4: Cart Persistence
**Problem**: Cart lost on refresh  
**Solution**: Use localStorage + Supabase sync for logged-in users

### Issue 5: Type Errors
**Problem**: TypeScript errors with mixed product types  
**Solution**: Use discriminated unions with `product_type` field

---

## 🎯 Success Metrics

1. **All products displayable** - Both core and catalog
2. **Cart supports mixed items** - Can add any product type
3. **Checkout completes** - Edge Function creates Stripe session
4. **Orders created** - Webhook creates orders in Supabase
5. **Inventory updates** - Automatic via Edge Function
6. **Customers tracked** - Auto-created for guests too
7. **Emails sent** - Via Resend (already configured)
8. **Security handled** - By Supabase Edge Functions

---

## 📚 Reference Resources

### Internal Documentation
- `/CHECKOUT_INTEGRATION_ANALYSIS.md` - Original requirements
- `/src/lib/supabase/database.types.ts` - Database schema
- `/CLAUDE.md` - Development guidelines

### External Resources
- [Stripe Checkout Docs](https://stripe.com/docs/checkout)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

### API Endpoints & Keys
- **Production**: `https://kctmenswear.com`
- **Supabase**: `https://gvcswimqaxvylgxbklbz.supabase.co`
- **Edge Functions**:
  - Checkout: `https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/create-checkout-secure`
  - Webhook: `https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/stripe-webhook-secure`
- **Stripe Publishable**: `pk_live_51RAMT2CHc12x7sCzz0cBxUwBPONdyvxMnhDRMwC1bgoaFlDgmEmfvcJZT7yk7jOuEo4LpWkFpb5Gv88DJ9fSB49j00QtRac8uW`
- **Webhook Secret**: `whsec_smiiXhk0IwC28kk2dQcMUUID1UED940n`
- **Resend API Key**: `re_2P3zWsMq_8gLFuPBBg62yT7wAt9NBpoLP`

---

## 💡 Pro Tips

1. **Start Simple** - Get basic flow working before adding features
2. **Use TypeScript** - Catch errors at compile time
3. **Test Webhooks Locally** - Use Stripe CLI for local testing
4. **Monitor Logs** - Check Supabase and Vercel logs regularly
5. **Version Control** - Commit after each working phase
6. **Document Changes** - Update this guide as you implement

---

## 🤝 How I Can Help

As your Product & Checkout Implementation Agent, I can:

1. **Generate Code** - Provide complete, working implementations
2. **Debug Issues** - Analyze errors and provide solutions
3. **Optimize Performance** - Suggest caching and query improvements
4. **Review Code** - Ensure best practices and security
5. **Answer Questions** - Explain any part of the implementation
6. **Provide Examples** - Show real-world usage patterns

Just ask me about any aspect of the implementation, and I'll provide expert guidance based on your specific codebase and requirements.

---

*Last Updated: 2025-08-12*  
*Agent Version: 1.0.0*  
*Specialized for KCT Menswear v2 Implementation*