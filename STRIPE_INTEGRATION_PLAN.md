# KCT Menswear Stripe Integration Plan

## Phase 1: Environment Setup (Day 1)

### 1.1 Update Environment Variables
```bash
# Add to .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RAMT2CHc12x7sCzz0cBxUwBPONdyvxMnhDRMwC1bgoaFlDgmEmfvcJZT7yk7jOuEo4LpWkFpb5Gv88DJ9fSB49j00QtRac8uW
STRIPE_SECRET_KEY=sk_live_REDACTED
STRIPE_WEBHOOK_SECRET=whsec_xxxxx # Will get this after creating webhook endpoint
```

### 1.2 Install Stripe Dependencies
```bash
npm install @stripe/stripe-js stripe
```

## Phase 2: Product Data Integration (Day 1-2)

### 2.1 Create Stripe Product Service
```typescript
// src/lib/services/stripeProductService.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export const stripeProducts = {
  // Product IDs from your documentation
  suits: {
    navy: { productId: 'prod_SlQuqaI2IR6FRm', twoPiece: 'price_1Rpv2tCHc12x7sCzVvLRto3m', threePiece: 'price_1Rpv31CHc12x7sCzlFtlUflr' },
    beige: { productId: 'prod_SlRx1FInciqpks', twoPiece: 'price_1Rpv3FCHc12x7sCzg9nHaXkM', threePiece: 'price_1Rpv3QCHc12x7sCzMVTfaqEE' },
    // ... add all 14 suits
  },
  ties: {
    ultraSkinny: { productId: 'prod_SlSC9yAp6lLFm3', priceId: 'price_1RpvHlCHc12x7sCzp0TVNS92' },
    skinny: { productId: 'prod_SlSC1Sy11qUgt1', priceId: 'price_1RpvHyCHc12x7sCzjX1WV931' },
    classic: { productId: 'prod_SlSCPLZUyO8MFe', priceId: 'price_1RpvI9CHc12x7sCzE8Q9emhw' },
    bowTie: { productId: 'prod_SlSC8NMRQDcAAe', priceId: 'price_1RpvIMCHc12x7sCzj6ZTx21q' },
  },
  // ... add other categories
};

export async function fetchStripeProducts() {
  const products = await stripe.products.list({
    active: true,
    limit: 100,
    expand: ['data.default_price']
  });
  
  return products.data;
}
```

### 2.2 Create Product API Route
```typescript
// src/app/api/stripe/products/route.ts
import { NextResponse } from 'next/server';
import { fetchStripeProducts } from '@/lib/services/stripeProductService';

export async function GET() {
  try {
    const products = await fetchStripeProducts();
    
    // Transform to match your frontend structure
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.default_price?.unit_amount ? product.default_price.unit_amount / 100 : 0,
      stripePriceId: product.default_price?.id,
      images: product.images,
      metadata: product.metadata,
      category: product.metadata.category || 'uncategorized',
      availableColors: JSON.parse(product.metadata.available_colors || '[]'),
      availableSizes: JSON.parse(product.metadata.available_sizes || '[]'),
    }));
    
    return NextResponse.json({ products: transformedProducts });
  } catch (error) {
    console.error('Error fetching Stripe products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
```

## Phase 3: Checkout Integration (Day 3-4)

### 3.1 Create Checkout Session API
```typescript
// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const { items, customerEmail } = await req.json();
    
    // Build line items with metadata
    const lineItems = items.map((item: any) => ({
      price: item.stripePriceId,
      quantity: item.quantity,
    }));
    
    // Store detailed order information in metadata
    const orderDetails = items.map((item: any) => ({
      productName: item.name,
      size: item.selectedSize,
      color: item.selectedColor,
      sku: `${item.id}-${item.selectedColor}-${item.selectedSize}`,
      quantity: item.quantity,
      price: item.price,
    }));
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/cart`,
      customer_email: customerEmail,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      automatic_tax: {
        enabled: true,
      },
      metadata: {
        order_details: JSON.stringify(orderDetails),
      },
    });
    
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
```

### 3.2 Update Cart Component
```typescript
// src/components/cart/CheckoutButton.tsx
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '@/lib/hooks/useCart';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function CheckoutButton() {
  const { items, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  
  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            stripePriceId: item.stripePriceId,
            quantity: item.quantity,
            name: item.name,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
            id: item.id,
            price: item.price,
          })),
          customerEmail: '' // Optional: collect email before checkout
        }),
      });
      
      const { sessionId, url } = await response.json();
      
      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleCheckout}
      disabled={loading || items.length === 0}
      className="w-full bg-black text-white py-4 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
    >
      {loading ? 'Processing...' : `Checkout - $${totalPrice.toFixed(2)}`}
    </button>
  );
}
```

## Phase 4: Webhook & Order Capture (Day 5)

### 4.1 Create Webhook Handler
```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Parse order details from metadata
    const orderDetails = JSON.parse(session.metadata?.order_details || '[]');
    
    // Save to Supabase
    const { error } = await supabase.from('orders').insert({
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent,
      customer_email: session.customer_email,
      customer_name: session.customer_details?.name,
      shipping_address: session.shipping_details?.address,
      items: orderDetails,
      subtotal: (session.amount_subtotal || 0) / 100,
      tax: (session.total_details?.amount_tax || 0) / 100,
      total: (session.amount_total || 0) / 100,
      status: 'paid',
      created_at: new Date().toISOString(),
    });
    
    if (error) {
      console.error('Error saving order:', error);
    } else {
      // Send confirmation email
      await sendOrderConfirmation(session, orderDetails);
    }
  }
  
  return NextResponse.json({ received: true });
}

async function sendOrderConfirmation(session: Stripe.Checkout.Session, orderDetails: any[]) {
  // Implement email sending logic
  console.log('Sending confirmation to:', session.customer_email);
}
```

### 4.2 Create Supabase Tables
```sql
-- Run these in Supabase SQL editor

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent TEXT,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  shipping_address JSONB,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2),
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product options (for future use)
CREATE TABLE product_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_product_id TEXT UNIQUE NOT NULL,
  available_colors JSONB,
  available_sizes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer requests
CREATE TABLE customer_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  type TEXT, -- 'sizing_help', 'custom_order', 'general'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_requests ENABLE ROW LEVEL SECURITY;
```

## Phase 5: Testing & Polish (Day 6-7)

### 5.1 Create Success Page
```typescript
// src/app/checkout/success/page.tsx
export default async function CheckoutSuccess({ searchParams }: { searchParams: { session_id: string } }) {
  // Verify the session and show order details
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
      <p>Thank you for your purchase. You'll receive an email confirmation shortly.</p>
      {/* Add order details here */}
    </div>
  );
}
```

### 5.2 Update Product Pages
```typescript
// Update existing product components to use Stripe data
// src/lib/hooks/useProducts.ts
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/stripe/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products);
        setLoading(false);
      });
  }, []);
  
  return { products, loading };
}
```

## Quick Start Commands

```bash
# 1. Update environment variables
echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RAMT2CHc12x7sCzz0cBxUwBPONdyvxMnhDRMwC1bgoaFlDgmEmfvcJZT7yk7jOuEo4LpWkFpb5Gv88DJ9fSB49j00QtRac8uW
STRIPE_SECRET_KEY=sk_live_REDACTED" >> .env.local

# 2. Install dependencies
npm install @stripe/stripe-js stripe

# 3. Create webhook endpoint in Stripe Dashboard
# https://dashboard.stripe.com/webhooks
# Add endpoint: https://your-domain.com/api/webhooks/stripe
# Select events: checkout.session.completed

# 4. Add webhook secret to .env.local
# STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# 5. Test locally with Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Key Features Included

1. ✅ Automatic tax calculation
2. ✅ Shipping address collection
3. ✅ Size/color metadata passed to orders
4. ✅ Order saved to Supabase with full details
5. ✅ Email confirmation setup
6. ✅ Mobile-responsive checkout
7. ✅ Error handling

## Testing Checklist

- [ ] Products load from Stripe API
- [ ] Cart adds items with size/color selections
- [ ] Checkout redirects to Stripe
- [ ] Successful payment triggers webhook
- [ ] Order saved to Supabase with all details
- [ ] Customer receives confirmation email
- [ ] Success page shows order summary

## Next Steps After Launch

1. Add Express Checkout for faster conversions
2. Implement customer accounts with order history
3. Add inventory notifications
4. Create admin dashboard for order management
5. Implement bundle discount logic
6. Add AI recommendations based on purchase data

This plan gets you selling immediately while keeping all the complex features for later!