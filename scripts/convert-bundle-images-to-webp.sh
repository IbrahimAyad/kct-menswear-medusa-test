#!/bin/bash

# Script to safely convert all bundle PNG image references to WebP
# This only changes the file extensions in the code, not the actual images

echo "🖼️  Converting Bundle Images from PNG to WebP..."
echo "================================================"

# Files to update
FILES=(
  "src/lib/products/bundleProducts.ts"
  "src/lib/products/weddingBundles.ts"
  "src/lib/products/promBundles.ts"
  "src/lib/products/casualBundles.ts"
)

# Counter for tracking changes
TOTAL_CHANGES=0

# Create backup of each file before making changes
echo "📁 Creating backups..."
for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    cp "$FILE" "$FILE.backup-$(date +%Y%m%d-%H%M%S)"
    echo "   ✅ Backed up $FILE"
  fi
done

echo ""
echo "🔄 Converting PNG references to WebP..."

# Process each file
for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo "   Processing $FILE..."
    
    # Count PNG references before change
    PNG_COUNT=$(grep -c "\.png" "$FILE" || echo "0")
    
    # Replace .png with .webp in imageUrl lines only
    # This ensures we only change the bundle images, not any other references
    sed -i '' 's/\(imageUrl.*\)\.png/\1.webp/g' "$FILE"
    
    # Count WebP references after change
    WEBP_COUNT=$(grep -c "\.webp" "$FILE" || echo "0")
    
    echo "      Converted $PNG_COUNT PNG references to WebP"
    TOTAL_CHANGES=$((TOTAL_CHANGES + PNG_COUNT))
  else
    echo "   ⚠️  File not found: $FILE"
  fi
done

echo ""
echo "✨ Conversion Complete!"
echo "========================"
echo "Total images converted: $TOTAL_CHANGES"
echo ""
echo "📝 Files updated:"
for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo "   - $FILE"
  fi
done

echo ""
echo "🔍 Verification:"
echo "   PNG references remaining:"
for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    PNG_LEFT=$(grep -c "\.png" "$FILE" || echo "0")
    echo "      $FILE: $PNG_LEFT"
  fi
done

echo ""
echo "💡 Note: The actual images on R2/Cloudflare need to be converted separately."
echo "        This script only updates the references in your code."
echo ""
echo "🎯 Next steps:"
echo "   1. Test the website locally to ensure images load"
echo "   2. Convert actual images on R2 to WebP format"
echo "   3. Commit the changes"
echo ""
echo "⚡ Expected benefits:"
echo "   - 25-35% smaller file sizes"
echo "   - Faster page load times"
echo "   - Better Core Web Vitals scores"