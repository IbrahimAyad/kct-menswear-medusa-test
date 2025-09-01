# Production Setup Guide

## 🔑 Required API Keys & Configuration

### 1. Stripe Configuration
You need to get these from your Stripe Dashboard (https://dashboard.stripe.com):

```env
# Add to .env.local
STRIPE_SECRET_KEY=sk_live_[your_actual_live_key]
STRIPE_WEBHOOK_SECRET=whsec_[your_webhook_secret]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[your_publishable_key]
```

⚠️ **Current Issue**: You have a live publishable key but missing the secret key.

### 2. Medusa Backend Configuration
The backend at `https://backend-production-7441.up.railway.app` needs:

1. **Enable Stripe Payment Provider**
   ```bash
   # SSH into your Railway/server
   # Add to medusa-config.js:
   plugins: [
     {
       resolve: "@medusajs/payment-stripe",
       options: {
         api_key: process.env.STRIPE_SECRET_KEY,
         webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
         automatic_payment_methods: true,
       }
     }
   ]
   ```

2. **Configure Payment Settings**
   - Login to Medusa Admin: https://backend-production-7441.up.railway.app/admin
   - Go to Settings → Regions → US Region
   - Add Stripe as payment provider
   - Enable automatic tax calculation

3. **Set Environment Variables on Railway**
   ```bash
   railway variables set STRIPE_SECRET_KEY=sk_live_xxx
   railway variables set STRIPE_WEBHOOK_SECRET=whsec_xxx
   railway up
   ```

### 3. Fix Product Images
Products are missing images. You need to:

1. **Upload images to Medusa**
   ```javascript
   // Use Medusa Admin or API to upload product images
   // Admin URL: https://backend-production-7441.up.railway.app/admin
   // Products → Edit → Add Images
   ```

2. **Or use placeholder service temporarily**
   ```javascript
   // In product components:
   const imageUrl = product.thumbnail || 
                   `https://via.placeholder.com/400x600/333/fff?text=${encodeURIComponent(product.title)}`
   ```

## 🛠️ Immediate Actions

### Step 1: Get Stripe Secret Key
1. Login to Stripe Dashboard
2. Go to Developers → API Keys
3. Copy the live secret key (starts with `sk_live_`)
4. Add to `.env.local`

### Step 2: Configure Medusa Backend
1. SSH into Railway server:
   ```bash
   railway login
   railway link
   railway shell
   ```

2. Edit medusa-config.js to add Stripe plugin

3. Restart server:
   ```bash
   railway up
   ```

### Step 3: Test Payment Flow
1. Use Stripe test card: 4242 4242 4242 4242
2. Complete a purchase
3. Check Stripe Dashboard for payment
4. Check Medusa Admin for order

## 📝 Testing Checklist

Before going live, test:
- [ ] Can add products to cart
- [ ] Can proceed to checkout
- [ ] Payment processes successfully
- [ ] Order appears in Medusa admin
- [ ] Customer receives confirmation email
- [ ] Inventory is updated

## 🚨 Current Blockers

1. **Missing Stripe Secret Key** - Prevents real payments
2. **Medusa Payment Provider Not Configured** - Backend returns 500
3. **No Product Images** - All showing 404
4. **Hydration Errors** - Being fixed

## 📞 Contact for Help

- **Medusa Discord**: https://discord.gg/medusajs
- **Railway Support**: support@railway.app
- **Stripe Support**: https://support.stripe.com

## 🎯 Quick Fix for Demo

If you need a quick demo without real payments:
1. Keep test mode checkout
2. Add demo badge to indicate test mode
3. Use placeholder images
4. Document that it's in demo mode

---

**Time to Production**: 
- With proper keys: 1-2 hours
- Without keys: Need to obtain from Stripe/configure backend first