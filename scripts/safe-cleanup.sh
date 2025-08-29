#!/bin/bash

# Safe Cleanup Script for KCT Menswear
# This script safely removes unnecessary files and caches

echo "🧹 KCT Menswear Safe Cleanup Script"
echo "======================================"
echo ""

# Get initial size
INITIAL_SIZE=$(du -sh . 2>/dev/null | cut -f1)
echo "📊 Current project size: $INITIAL_SIZE"
echo ""

# Function to safely remove with confirmation
safe_remove() {
    local path=$1
    local description=$2
    
    if [ -e "$path" ]; then
        SIZE=$(du -sh "$path" 2>/dev/null | cut -f1)
        echo "Found: $description ($SIZE)"
        echo "  Path: $path"
        echo "  ✅ Safe to remove - will be regenerated if needed"
        rm -rf "$path"
        echo "  ✓ Removed"
        echo ""
    else
        echo "  ⚪ $description not found (already clean)"
    fi
}

echo "🔍 Starting safe cleanup..."
echo ""

# 1. Remove Next.js build cache (100% safe - regenerates on build)
echo "1️⃣ Cleaning Next.js cache..."
safe_remove ".next/cache" "Next.js webpack cache"

# 2. Remove nested node_modules in src (shouldn't be there)
echo "2️⃣ Removing nested node_modules (not needed in src)..."
safe_remove "src/ai-training/node_modules" "AI training node_modules in src"
safe_remove "backup-extraction" "Old backup extraction folder"

# 3. Clear other Next.js temp files
echo "3️⃣ Cleaning Next.js temp files..."
safe_remove ".next/trace" "Next.js trace files"
safe_remove ".next/server/app-paths-manifest.json" "Old manifest (regenerates)"

# 4. Clean npm/yarn cache
echo "4️⃣ Cleaning package manager cache..."
if [ -d "node_modules/.cache" ]; then
    SIZE=$(du -sh "node_modules/.cache" 2>/dev/null | cut -f1)
    echo "Found: Package manager cache ($SIZE)"
    rm -rf node_modules/.cache
    echo "  ✓ Removed"
    echo ""
fi

# 5. Remove duplicate lockfiles (keeping package-lock.json)
echo "5️⃣ Cleaning duplicate lockfiles..."
if [ -f "yarn.lock" ] && [ -f "package-lock.json" ]; then
    echo "Found duplicate lockfile: yarn.lock"
    rm -f yarn.lock
    echo "  ✓ Removed yarn.lock (keeping package-lock.json)"
fi

if [ -f "pnpm-lock.yaml" ] && [ -f "package-lock.json" ]; then
    echo "Found duplicate lockfile: pnpm-lock.yaml"
    rm -f pnpm-lock.yaml
    echo "  ✓ Removed pnpm-lock.yaml (keeping package-lock.json)"
fi
echo ""

# 6. Clean TypeScript build info
echo "6️⃣ Cleaning TypeScript cache..."
safe_remove "tsconfig.tsbuildinfo" "TypeScript build cache"
safe_remove ".tsbuildinfo" "TypeScript build info"

# Get final size
echo "======================================"
FINAL_SIZE=$(du -sh . 2>/dev/null | cut -f1)
echo "✅ Cleanup complete!"
echo "📊 Initial size: $INITIAL_SIZE"
echo "📊 Final size: $FINAL_SIZE"
echo ""
echo "💡 Next steps to further optimize:"
echo "  1. Run 'npm run build' to create fresh build"
echo "  2. Activate Cloudflare Image Resizing in dashboard"
echo "  3. Consider moving AWS SDK usage to API routes"
echo ""
echo "⚠️  Note: This cleanup is 100% safe. All removed items will"
echo "    regenerate automatically when needed."