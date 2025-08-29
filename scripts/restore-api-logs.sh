#!/bin/bash

# Restore critical console logs for API debugging
echo "🔧 Restoring critical API console logs for debugging..."

# Add console.error back to API error handlers
find ./src/app/api -type f -name "*.ts" -exec grep -l "catch (error)" {} \; | while read file; do
  echo "Restoring error logging in: $file"
  # Add console.error after catch statements if not present
  sed -i '' '/catch (error) {/a\
    console.error("API Error in '"$file"':", error);' "$file" 2>/dev/null || true
done

echo "✅ Critical API logs restored for debugging"