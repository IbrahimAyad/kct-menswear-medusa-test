#!/bin/bash

# Performance Check Script for KCT Menswear
# Monitors build size and performance metrics

echo "🚀 KCT Menswear Performance Check"
echo "======================================"
echo ""

# Function to format bytes
format_bytes() {
    local bytes=$1
    if [ $bytes -lt 1024 ]; then
        echo "${bytes}B"
    elif [ $bytes -lt 1048576 ]; then
        echo "$((bytes / 1024))KB"
    elif [ $bytes -lt 1073741824 ]; then
        echo "$((bytes / 1024 / 1024))MB"
    else
        echo "$((bytes / 1024 / 1024 / 1024))GB"
    fi
}

# 1. Check project size
echo "📊 Project Size Analysis"
echo "------------------------"
TOTAL_SIZE=$(du -sh . 2>/dev/null | cut -f1)
echo "Total project size: $TOTAL_SIZE"

if [ -d ".next" ]; then
    NEXT_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
    echo "Next.js build size: $NEXT_SIZE"
fi

if [ -d "node_modules" ]; then
    MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
    echo "Node modules size: $MODULES_SIZE"
fi
echo ""

# 2. Check for heavy dependencies
echo "📦 Heavy Dependencies Check"
echo "------------------------"
if [ -d "node_modules/@aws-sdk" ]; then
    AWS_SIZE=$(du -sh node_modules/@aws-sdk 2>/dev/null | cut -f1)
    echo "⚠️  AWS SDK: $AWS_SIZE (consider API routes for R2)"
fi

if [ -d "node_modules/three" ]; then
    THREE_SIZE=$(du -sh node_modules/three 2>/dev/null | cut -f1)
    echo "✅ Three.js: $THREE_SIZE (used in /builder route)"
fi

if [ -d "node_modules/@react-three" ]; then
    R3F_SIZE=$(du -sh node_modules/@react-three 2>/dev/null | cut -f1)
    echo "✅ React Three Fiber: $R3F_SIZE (used in /builder route)"
fi
echo ""

# 3. Check for duplicate/unnecessary files
echo "🔍 Checking for Issues"
echo "------------------------"

# Check for nested node_modules
NESTED_MODULES=$(find . -type d -name "node_modules" -not -path "./node_modules/*" 2>/dev/null | wc -l)
if [ $NESTED_MODULES -gt 1 ]; then
    echo "⚠️  Found $((NESTED_MODULES - 1)) nested node_modules folders"
    find . -type d -name "node_modules" -not -path "./node_modules/*" 2>/dev/null | grep -v "^./node_modules$"
else
    echo "✅ No nested node_modules found"
fi

# Check for duplicate lockfiles
LOCKFILES=0
[ -f "package-lock.json" ] && LOCKFILES=$((LOCKFILES + 1))
[ -f "yarn.lock" ] && LOCKFILES=$((LOCKFILES + 1))
[ -f "pnpm-lock.yaml" ] && LOCKFILES=$((LOCKFILES + 1))

if [ $LOCKFILES -gt 1 ]; then
    echo "⚠️  Found $LOCKFILES lockfiles (should only have one)"
else
    echo "✅ Single lockfile found"
fi

# Check cache size
if [ -d ".next/cache" ]; then
    CACHE_SIZE=$(du -sh .next/cache 2>/dev/null | cut -f1)
    echo "📦 Build cache size: $CACHE_SIZE"
    
    # Check if cache is too large
    CACHE_BYTES=$(du -sb .next/cache 2>/dev/null | cut -f1)
    if [ $CACHE_BYTES -gt 536870912 ]; then # 512MB
        echo "  ⚠️  Cache is large. Run './scripts/safe-cleanup.sh' to clear"
    fi
fi
echo ""

# 4. Bundle Analysis
echo "📊 Bundle Analysis"
echo "------------------------"
if [ -d ".next/static/chunks" ]; then
    echo "Top 5 largest chunks:"
    find .next/static/chunks -name "*.js" -type f -exec ls -lh {} \; 2>/dev/null | sort -k5 -rh | head -5 | awk '{print "  " $9 ": " $5}'
else
    echo "No production build found. Run 'npm run build' first"
fi
echo ""

# 5. Recommendations
echo "💡 Performance Recommendations"
echo "------------------------------"

# Check Node version
NODE_VERSION=$(node -v)
if [[ $NODE_VERSION == v18* ]]; then
    echo "⚠️  Using Node $NODE_VERSION - Consider upgrading to Node 20+"
fi

# Check if Cloudflare worker is deployed
if [ -f "cloudflare-worker/wrangler.toml" ]; then
    if grep -q "YOUR_ACCOUNT_ID" cloudflare-worker/wrangler.toml; then
        echo "⚠️  Cloudflare Worker not configured - update wrangler.toml"
    else
        echo "✅ Cloudflare Worker configured"
    fi
fi

# Check if optimized config is being used
if [ -f "next.config.optimized.ts" ]; then
    echo "📝 Optimized Next.js config available!"
    echo "   To use it: mv next.config.ts next.config.backup.ts && mv next.config.optimized.ts next.config.ts"
fi

echo ""
echo "======================================"
echo "✅ Performance check complete!"