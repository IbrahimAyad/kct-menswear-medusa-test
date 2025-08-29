#!/bin/bash

# Safe console removal script - ONLY removes non-critical statements
# Preserves console.error and console.warn for production debugging
# Following DO's and DON'Ts: Fix ONE thing, test locally, understand the change

echo "🎯 Safe Console Removal for V1 Production"
echo "========================================="
echo ""
echo "This script will ONLY remove:"
echo "  ✅ console.log (debug info)"
echo "  ✅ console.debug (dev only)"
echo "  ✅ console.info (not critical)"
echo ""
echo "This script will KEEP:"
echo "  ⚠️  console.error (critical for production debugging)"
echo "  ⚠️  console.warn (important warnings)"
echo ""

# Create backup first (DO: Always have a way back)
BACKUP_DIR="src.backup.console.$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup at $BACKUP_DIR..."
cp -r src "$BACKUP_DIR"

# Count before
TOTAL_BEFORE=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -c "console\." {} \; | awk '{sum+=$1} END {print sum}')
LOG_BEFORE=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -c "console\.log" {} \; | awk '{sum+=$1} END {print sum}')
DEBUG_BEFORE=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -c "console\.debug" {} \; | awk '{sum+=$1} END {print sum}')
INFO_BEFORE=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -c "console\.info" {} \; | awk '{sum+=$1} END {print sum}')

echo ""
echo "📊 Current console statements:"
echo "  Total: $TOTAL_BEFORE"
echo "  console.log: $LOG_BEFORE"
echo "  console.debug: $DEBUG_BEFORE"
echo "  console.info: $INFO_BEFORE"
echo ""

# Remove ONLY safe console statements
echo "🔧 Removing safe console statements..."

# Remove console.log statements (but not in comments)
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e '/^[[:space:]]*console\.log(/d' \
  -e '/^[[:space:]]*console\.debug(/d' \
  -e '/^[[:space:]]*console\.info(/d' \
  {} \;

# Count after
TOTAL_AFTER=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -c "console\." {} \; | awk '{sum+=$1} END {print sum}')
LOG_AFTER=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -c "console\.log" {} \; | awk '{sum+=$1} END {print sum}')
DEBUG_AFTER=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -c "console\.debug" {} \; | awk '{sum+=$1} END {print sum}')
INFO_AFTER=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -c "console\.info" {} \; | awk '{sum+=$1} END {print sum}')

REMOVED=$((TOTAL_BEFORE - TOTAL_AFTER))

echo ""
echo "✅ Results:"
echo "  Removed $REMOVED console statements"
echo "  Remaining total: $TOTAL_AFTER"
echo "  Remaining console.log: $LOG_AFTER"
echo "  Remaining console.debug: $DEBUG_AFTER"
echo "  Remaining console.info: $INFO_AFTER"

# Show files that were modified
echo ""
echo "📝 Modified files:"
diff -rq src "$BACKUP_DIR" 2>/dev/null | grep "differ" | head -10

echo ""
echo "⚠️  IMPORTANT - Next Steps:"
echo "1. Run: npm run build"
echo "2. Check for any build errors"
echo "3. If build succeeds, test key features locally"
echo "4. If everything works, commit the changes"
echo "5. If issues occur, restore from: $BACKUP_DIR"
echo ""
echo "To restore if needed:"
echo "  rm -rf src && mv $BACKUP_DIR src"