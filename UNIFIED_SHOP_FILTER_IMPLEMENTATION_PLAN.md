# Unified Shop Page Filter Architecture Implementation Plan

## Executive Summary
This plan outlines a comprehensive unified filter architecture for KCT Menswear's shop page that seamlessly integrates individual products, bundles, and preset filter collections. The system is designed for scalability, maintainability, and optimal user experience across all product types.

## 1. TypeScript Interface Definitions

### Core Unified Product Structure
```typescript
// Enhanced unified product interface
export interface UnifiedProduct {
  // Core identification
  id: string
  type: 'individual' | 'bundle' | 'tuxedo_bundle' | 'casual_bundle' | 'wedding_bundle'
  
  // Basic product info
  name: string
  description: string | null
  handle: string | null
  
  // Pricing
  price: number // in cents
  compareAtPrice: number | null
  bundlePrice?: number // for bundles
  originalPrice?: number // for bundles
  savings?: number // calculated savings for bundles
  
  // Categorization & Search
  category: string | null
  subcategory?: string | null
  productType: string
  vendor: string
  brand?: string
  
  // Visual & Media
  images: string[]
  primaryImage: string | null
  
  // Inventory & Availability
  inStock: boolean
  totalInventory: number
  trackInventory: boolean
  
  // Enhanced searchable fields
  searchableColors: string[] // extracted from all components
  searchableOccasions: string[] // wedding, prom, business, etc.
  searchableTags: string[]
  searchableStyles: string[] // formal, casual, modern, etc.
  
  // Bundle-specific fields
  bundleComponents?: BundleComponent[]
  bundleCategory?: 'classic' | 'bold' | 'sophisticated' | 'contemporary'
  seasonal?: 'spring' | 'summer' | 'fall' | 'winter' | 'year-round'
  aiScore?: number
  stripePriceId?: string
  
  // SEO & Analytics
  featured: boolean
  trending: boolean
  viewCount: number
  tags: string[]
  
  // Timestamps
  createdAt: string
  updatedAt: string
  
  // Additional metadata
  additionalInfo: Record<string, any> | null
}

// Bundle component structure
export interface BundleComponent {
  type: 'suit' | 'shirt' | 'tie' | 'shoes' | 'vest' | 'bowtie' | 'accessories'
  color: string
  style?: string
  fit?: string
  productId?: string // link to individual product if available
}

// Enhanced filter structure
export interface UnifiedProductFilters {
  // Basic filters
  category?: string
  categories?: string[]
  subcategory?: string
  productType?: string
  productTypes?: string[]
  
  // Vendor/Brand filters
  vendor?: string
  vendors?: string[]
  brand?: string
  brands?: string[]
  
  // Price filters
  priceRange?: { min: number; max: number }
  minPrice?: number
  maxPrice?: number
  pricePoint?: number[] // for bundle price points: 199, 229, 249, 299
  
  // Color filters (unified across all components)
  color?: string
  colors?: string[]
  suitColor?: string
  shirtColor?: string
  tieColor?: string
  
  // Occasion filters
  occasion?: string
  occasions?: string[]
  
  // Style filters
  style?: string
  styles?: string[]
  bundleCategory?: 'classic' | 'bold' | 'sophisticated' | 'contemporary'
  
  // Season/Time filters
  seasonal?: 'spring' | 'summer' | 'fall' | 'winter' | 'year-round'
  trending?: boolean
  featured?: boolean
  
  // Product type filters
  includeIndividual?: boolean
  includeBundles?: boolean
  bundleTypes?: ('classic' | 'wedding' | 'prom' | 'tuxedo' | 'casual')[]
  
  // Inventory filters
  inStock?: boolean
  available?: boolean
  
  // Search
  search?: string
  
  // AI/Smart filters
  aiScoreMin?: number
  
  // Special preset filters
  preset?: string // 'black-tie', 'wedding-guest', etc.
}

// Sort options for unified products
export interface UnifiedProductSortOptions {
  field: 'name' | 'price' | 'created_at' | 'view_count' | 'ai_score' | 'savings' | 'trending_score'
  direction: 'asc' | 'desc'
}
```

### Filter Preset System
```typescript
// Preset filter configuration
export interface FilterPreset {
  id: string
  name: string
  description: string
  icon?: string
  filters: UnifiedProductFilters
  sortBy?: UnifiedProductSortOptions
  displayPriority?: number
  occasionImage?: string
  seoTitle?: string
  seoDescription?: string
}

// Collection of predefined filter presets
export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'black-tie',
    name: 'Black Tie Events',
    description: 'Formal tuxedos and elegant suits for black-tie occasions',
    icon: '🎩',
    filters: {
      occasions: ['Black Tie', 'Gala', 'Wedding', 'Formal Evening'],
      colors: ['Black', 'Navy', 'Midnight Blue'],
      styles: ['Formal', 'Classic', 'Elegant'],
      includeBundles: true,
      includeIndividual: true,
      bundleTypes: ['classic', 'tuxedo'],
      featured: true
    },
    sortBy: { field: 'ai_score', direction: 'desc' },
    displayPriority: 1
  },
  {
    id: 'wedding-guest',
    name: 'Wedding Guest',
    description: 'Perfect attire for wedding celebrations',
    icon: '💒',
    filters: {
      occasions: ['Wedding Guest', 'Wedding', 'Celebration'],
      seasonal: 'year-round',
      includeBundles: true,
      bundleTypes: ['wedding', 'classic', 'sophisticated'],
      aiScoreMin: 85
    },
    sortBy: { field: 'trending_score', direction: 'desc' },
    displayPriority: 2
  },
  {
    id: 'business-professional',
    name: 'Business Professional',
    description: 'Power suits and professional attire',
    icon: '💼',
    filters: {
      occasions: ['Business', 'Interview', 'Corporate', 'Meeting'],
      colors: ['Navy', 'Charcoal', 'Dark Grey'],
      bundleCategory: 'classic',
      includeBundles: true,
      includeIndividual: true
    },
    sortBy: { field: 'ai_score', direction: 'desc' }
  },
  {
    id: 'prom-special',
    name: 'Prom Night',
    description: 'Stand out looks for prom and formal dances',
    icon: '🌟',
    filters: {
      occasions: ['Prom', 'Dance', 'Formal Dance'],
      bundleCategory: 'bold',
      trending: true,
      priceRange: { min: 199, max: 299 }
    },
    sortBy: { field: 'trending_score', direction: 'desc' }
  },
  {
    id: 'summer-wedding',
    name: 'Summer Weddings',
    description: 'Light and breathable options for warm weather',
    icon: '☀️',
    filters: {
      seasonal: 'summer',
      occasions: ['Summer Wedding', 'Outdoor Event', 'Garden Party'],
      colors: ['Light Grey', 'Tan', 'Light Blue'],
      bundleTypes: ['wedding']
    }
  },
  {
    id: 'budget-199',
    name: 'Complete Looks $199',
    description: 'Full styled bundles at our best price point',
    icon: '💰',
    filters: {
      includeBundles: true,
      includeIndividual: false,
      pricePoint: [199],
      inStock: true
    },
    sortBy: { field: 'ai_score', direction: 'desc' }
  }
]
```

## 2. URL Parameter Structure

### Query Parameter Schema
```typescript
// URL structure examples:
// /products?preset=black-tie
// /products?colors=black,navy&occasions=wedding&type=bundles
// /products?category=suits&price=199-299&sort=price-asc
// /products?search=black+suit&include=bundles,individual

interface URLParams {
  // Preset shortcuts
  preset?: string // 'black-tie', 'wedding-guest', etc.
  
  // Product inclusion
  type?: 'all' | 'individual' | 'bundles' | 'suits' | 'shirts' | 'ties'
  include?: string // 'bundles,individual,suits'
  
  // Filters (comma-separated for arrays)
  category?: string
  subcategory?: string
  colors?: string // 'black,navy,grey'
  occasions?: string // 'wedding,business,prom'
  styles?: string // 'formal,casual,modern'
  vendors?: string // 'kct,premium'
  
  // Price filters
  price?: string // '199-299' or '199' or '299+'
  pricePoint?: string // '199,229,249,299'
  
  // Boolean filters
  featured?: 'true' | 'false'
  trending?: 'true' | 'false'
  inStock?: 'true' | 'false'
  
  // Seasonal
  season?: 'spring' | 'summer' | 'fall' | 'winter'
  
  // Bundle specific
  bundleCategory?: 'classic' | 'bold' | 'sophisticated' | 'contemporary'
  bundleType?: 'wedding' | 'prom' | 'tuxedo' | 'casual'
  
  // Search
  q?: string // search query
  search?: string // alternative search param
  
  // Sorting
  sort?: string // 'price-asc', 'name-desc', 'trending-desc'
  
  // Pagination
  page?: string
  limit?: string
  
  // View
  view?: 'grid' | 'list'
}
```

### URL Examples
```
# Preset filters
/products?preset=black-tie
/products?preset=wedding-guest&season=summer
/products?preset=business-professional&colors=navy,charcoal

# Custom filters
/products?colors=black&occasions=wedding&type=bundles
/products?search=navy+suit&include=bundles,individual&sort=price-asc
/products?category=suits&price=199-299&featured=true
/products?bundleCategory=bold&trending=true&pricePoint=229,249

# Mixed filters
/products?preset=prom-special&colors=black,burgundy&sort=trending-desc
/products?occasions=wedding&season=summer&price=199-249&view=grid
```

## 3. Search Algorithm Implementation

### Unified Search Logic
```typescript
export class UnifiedSearchEngine {
  private products: UnifiedProduct[]
  private bundles: Bundle[]
  
  async searchProducts(
    query: string,
    filters: UnifiedProductFilters,
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    
    // 1. Combine all product types
    const allProducts = await this.combineProductTypes(filters)
    
    // 2. Apply text search across all searchable fields
    const textFiltered = this.applyTextSearch(allProducts, query)
    
    // 3. Apply categorical filters
    const categoryFiltered = this.applyCategoryFilters(textFiltered, filters)
    
    // 4. Apply color filters (searches across all bundle components)
    const colorFiltered = this.applyColorFilters(categoryFiltered, filters)
    
    // 5. Apply occasion filters
    const occasionFiltered = this.applyOccasionFilters(colorFiltered, filters)
    
    // 6. Apply price filters
    const priceFiltered = this.applyPriceFilters(occasionFiltered, filters)
    
    // 7. Apply availability filters
    const availabilityFiltered = this.applyAvailabilityFilters(priceFiltered, filters)
    
    // 8. Calculate relevance scores
    const scored = this.calculateRelevanceScores(availabilityFiltered, query, filters)
    
    // 9. Sort results
    const sorted = this.sortResults(scored, options.sort)
    
    return {
      products: sorted,
      totalCount: sorted.length,
      facets: this.generateFacets(sorted),
      suggestions: this.generateSuggestions(query, sorted)
    }
  }
  
  private async combineProductTypes(filters: UnifiedProductFilters): Promise<UnifiedProduct[]> {
    const results: UnifiedProduct[] = []
    
    // Include individual products
    if (filters.includeIndividual !== false) {
      const individualProducts = await this.getIndividualProducts()
      results.push(...individualProducts.map(p => this.toUnifiedProduct(p, 'individual')))
    }
    
    // Include bundles
    if (filters.includeBundles !== false) {
      const bundles = await this.getBundles(filters.bundleTypes)
      results.push(...bundles.map(b => this.toUnifiedProduct(b, 'bundle')))
    }
    
    return results
  }
  
  private applyTextSearch(products: UnifiedProduct[], query: string): UnifiedProduct[] {
    if (!query) return products
    
    const queryLower = query.toLowerCase()
    const queryWords = queryLower.split(/\s+/)
    
    return products.filter(product => {
      const searchableText = [
        product.name,
        product.description || '',
        product.category || '',
        product.productType,
        product.vendor,
        product.brand || '',
        ...product.searchableColors,
        ...product.searchableOccasions,
        ...product.searchableTags,
        ...product.searchableStyles,
        ...product.tags
      ].join(' ').toLowerCase()
      
      // Check if all query words are found
      return queryWords.every(word => searchableText.includes(word))
    })
  }
  
  private applyColorFilters(products: UnifiedProduct[], filters: UnifiedProductFilters): UnifiedProduct[] {
    if (!filters.colors && !filters.color && !filters.suitColor && !filters.shirtColor && !filters.tieColor) {
      return products
    }
    
    return products.filter(product => {
      // For individual products, check product colors
      if (product.type === 'individual') {
        return this.matchesColorFilter(product.searchableColors, filters)
      }
      
      // For bundles, check component colors
      if (product.bundleComponents) {
        const bundleColors = product.bundleComponents.flatMap(comp => comp.color)
        
        // Check specific component colors if specified
        if (filters.suitColor) {
          const suitComponent = product.bundleComponents.find(c => c.type === 'suit')
          if (suitComponent && !suitComponent.color.toLowerCase().includes(filters.suitColor.toLowerCase())) {
            return false
          }
        }
        
        if (filters.shirtColor) {
          const shirtComponent = product.bundleComponents.find(c => c.type === 'shirt')
          if (shirtComponent && !shirtComponent.color.toLowerCase().includes(filters.shirtColor.toLowerCase())) {
            return false
          }
        }
        
        if (filters.tieColor) {
          const tieComponent = product.bundleComponents.find(c => c.type === 'tie' || c.type === 'bowtie')
          if (tieComponent && !tieComponent.color.toLowerCase().includes(filters.tieColor.toLowerCase())) {
            return false
          }
        }
        
        return this.matchesColorFilter([...product.searchableColors, ...bundleColors], filters)
      }
      
      return this.matchesColorFilter(product.searchableColors, filters)
    })
  }
  
  private calculateRelevanceScores(
    products: UnifiedProduct[],
    query: string,
    filters: UnifiedProductFilters
  ): ScoredProduct[] {
    return products.map(product => {
      let score = 0
      
      // Text relevance score
      if (query) {
        score += this.calculateTextScore(product, query)
      }
      
      // AI score bonus
      if (product.aiScore) {
        score += product.aiScore * 0.1
      }
      
      // Trending bonus
      if (product.trending) {
        score += 10
      }
      
      // Featured bonus
      if (product.featured) {
        score += 5
      }
      
      // Bundle completeness bonus
      if (product.type === 'bundle') {
        score += 15 // Bundles are complete looks
      }
      
      // Exact match bonuses
      if (filters.occasions?.some(occ => 
        product.searchableOccasions.some(pOcc => 
          pOcc.toLowerCase().includes(occ.toLowerCase())
        )
      )) {
        score += 20
      }
      
      return {
        ...product,
        relevanceScore: score
      }
    })
  }
}
```

## 4. Visual Hierarchy for Mixed Product Types

### Product Card Variants
```typescript
export interface ProductCardProps {
  product: UnifiedProduct
  variant: 'bundle' | 'individual' | 'featured'
  size: 'small' | 'medium' | 'large'
  showBundleBreakdown?: boolean
  showSavings?: boolean
  className?: string
}

// Visual hierarchy rules:
// 1. Bundles get larger cards with component breakdown
// 2. Featured products get gold accent borders
// 3. Individual products show size/color options
// 4. Price display varies by product type
// 5. Bundle cards show savings prominently
```

### Grid Layout Strategy
```typescript
export const GRID_LAYOUT_RULES = {
  // Row 1: Featured bundles (larger cards)
  featuredBundles: {
    span: 'col-span-2 md:col-span-1', // Wider on mobile
    priority: 1,
    maxCount: 2
  },
  
  // Row 2-3: Mix of bundles and individual products
  regularBundles: {
    span: 'col-span-1',
    priority: 2,
    showSavings: true
  },
  
  individualProducts: {
    span: 'col-span-1',
    priority: 3,
    showVariants: true
  },
  
  // Later rows: Remaining products sorted by relevance
  remaining: {
    span: 'col-span-1',
    priority: 4
  }
}
```

## 5. Implementation Priority List

### Phase 1: Core Infrastructure (Week 1-2)
1. **Create unified TypeScript interfaces**
   - UnifiedProduct interface
   - UnifiedProductFilters interface
   - FilterPreset interface
   - URL parameter types

2. **Build bundle data integration**
   - Convert existing bundleProducts to UnifiedProduct format
   - Create bundle-to-unified-product mapper
   - Add searchable fields extraction

3. **Enhance API endpoint**
   - Modify `/api/supabase/products` to support unified filtering
   - Add bundle inclusion logic
   - Implement preset filter resolution

### Phase 2: Search & Filter Engine (Week 2-3)
1. **Build UnifiedSearchEngine class**
   - Implement core search logic
   - Add color filtering across bundle components
   - Create relevance scoring algorithm

2. **Create filter preset system**
   - Implement FILTER_PRESETS configuration
   - Add preset resolution logic
   - Create preset-to-filters mapper

3. **Update URL parameter handling**
   - Add URL parameter parsing
   - Implement filter state synchronization
   - Add browser history management

### Phase 3: Frontend Components (Week 3-4)
1. **Enhance ProductCard component**
   - Add bundle variant display
   - Implement component breakdown view
   - Add savings display for bundles

2. **Create UnifiedProductGrid**
   - Implement visual hierarchy rules
   - Add mixed product type layout
   - Create responsive grid system

3. **Update filter components**
   - Enhance ProductFiltersPanel for unified filters
   - Add preset filter buttons
   - Create occasion and style filters

### Phase 4: Advanced Features (Week 4-5)
1. **Implement smart search suggestions**
   - Add search autocomplete
   - Create "Did you mean?" functionality
   - Add popular search suggestions

2. **Add advanced filtering UI**
   - Color picker for bundle components
   - Occasion-based filter presets
   - Price point quick filters

3. **Create bundle-specific features**
   - Bundle component zoom/breakdown
   - Savings calculator display
   - Bundle customization options

### Phase 5: Optimization & Testing (Week 5-6)
1. **Performance optimization**
   - Implement search result caching
   - Add pagination for large result sets
   - Optimize image loading for mixed types

2. **SEO optimization**
   - Add structured data for bundles
   - Create preset-specific meta tags
   - Implement canonical URLs for filters

3. **Testing and refinement**
   - A/B test visual hierarchy
   - User testing for filter usability
   - Performance testing with large datasets

## 6. Technical Considerations

### Caching Strategy
- Cache unified product data for 15 minutes
- Cache filter metadata for 1 hour  
- Cache preset configurations indefinitely
- Invalidate cache on product updates

### Performance Optimization
- Lazy load bundle component images
- Implement virtual scrolling for large result sets
- Use Web Workers for complex filtering operations
- Preload popular preset configurations

### SEO Strategy
- Generate unique URLs for each filter combination
- Create landing pages for popular presets
- Add structured data for bundle products
- Implement pagination with proper canonical tags

### Analytics Integration
- Track preset filter usage
- Monitor bundle vs individual product engagement
- Analyze search query patterns
- Track conversion by product type

This comprehensive plan provides a scalable foundation for the unified shop page filter architecture that can grow with KCT Menswear's product catalog while maintaining excellent user experience and performance.