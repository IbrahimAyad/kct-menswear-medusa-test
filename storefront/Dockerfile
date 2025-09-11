# Railway is looking for storefront/Dockerfile but our app is at root
# This Dockerfile is a workaround to build from the correct location

FROM node:20-alpine AS builder

WORKDIR /app

# Copy all files from root (we'll set context to parent in Railway)
COPY package*.json ./
COPY . ./

# Install dependencies
RUN npm install

# Build the Next.js app
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]