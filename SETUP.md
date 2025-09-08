# KCT Menswear Medusa Setup Guide

## 🔐 Environment Setup

### 1. Copy Environment Template
```bash
cp .env.example .env.local
```

### 2. Required Environment Variables

Add these values to your `.env.local` file:

```env
# Medusa Backend Configuration
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://backend-production-7441.up.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81
NEXT_PUBLIC_MEDUSA_REGION_ID=reg_01K3S6NDGAC1DSWH9MCZCWBWWD
NEXT_PUBLIC_MEDUSA_REGION_ID_EU=reg_01K3PJN8B4519MH0QRFMB62J42
NEXT_PUBLIC_SALES_CHANNEL_ID=sc_01K3S6WP4KCEJX26GNPQKTHTBE

# Legacy Configuration
NEXT_PUBLIC_PUBLISHABLE_KEY=pk_01K3S6WP4KCEJX26GNPQKTHTBE
NEXT_PUBLIC_REGION_ID=reg_01K3S6NDGAC1DSWH9MCZCWBWWD
```

⚠️ **IMPORTANT**: Never commit `.env.local` to git!

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📍 Key Pages

- `/kct-shop` - Main shop with all 204 KCT products
- `/shop-medusa` - Alternative shop layout
- `/checkout-simple` - Checkout with Stripe Tax
- `/products/mint-vest` - Example product page

## ✅ Backend Features

| Feature | Status | Details |
|---------|--------|---------|
| **Products** | ✅ | 204 KCT products |
| **Stripe Tax** | ✅ | US state/county/city accuracy |
| **Payments** | ✅ | Stripe integration |
| **Shipping** | ✅ | Free US, $40 International |
| **Multi-region** | ✅ | US (USD) and Europe (EUR) |

## 🛡️ Security Notes

- All API keys are in environment variables
- `.env.local` is gitignored
- No hardcoded keys in source code
- Use `.env.example` as template

## 📝 Tax Calculation Examples

- **California**: ~9.5% (state + county + city)
- **New York**: ~8.875% (state + NYC + MTA)
- **Texas**: ~8.25% (state + local)
- **Oregon**: 0% (no sales tax)

## 🔧 Troubleshooting

If products don't appear:
1. Check your publishable key is correct
2. Verify backend is running: https://backend-production-7441.up.railway.app/health
3. Ensure you're using the KCT Menswear sales channel key
4. Check browser console for errors

## 📚 Documentation

- Medusa Docs: https://docs.medusajs.com
- Stripe Docs: https://docs.stripe.com
- Backend Admin: https://backend-production-7441.up.railway.app/app