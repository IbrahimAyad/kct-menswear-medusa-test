# KCT Menswear Stripe Integration - Quick Start Guide

## ✅ What We've Set Up

1. **Environment Variables** - Added to `.env.local`
   - ✅ Publishable key
   - ✅ Secret key
   - ⏳ Webhook secret (needs to be added after creating webhook)

2. **Core Files Created**
   - ✅ `/lib/services/stripeProductService.ts` - Product catalog & helpers
   - ✅ `/app/api/stripe/products/route.ts` - Fetch products endpoint
   - ✅ `/app/api/stripe/checkout/route.ts` - Create checkout session
   - ✅ `/app/api/webhooks/stripe/route.ts` - Handle Stripe webhooks
   - ✅ `/components/cart/CheckoutButton.tsx` - Checkout UI component
   - ✅ `/app/checkout/success/page.tsx` - Success page
   - ✅ `/lib/hooks/useStripeProducts.ts` - React hook for products
   - ✅ `/supabase/migrations/001_stripe_integration.sql` - Database schema

## 🚀 Next Steps to Launch

### 1. Set Up Stripe Webhook (5 minutes)
```bash
# Go to Stripe Dashboard > Webhooks
# Add endpoint: https://your-domain.vercel.app/api/webhooks/stripe
# Select events: checkout.session.completed
# Copy the signing secret and add to .env.local:
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 2. Update Cart Integration (10 minutes)
Add the CheckoutButton to your existing cart:
```tsx
// In your CartDrawer or cart page
import { CheckoutButton } from '@/components/cart/CheckoutButton';

// Add to the bottom of cart
<CheckoutButton />
```

### 3. Update Product Cards (15 minutes)
Make sure products have stripePriceId:
```tsx
// When adding to cart, include:
addToCart({
  id: product.id,
  name: product.name,
  price: product.price,
  stripePriceId: product.stripePriceId, // Critical!
  selectedSize: selectedSize,
  selectedColor: selectedColor,
  quantity: 1
})
```

### 4. Test Locally (10 minutes)
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Forward webhooks (optional for testing)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 5. Deploy to Vercel (5 minutes)
```bash
git add .
git commit -m "Add Stripe checkout integration"
git push
```

## 📊 Product Mapping

Your Stripe products are already configured with these IDs:

### Suits (Use 2-piece or 3-piece price based on selection)
- Navy: `prod_SlQuqaI2IR6FRm`
- Black: `prod_SlRxbBl5ZnnoDy`
- Charcoal Grey: `prod_SlRy7hTZZH1SA3`
- etc...

### Ties (Single price, color selected at checkout)
- Ultra Skinny: `price_1RpvHlCHc12x7sCzp0TVNS92`
- Skinny: `price_1RpvHyCHc12x7sCzjX1WV931`
- Classic: `price_1RpvI9CHc12x7sCzE8Q9emhw`
- Bow Tie: `price_1RpvIMCHc12x7sCzj6ZTx21q`

## 🎯 Quick Wins

### Option 1: Static Product Display (Fastest - 1 hour)
```tsx
// Just hardcode the products for now
const products = [
  {
    id: 'prod_SlQuqaI2IR6FRm',
    name: 'Navy Suit',
    stripePriceId: 'price_1Rpv2tCHc12x7sCzVvLRto3m', // 2-piece
    price: 179.99,
    image: '/images/navy-suit.jpg'
  },
  // ... add more products
];
```

### Option 2: Use Payment Links (No code needed)
Create payment links in Stripe Dashboard for each product and add them as buttons:
```tsx
<a 
  href="https://buy.stripe.com/your-payment-link"
  className="bg-black text-white px-6 py-3 rounded"
>
  Buy Now
</a>
```

### Option 3: Full Integration (What we built - 2-3 hours)
Use the API routes and components we created for the full experience.

## 🐛 Common Issues & Fixes

### "stripePriceId is undefined"
Make sure your products include the stripePriceId when adding to cart.

### "Webhook signature verification failed"
Add the webhook secret to your environment variables.

### "Checkout failed"
Check browser console and server logs. Usually it's a missing price ID.

## 📱 Test Card Numbers
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

## 🎉 You're Ready!

The core integration is complete. You can now:
1. Accept payments through Stripe
2. Capture size/color selections
3. Handle order completion
4. Track everything in Stripe Dashboard

Focus on getting orders flowing first, then enhance with:
- Customer accounts
- Email notifications  
- Inventory tracking
- Advanced analytics

Questions? Check the files we created or the Stripe docs!