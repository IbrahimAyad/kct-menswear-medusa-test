#!/bin/bash
# Cache clearing script for Railway deployment

echo "🧹 Clearing all caches for fresh build..."

# Remove Next.js build cache
rm -rf .next

# Remove Next.js cache
rm -rf .next/cache

# Clear npm cache
npm cache clean --force

echo "✅ Caches cleared. Ready for fresh build."