FROM node:20-alpine

WORKDIR /app

# Set build-time environment variables (required for Next.js build)
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://medusa-railway-v2-production.up.railway.app
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81
ENV NEXT_PUBLIC_MEDUSA_REGION_ID=reg_01K3S6NDGAC1DSWH9MCZCWBWWD
ENV NEXT_PUBLIC_SALES_CHANNEL_ID=sc_01JE83JN1YZ9NXRCGBM8WTDHRK
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RAMT2CHc12x7sCzv9MxCfz8HBj76Js5MiRCa0F0o3xVOJJ0LS7pRNhDxIJZf5mQQBW6vD5h3cQzI0B5vhLSl6Y200YY9iXR7h
ENV NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder_key_for_build
ENV NEXT_PUBLIC_SITE_URL=https://kct-menswear-medusa-test.vercel.app

# Add dummy Stripe keys for build (will be overridden by Railway env vars at runtime)
ENV STRIPE_SECRET_KEY=sk_test_dummy_key_for_build_only
ENV STRIPE_WEBHOOK_SECRET=whsec_dummy_webhook_secret_for_build_only

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Expose port (Railway typically uses 3000 for Next.js)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]