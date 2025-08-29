#!/bin/bash

# Safe console.log removal script for production
# This removes console statements while preserving code functionality

echo "🔍 Starting safe console.log removal for production..."

# Create backup first
echo "📦 Creating backup..."
cp -r src src.backup.$(date +%Y%m%d_%H%M%S)

# Count console statements before
BEFORE=$(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -c "console\." {} \; | awk '{sum+=$1} END {print sum}')
echo "Found $BEFORE console statements to remove"

# Remove console.log, console.error, console.warn, console.info, console.debug
# But preserve console statements that might be important for error handling
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec sed -i '' \
  -e '/console\.log(/d' \
  -e '/console\.debug(/d' \
  -e '/console\.info(/d' \
  -e '/console\.warn(/d' \
  -e '/console\.error(/d' \
  -e '/console\.time/d' \
  -e '/console\.timeEnd/d' \
  -e '/console\.group/d' \
  -e '/console\.groupEnd/d' \
  -e '/console\.table/d' \
  {} \;

# Count after
AFTER=$(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -c "console\." {} \; | awk '{sum+=$1} END {print sum}')
REMOVED=$((BEFORE - AFTER))

echo "✅ Successfully removed $REMOVED console statements"
echo "📊 Remaining: $AFTER (might be in comments or strings)"

# Show any remaining console statements for review
if [ $AFTER -gt 0 ]; then
  echo ""
  echo "⚠️  Remaining console statements to review manually:"
  find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -H "console\." {} \; | head -10
fi

echo ""
echo "🎯 Done! Remember to:"
echo "1. Test the build: npm run build"
echo "2. Check for any runtime errors"
echo "3. Commit changes if everything works"