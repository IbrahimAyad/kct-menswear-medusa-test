// Simple in-memory cache for Medusa products
// Helps reduce API calls and improve performance

import { MedusaProduct } from './medusaBackendService'

interface CacheEntry {
  data: MedusaProduct[]
  timestamp: number
  query: string
}

class MedusaProductCache {
  private cache: Map<string, CacheEntry> = new Map()
  private readonly TTL = 5 * 60 * 1000 // 5 minutes cache TTL
  
  // Generate cache key from query params
  private getCacheKey(limit: number, offset: number): string {
    return `products_${limit}_${offset}`
  }
  
  // Check if cache entry is still valid
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.TTL
  }
  
  // Get products from cache
  get(limit: number, offset: number): MedusaProduct[] | null {
    const key = this.getCacheKey(limit, offset)
    const entry = this.cache.get(key)
    
    if (entry && this.isValid(entry)) {
      console.log('Cache hit for Medusa products')
      return entry.data
    }
    
    // Clean up expired entry
    if (entry) {
      this.cache.delete(key)
    }
    
    return null
  }
  
  // Store products in cache
  set(limit: number, offset: number, products: MedusaProduct[]): void {
    const key = this.getCacheKey(limit, offset)
    this.cache.set(key, {
      data: products,
      timestamp: Date.now(),
      query: `limit=${limit}&offset=${offset}`
    })
    console.log('Cached Medusa products:', products.length)
  }
  
  // Clear all cache
  clear(): void {
    this.cache.clear()
    console.log('Medusa product cache cleared')
  }
  
  // Clear expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.TTL) {
        this.cache.delete(key)
      }
    }
  }
  
  // Get cache stats
  getStats() {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalProducts: Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.data.length, 0)
    }
  }
}

// Export singleton instance
export const medusaProductCache = new MedusaProductCache()