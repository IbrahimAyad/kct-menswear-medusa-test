'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  fetchMedusaProducts, 
  getMedusaDisplayPrice,
  isMedusaProductAvailable,
  type MedusaProduct 
} from '@/services/medusaBackendService'
import { ShoppingBag, Filter, Grid2x2, Grid3x3, Search, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CatalogPage() {
  const [products, setProducts] = useState<MedusaProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTier, setSelectedTier] = useState<string>('all')
  const [gridView, setGridView] = useState<'2x2' | '3x3'>('3x3')
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high'>('name')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadProducts()
    }
  }, [mounted])

  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const medusaProducts = await fetchMedusaProducts()
      console.log('Loaded Medusa products:', medusaProducts.length)
      
      // If no products, show demo message
      if (medusaProducts.length === 0) {
        setError('The Medusa backend is not configured yet. Please set up the backend API connection.')
      } else {
        setProducts(medusaProducts)
      }
    } catch (err: any) {
      setError('Unable to connect to Medusa backend. Please ensure the backend is running and accessible.')
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  // Get unique pricing tiers
  const uniqueTiers = Array.from(new Set(
    products.map(p => p.metadata?.pricing_tier).filter(Boolean)
  ))

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      // Search filter
      if (searchTerm && !product.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      // Tier filter
      if (selectedTier !== 'all' && product.metadata?.pricing_tier !== selectedTier) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return getMedusaDisplayPrice(a) - getMedusaDisplayPrice(b)
        case 'price-high':
          return getMedusaDisplayPrice(b) - getMedusaDisplayPrice(a)
        case 'name':
        default:
          return a.title.localeCompare(b.title)
      }
    })

  const gridClass = gridView === '2x2' 
    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
    : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-semibold mb-2">Loading Catalog</h2>
          <p className="text-gray-600">Fetching products from inventory...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white rounded-lg shadow-lg p-8">
          <Package className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Catalog Setup Required</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
            <h3 className="font-medium text-blue-900 mb-2">Backend Configuration:</h3>
            <p className="text-sm text-blue-700">
              The Medusa backend at <code className="bg-blue-100 px-1 rounded">backend-production-7441.up.railway.app</code> needs to be configured with:
            </p>
            <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
              <li>Publishable API key</li>
              <li>Region configuration</li>
              <li>Product inventory</li>
            </ul>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={loadProducts} className="flex-1">Try Again</Button>
            <Link href="/products/suits" className="flex-1">
              <Button variant="outline" className="w-full">View Premium Collection</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Extended Catalog</h1>
              <p className="text-sm text-gray-600 mt-1">
                {products.length} products from inventory
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGridView('2x2')}
                className={`p-2 rounded ${gridView === '2x2' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                aria-label="Large grid view"
              >
                <Grid2x2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setGridView('3x3')}
                className={`p-2 rounded ${gridView === '3x3' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                aria-label="Small grid view"
              >
                <Grid3x3 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>

            {/* Tier Filter */}
            {uniqueTiers.length > 0 && (
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              >
                <option value="all">All Tiers</option>
                {uniqueTiers.map(tier => (
                  <option key={tier} value={tier}>{tier}</option>
                ))}
              </select>
            )}

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
            >
              <option value="name">Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : (
          <div className={`grid ${gridClass} gap-4`}>
            {filteredProducts.map((product) => {
              const price = getMedusaDisplayPrice(product)
              const isAvailable = isMedusaProductAvailable(product)
              
              return (
                <Link
                  key={product.id}
                  href={`/products/medusa/${product.handle || product.id}`}
                  className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="relative aspect-[3/4] bg-gray-100">
                    {product.thumbnail ? (
                      <Image
                        src={product.thumbnail}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes={gridView === '2x2' ? '(max-width: 768px) 50vw, 25vw' : '(max-width: 768px) 50vw, 16vw'}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    
                    {/* Out of Stock Badge */}
                    {!isAvailable && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-white text-black px-3 py-1 rounded-full text-sm font-medium">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    {/* Tier Badge */}
                    {product.metadata?.pricing_tier && (
                      <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                        {product.metadata.pricing_tier}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h3 className={`font-medium mb-1 line-clamp-2 ${gridView === '3x3' ? 'text-sm' : 'text-base'}`}>
                      {product.title}
                    </h3>
                    
                    {price > 0 ? (
                      <p className={`font-bold ${gridView === '3x3' ? 'text-sm' : 'text-lg'}`}>
                        ${price.toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">Price on request</p>
                    )}
                    
                    {/* Variants Count */}
                    {product.variants && product.variants.length > 1 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {product.variants.length} options available
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-burgundy-50 border-t border-burgundy-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-burgundy-800">
            <strong>Note:</strong> This is our extended catalog from inventory. 
            For our premium collection of suits, ties, and dress shirts, visit the{' '}
            <Link href="/products/suits" className="underline font-medium">
              Premium Collection
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}