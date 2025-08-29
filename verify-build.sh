#!/bin/bash
echo "🔍 Verifying build..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    exit 0
else
    echo "❌ Build failed. Checking errors..."
    npx tsc --noEmit 2>&1 | head -50
    exit 1
fi
