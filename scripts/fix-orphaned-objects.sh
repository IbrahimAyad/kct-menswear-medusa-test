#!/bin/bash

# Fix orphaned object literals left after console.log removal
echo "🔧 Fixing orphaned object literals..."

# Fix conversation-engine.ts
sed -i '' '372,375d' src/lib/ai/conversation-engine.ts 2>/dev/null

# Fix test-checkout-flow.ts if it exists
if [ -f "src/app/api/test-checkout-flow/route.ts" ]; then
  sed -i '' '/^[[:space:]]*id:/,/^[[:space:]]*});/d' src/app/api/test-checkout-flow/route.ts 2>/dev/null
fi

# Fix ai-testing-complete.ts if it exists
if [ -f "src/app/api/ai/test-runner/route.ts" ]; then
  sed -i '' '/^[[:space:]]*input:/,/^[[:space:]]*});/d' src/app/api/ai/test-runner/route.ts 2>/dev/null
fi

echo "✅ Fixed orphaned objects"
echo ""
echo "Running build test..."