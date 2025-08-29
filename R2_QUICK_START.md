# R2 Style Swiper Quick Start Guide

## ✅ Your Credentials Are Configured!

Your R2 credentials have been added to `.env.local`:
- Account ID: `ea644c4a47a499ad4721449cbac587f4`
- Access Key ID: `019aede6fc6182af8fe7afd3e9250f18`
- Bucket: `style-swipe`
- Public URL: `https://pub-140b3d87a1b64af6a3193ba8aa685e26.r2.dev`

## 🚀 Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test R2 Connection:**
   Visit: http://localhost:3000/api/style-swiper/test
   
   You should see a success response with bucket details.

3. **Upload Images:**
   Visit: http://localhost:3000/admin/style-swiper
   
   - Drag and drop fashion images
   - Select categories (suits, shirts, accessories, etc.)
   - Images will upload to your R2 bucket

4. **Try the Style Swiper:**
   Visit: http://localhost:3000/style-swiper-r2
   
   - Swipe through uploaded images
   - See analytics in real-time
   - Test different categories

## 📸 Image Guidelines

For best results:
- **Format**: JPEG, PNG, WebP, or AVIF
- **Size**: Under 10MB per image
- **Aspect Ratio**: 3:4 (portrait) works best
- **Resolution**: 600x800px minimum

## 🔧 Troubleshooting

### If upload fails:
1. Check browser console for errors
2. Verify R2 bucket has public access enabled
3. Check CORS settings in Cloudflare dashboard

### If images don't load:
1. Verify public URL is correct
2. Check if bucket is set to public
3. Try accessing an image directly via the public URL

## 📁 File Structure

```
/admin/style-swiper       - Image upload interface
/style-swiper-r2         - Demo page with R2 images
/api/style-swiper/test   - Test R2 connection
/api/style-swiper/upload - Upload endpoint
/api/style-swiper/images - List/delete images
```

## 🎯 Next Steps

1. Upload 10-20 fashion images to test
2. Organize by categories
3. Link images to products (optional)
4. Integrate into your style quiz flow

## 🔒 Security Note

Your R2 credentials are in `.env.local` and won't be committed to git.
Keep these credentials secure!