#!/bin/bash

# R2 PNG to WebP Converter Script
# This script downloads PNG images from R2, converts them to WebP, and uploads them back

# ===========================
# CONFIGURATION (Update these)
# ===========================
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET_NAME="pub-46371bda6faf4910b74631159fc2dfd4"  # Your R2 bucket
R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

# Directories
WORK_DIR="./r2-image-conversion"
DOWNLOAD_DIR="${WORK_DIR}/png"
WEBP_DIR="${WORK_DIR}/webp"
BACKUP_DIR="${WORK_DIR}/backup"

# ===========================
# SETUP
# ===========================

echo "🚀 R2 PNG to WebP Converter"
echo "==========================="
echo ""

# Check for required tools
echo "📋 Checking required tools..."

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it:"
    echo "   brew install awscli"
    exit 1
fi

if ! command -v cwebp &> /dev/null; then
    echo "❌ cwebp not found. Please install webp tools:"
    echo "   brew install webp"
    exit 1
fi

echo "✅ All required tools found"
echo ""

# Create working directories
echo "📁 Setting up directories..."
mkdir -p "$DOWNLOAD_DIR"
mkdir -p "$WEBP_DIR"
mkdir -p "$BACKUP_DIR"

# Configure AWS CLI for R2
export AWS_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY

# ===========================
# DOWNLOAD PNG IMAGES
# ===========================

echo "📥 Downloading PNG images from R2..."
echo ""

# List of bundle image paths
BUNDLE_PATHS=(
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/black-2-white-black.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/navy-suit-white-burgunndy.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/dark-grey-white-silver.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/navy-3p-white-red.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/light-grey-2p-light-blue.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/black-suit-black-shirt-black.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/burgundy-black-fusicha.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/black-suit-black-shirt-Hunter%20Green.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/black-suit-2p-burnt-orange.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/black-suit-3p-royal-blue-.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/midnight-blue-3p-white-sage.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/navy-2p-light-blue-burgundy.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/brown-pink-navy.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/burgundy-black-mustrard.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/Navy-2p-pink-navy.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/indigo-2p-white-dusty-pink.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/light-grey-2p-coral.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/emerlad-green-white-burnt-orange.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/light-grey-2p-pink.png"
  "kct-prodcuts/Bundles-Augest-2025/Bundles-01/indigo-2p-white-sage-green.png"
  # Add more paths as needed...
)

# Alternative: Download all PNG files from the bundles directory
echo "📋 Method 1: Download specific bundle images"
echo "   Or"
echo "📋 Method 2: Download all PNGs from bundles directory (recommended)"
echo ""
echo "Using Method 2: Downloading all PNGs from bundles directories..."

# Download all PNGs from bundle directories
aws s3 sync \
  s3://${R2_BUCKET_NAME}/kct-prodcuts/Bundles-Augest-2025/ \
  ${DOWNLOAD_DIR}/ \
  --endpoint-url ${R2_ENDPOINT} \
  --exclude "*" \
  --include "*.png" \
  --include "*.PNG"

aws s3 sync \
  s3://${R2_BUCKET_NAME}/kct-prodcuts/casual-bundles/ \
  ${DOWNLOAD_DIR}/casual-bundles/ \
  --endpoint-url ${R2_ENDPOINT} \
  --exclude "*" \
  --include "*.png" \
  --include "*.PNG"

aws s3 sync \
  s3://${R2_BUCKET_NAME}/kct-prodcuts/Fall%20Wedding%20Bundles/ \
  ${DOWNLOAD_DIR}/Fall-Wedding-Bundles/ \
  --endpoint-url ${R2_ENDPOINT} \
  --exclude "*" \
  --include "*.png" \
  --include "*.PNG"

aws s3 sync \
  s3://${R2_BUCKET_NAME}/kct-prodcuts/Spring%20Wedding%20Bundles/ \
  ${DOWNLOAD_DIR}/Spring-Wedding-Bundles/ \
  --endpoint-url ${R2_ENDPOINT} \
  --exclude "*" \
  --include "*.png" \
  --include "*.PNG"

aws s3 sync \
  s3://${R2_BUCKET_NAME}/kct-prodcuts/Summer%20Wedding%20Bundles/ \
  ${DOWNLOAD_DIR}/Summer-Wedding-Bundles/ \
  --endpoint-url ${R2_ENDPOINT} \
  --exclude "*" \
  --include "*.png" \
  --include "*.PNG"

aws s3 sync \
  s3://${R2_BUCKET_NAME}/kct-prodcuts/Winter%20Wedding%20Bundles/ \
  ${DOWNLOAD_DIR}/Winter-Wedding-Bundles/ \
  --endpoint-url ${R2_ENDPOINT} \
  --exclude "*" \
  --include "*.png" \
  --include "*.PNG"

echo "✅ Download complete"
echo ""

# ===========================
# CONVERT TO WEBP
# ===========================

echo "🔄 Converting PNG images to WebP..."
echo ""

CONVERTED_COUNT=0
TOTAL_SIZE_BEFORE=0
TOTAL_SIZE_AFTER=0

# Find all PNG files and convert them
find "$DOWNLOAD_DIR" -type f \( -name "*.png" -o -name "*.PNG" \) | while read -r png_file; do
    # Get relative path
    relative_path="${png_file#$DOWNLOAD_DIR/}"
    
    # Create output directory structure
    webp_output_dir="${WEBP_DIR}/$(dirname "$relative_path")"
    mkdir -p "$webp_output_dir"
    
    # Generate WebP filename
    filename=$(basename "$png_file")
    webp_filename="${filename%.*}.webp"
    webp_file="${webp_output_dir}/${webp_filename}"
    
    # Get file size before conversion
    size_before=$(stat -f%z "$png_file" 2>/dev/null || stat -c%s "$png_file" 2>/dev/null || echo 0)
    
    # Convert PNG to WebP with high quality
    cwebp -q 90 -m 6 "$png_file" -o "$webp_file" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        # Get file size after conversion
        size_after=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file" 2>/dev/null || echo 0)
        
        # Calculate savings
        savings=$((100 - (size_after * 100 / size_before)))
        
        echo "   ✅ Converted: $(basename "$png_file") (${savings}% smaller)"
        CONVERTED_COUNT=$((CONVERTED_COUNT + 1))
        TOTAL_SIZE_BEFORE=$((TOTAL_SIZE_BEFORE + size_before))
        TOTAL_SIZE_AFTER=$((TOTAL_SIZE_AFTER + size_after))
    else
        echo "   ❌ Failed: $(basename "$png_file")"
    fi
done

echo ""
echo "📊 Conversion Statistics:"
echo "   Files converted: $CONVERTED_COUNT"
if [ $TOTAL_SIZE_BEFORE -gt 0 ]; then
    TOTAL_SAVINGS=$((100 - (TOTAL_SIZE_AFTER * 100 / TOTAL_SIZE_BEFORE)))
    echo "   Total size before: $(echo "scale=2; $TOTAL_SIZE_BEFORE / 1048576" | bc) MB"
    echo "   Total size after: $(echo "scale=2; $TOTAL_SIZE_AFTER / 1048576" | bc) MB"
    echo "   Average savings: ${TOTAL_SAVINGS}%"
fi
echo ""

# ===========================
# UPLOAD WEBP IMAGES
# ===========================

echo "📤 Uploading WebP images to R2..."
echo ""

# Upload all WebP files back to R2
find "$WEBP_DIR" -type f -name "*.webp" | while read -r webp_file; do
    # Get relative path
    relative_path="${webp_file#$WEBP_DIR/}"
    
    # Determine S3 path
    if [[ "$relative_path" == *"Bundles-01"* ]]; then
        s3_path="kct-prodcuts/Bundles-Augest-2025/$relative_path"
    elif [[ "$relative_path" == *"casual-bundles"* ]]; then
        s3_path="kct-prodcuts/$relative_path"
    elif [[ "$relative_path" == *"Fall-Wedding-Bundles"* ]]; then
        s3_path="kct-prodcuts/Fall%20Wedding%20Bundles/${relative_path#Fall-Wedding-Bundles/}"
    elif [[ "$relative_path" == *"Spring-Wedding-Bundles"* ]]; then
        s3_path="kct-prodcuts/Spring%20Wedding%20Bundles/${relative_path#Spring-Wedding-Bundles/}"
    elif [[ "$relative_path" == *"Summer-Wedding-Bundles"* ]]; then
        s3_path="kct-prodcuts/Summer%20Wedding%20Bundles/${relative_path#Summer-Wedding-Bundles/}"
    elif [[ "$relative_path" == *"Winter-Wedding-Bundles"* ]]; then
        s3_path="kct-prodcuts/Winter%20Wedding%20Bundles/${relative_path#Winter-Wedding-Bundles/}"
    else
        s3_path="kct-prodcuts/$relative_path"
    fi
    
    # Upload to R2
    aws s3 cp "$webp_file" "s3://${R2_BUCKET_NAME}/${s3_path}" \
        --endpoint-url ${R2_ENDPOINT} \
        --content-type "image/webp" \
        --cache-control "public, max-age=31536000"
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Uploaded: $(basename "$webp_file")"
    else
        echo "   ❌ Failed to upload: $(basename "$webp_file")"
    fi
done

echo ""
echo "✨ Process Complete!"
echo "==================="
echo ""
echo "📝 Summary:"
echo "   - Downloaded PNG images from R2"
echo "   - Converted $CONVERTED_COUNT images to WebP"
echo "   - Uploaded WebP images back to R2"
echo ""
echo "🎯 Next Steps:"
echo "   1. Test your website to ensure images load correctly"
echo "   2. Monitor performance improvements"
echo "   3. Consider deleting original PNGs from R2 after verification"
echo ""
echo "💡 Note: Keep the original PNGs as backup until you verify everything works!"
echo ""
echo "🗑️ Cleanup (optional):"
echo "   rm -rf $WORK_DIR"