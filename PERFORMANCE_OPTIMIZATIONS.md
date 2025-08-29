# Performance Optimization Guide 🚀

## 1. Lazy Loading Heavy Components

### 3D Builder Optimization
```typescript
// In /app/builder/page.tsx
import dynamic from 'next/dynamic';

const SuitBuilder3D = dynamic(
  () => import('@/components/builder/SuitBuilder3D').then(mod => mod.SuitBuilder3D),
  {
    loading: () => <BuilderSkeleton />,
    ssr: false // Disable SSR for 3D components
  }
);
```

### Video Components
```typescript
// Lazy load video player
const VideoPlayer = dynamic(
  () => import('@/components/video/VideoPlayer').then(mod => mod.VideoPlayer),
  {
    loading: () => <VideoSkeleton />
  }
);

// Lazy load shoppable video
const ShoppableVideo = dynamic(
  () => import('@/components/video/ShoppableVideo').then(mod => mod.ShoppableVideo),
  {
    loading: () => <VideoSkeleton />
  }
);
```

### AI Assistant
```typescript
// Already good - loads on demand when expanded
// Consider lazy loading the chat content
```

## 2. Image Optimization

### Next.js Image Component
```typescript
import Image from 'next/image';

// Replace <img> tags with Next.js Image
<Image
  src={product.images[0]}
  alt={product.name}
  width={400}
  height={500}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Image Loading Priority
```typescript
// Hero images
<Image priority={true} ... />

// Below fold images
<Image loading="lazy" ... />
```

## 3. Bundle Size Optimization

### Code Splitting
```typescript
// Split wedding components
const WeddingPortal = dynamic(() => import('@/components/wedding/WeddingPortal'));
const GroupCoordination = dynamic(() => import('@/components/wedding/GroupCoordination'));
const WeddingCollections = dynamic(() => import('@/components/wedding/WeddingCollections'));
```

### Tree Shaking
```typescript
// Import only what you need
import { motion } from 'framer-motion'; // ✓ Good
import * as motion from 'framer-motion'; // ✗ Bad
```

## 4. Animation Performance

### Framer Motion Optimization
```typescript
// Use transform instead of position
<motion.div
  animate={{ x: 100 }} // ✓ Good (uses transform)
  animate={{ left: 100 }} // ✗ Bad (triggers reflow)
/>

// Reduce motion for accessibility
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={prefersReducedMotion ? {} : { scale: 1.1 }}
/>
```

### CSS Optimization
```css
/* Use CSS transforms for better performance */
.hover-scale {
  transition: transform 0.3s ease;
}
.hover-scale:hover {
  transform: scale(1.05);
}

/* Use will-change sparingly */
.animating {
  will-change: transform;
}
```

## 5. 3D Model Optimization

### Progressive Loading
```typescript
// In EnhancedSuitModel.tsx
const [modelQuality, setModelQuality] = useState<'low' | 'medium' | 'high'>('low');

useEffect(() => {
  // Start with low quality
  setTimeout(() => setModelQuality('medium'), 1000);
  setTimeout(() => setModelQuality('high'), 2000);
}, []);
```

### Texture Optimization
```typescript
// Compress textures
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('/textures/fabric.jpg');
texture.minFilter = THREE.LinearMipMapLinearFilter;
texture.generateMipmaps = true;
```

### LOD (Level of Detail)
```typescript
const lod = new THREE.LOD();
lod.addLevel(highDetailMesh, 0);
lod.addLevel(mediumDetailMesh, 50);
lod.addLevel(lowDetailMesh, 100);
```

## 6. Data Fetching Optimization

### SWR for Caching
```typescript
import useSWR from 'swr';

const { data: products } = useSWR('/api/products', fetcher, {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // 1 minute
});
```

### Prefetching
```typescript
// Prefetch on hover
<Link href="/products/[id]" prefetch={true}>
  Product
</Link>
```

## 7. Mobile-Specific Optimizations

### Responsive Images
```typescript
<Image
  src={product.image}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  ...
/>
```

### Touch Optimization
```typescript
// Increase tap targets on mobile
const isMobile = useMediaQuery('(max-width: 768px)');

<button className={isMobile ? 'p-4' : 'p-2'}>
  Tap Target
</button>
```

## 8. Monitoring & Metrics

### Web Vitals
```typescript
// In _app.tsx
export function reportWebVitals(metric) {
  console.log(metric);
  // Send to analytics
}
```

### Performance Observer
```typescript
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(entry.name, entry.duration);
  });
});
observer.observe({ entryTypes: ['navigation', 'paint'] });
```

## 9. Implementation Checklist

- [ ] Implement lazy loading for heavy components
- [ ] Replace img tags with Next.js Image
- [ ] Add loading skeletons
- [ ] Optimize bundle size
- [ ] Add performance monitoring
- [ ] Test on slow 3G
- [ ] Run Lighthouse audits
- [ ] Implement caching strategies
- [ ] Add service worker for offline
- [ ] Optimize fonts loading

## 10. Quick Wins

1. **Enable Compression**
   ```javascript
   // next.config.js
   module.exports = {
     compress: true,
   }
   ```

2. **Optimize Fonts**
   ```css
   /* Use font-display: swap */
   @font-face {
     font-family: 'Playfair Display';
     font-display: swap;
   }
   ```

3. **Preconnect to External Domains**
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://customer-6njalxhlz5ulnoaq.cloudflarestream.com">
   ```

4. **Enable Image Optimization**
   ```javascript
   // next.config.js
   module.exports = {
     images: {
       domains: ['images.unsplash.com', 'api.placeholder.com'],
       formats: ['image/avif', 'image/webp'],
     },
   }
   ```