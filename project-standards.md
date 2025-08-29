# KCT Menswear - Naming Conventions & Standards

## 🏷️ Naming Conventions

### Components
- PascalCase: `ProductCard`, `StyleSwiper`, `WeddingDashboard`
- Props: `ProductCardProps`, `StyleSwiperProps`
- Folders: kebab-case: `product-card`, `style-swiper`

### Variables & Functions
- camelCase: `userData`, `fetchProducts`, `handleAddToCart`
- Constants: UPPER_SNAKE: `API_BASE_URL`, `MAX_CART_ITEMS`
- Hooks: `use` prefix: `useProducts`, `useCart`, `useAuth`

### API & Data
- Endpoints: kebab-case: `/api/products`, `/api/wedding-parties`
- Types: PascalCase: `Product`, `Customer`, `WeddingParty`
- Stores: camelCase: `cartStore`, `authStore`, `productStore`

## 📦 Core Type Definitions

All shared types are in `lib/types/index.ts` and MUST be used by all terminals.

## 📁 Folder Structure

```
components/
  layout/
    Header.tsx
    Footer.tsx
    Navigation.tsx
  shop/
    ProductCard.tsx
    ProductGrid.tsx
    CategoryFilter.tsx
  style/
    StyleSwiper.tsx
    StyleQuiz.tsx
    StyleResults.tsx
  wedding/
    WeddingDashboard.tsx
    PartyMemberList.tsx
  video/
    VideoPlayer.tsx
    ShoppableVideo.tsx

lib/
  api/
    adminClient.ts      // Terminal 2 creates
    weddingClient.ts    // Terminal 2 creates
  hooks/
    useProducts.ts      // Terminal 2 creates
    useCart.ts          // Terminal 2 creates
    useWedding.ts       // Terminal 2 creates
  store/
    cartStore.ts        // Terminal 2 creates
    authStore.ts        // Terminal 2 creates
  types/
    index.ts           // Shared types (above)
```

## 🔧 API Calls (Terminal 2 implements, others use)

```typescript
fetchProducts(): Promise<Product[]>
fetchProduct(id: string): Promise<Product>
updateCart(item: CartItem): Promise<void>
createOrder(data: OrderData): Promise<Order>
```

## 🎯 Event Handlers (consistent naming)

```typescript
handleAddToCart(product: Product, size: string): void
handleRemoveFromCart(itemId: string): void
handleStyleSwipe(direction: 'left' | 'right'): void
handleProductClick(productId: string): void
```

## 🛠️ Utility Functions

```typescript
formatPrice(cents: number): string  // "$899.00"
getSizeLabel(size: string): string  // "40R" -> "40 Regular"
calculateDiscount(price: number, percentage: number): number
```

## 📦 Import Paths

Always use absolute imports with the `@/` alias:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Example imports:
```typescript
import { Product } from '@/lib/types'
import { useProducts } from '@/lib/hooks/useProducts'
import { ProductCard } from '@/components/shop/ProductCard'
import { adminClient } from '@/lib/api/adminClient'
```

## 🎨 Classes (Tailwind Standards)

```typescript
// Consistent class patterns
const buttonStyles = {
  primary: "bg-gold hover:bg-gold/90 text-black px-6 py-3 rounded-sm font-semibold",
  secondary: "bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-sm font-semibold",
  outline: "border-2 border-black hover:bg-black hover:text-white px-6 py-3 rounded-sm"
}

const containerStyles = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
const sectionStyles = "py-12 md:py-16 lg:py-20"
```

## 🏪 Zustand Store Names (Terminal 2 creates)

```typescript
useCartStore     // not useShoppingCart or useBasket
useAuthStore     // not useUserStore or useAccount  
useProductStore  // not useInventory or useItems
useWeddingStore  // not useEventStore or useParty
```

## 🎨 Brand Colors

- Gold: `#D4AF37`
- Black: `#1A1A1A`
- Burgundy: `#8B0000`
- White: `#FFFFFF`
- Gray-50: `#F9FAFB`
- Gray-100: `#F3F4F6`
- Gray-900: `#111827`

## 📝 Typography

- Headings: Playfair Display
- Body: Inter
- Sizes: Use Tailwind's default scale