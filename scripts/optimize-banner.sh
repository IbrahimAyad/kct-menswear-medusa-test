#!/bin/bash

echo "🖼️ Starting banner image optimization..."

# Check if the banner exists
if [ ! -f "public/KCT-Home-Banner-Update.jpg" ]; then
    echo "❌ Banner image not found at public/KCT-Home-Banner-Update.jpg"
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "📦 ImageMagick not found. Installing..."
    brew install imagemagick
fi

# Check if cwebp is installed for WebP conversion
if ! command -v cwebp &> /dev/null; then
    echo "📦 WebP tools not found. Installing..."
    brew install webp
fi

echo "📊 Original image size:"
ls -lh public/KCT-Home-Banner-Update.jpg

# Create optimized versions directory
mkdir -p public/optimized

# 1. Create optimized JPEG (desktop)
echo "🔄 Creating optimized JPEG (desktop)..."
convert public/KCT-Home-Banner-Update.jpg \
    -resize 1920x1080\> \
    -quality 75 \
    -interlace Plane \
    -strip \
    -sampling-factor 4:2:0 \
    -define jpeg:dct-method=float \
    public/optimized/banner-desktop.jpg

# 2. Create WebP version (desktop)
echo "🔄 Creating WebP version (desktop)..."
cwebp -q 80 \
    -resize 1920 1080 \
    public/KCT-Home-Banner-Update.jpg \
    -o public/optimized/banner-desktop.webp

# 3. Create mobile JPEG
echo "🔄 Creating mobile JPEG..."
convert public/KCT-Home-Banner-Update.jpg \
    -resize 768x432\> \
    -quality 65 \
    -interlace Plane \
    -strip \
    -sampling-factor 4:2:0 \
    public/optimized/banner-mobile.jpg

# 4. Create mobile WebP
echo "🔄 Creating mobile WebP..."
cwebp -q 70 \
    -resize 768 432 \
    public/KCT-Home-Banner-Update.jpg \
    -o public/optimized/banner-mobile.webp

echo ""
echo "✅ Optimization complete!"
echo ""
echo "📊 Optimized sizes:"
echo "Desktop JPEG: $(ls -lh public/optimized/banner-desktop.jpg | awk '{print $5}')"
echo "Desktop WebP: $(ls -lh public/optimized/banner-desktop.webp | awk '{print $5}')"
echo "Mobile JPEG: $(ls -lh public/optimized/banner-mobile.jpg | awk '{print $5}')"
echo "Mobile WebP: $(ls -lh public/optimized/banner-mobile.webp | awk '{print $5}')"

echo ""
echo "📉 Size reduction:"
ORIGINAL_SIZE=$(stat -f%z public/KCT-Home-Banner-Update.jpg)
OPTIMIZED_SIZE=$(stat -f%z public/optimized/banner-desktop.webp)
REDUCTION=$(( 100 - (OPTIMIZED_SIZE * 100 / ORIGINAL_SIZE) ))
echo "Reduced by ${REDUCTION}% (from 560KB to ~$(( OPTIMIZED_SIZE / 1024 ))KB)"

echo ""
echo "💡 Next steps:"
echo "1. Update your components to use these optimized images"
echo "2. Implement <picture> element for responsive images"
echo "3. Consider using Next.js Image component for automatic optimization"