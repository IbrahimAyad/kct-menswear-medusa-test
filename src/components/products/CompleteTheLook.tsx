'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getProductUrl } from '@/lib/products/navigation'

interface SuggestedProduct {
  id: string
  handle?: string
  title: string
  price: number
  image: string
  category: string
}

interface CompleteTheLookProps {
  currentProduct: {
    id: string
    title: string
    category?: string
    price?: number
  }
  onAddToCart?: (products: SuggestedProduct[]) => void
}

// Generate suggestions based on product category
const generateSuggestions = (product: any): SuggestedProduct[] => {
  const title = product.title?.toLowerCase() || ''
  const suggestions: SuggestedProduct[] = []
  
  // If it's a suit, suggest shirt, tie, shoes
  if (title.includes('suit') || title.includes('tuxedo')) {
    suggestions.push(
      {
        id: 'shirt-1',
        handle: 'white-dress-shirt',
        title: 'Classic White Dress Shirt',
        price: 89,
        image: 'https://cdn.kctmenswear.com/dress_shirts/stretch_collar/mens_dress_shirt_stretch_collar_model_3005_0.webp',
        category: 'shirt'
      },
      {
        id: 'tie-1', 
        handle: 'burgundy-silk-tie',
        title: 'Burgundy Silk Tie',
        price: 45,
        image: 'https://cdn.kctmenswear.com/ties/burgundy-tie.webp',
        category: 'tie'
      },
      {
        id: 'shoes-1',
        handle: 'oxford-dress-shoes',
        title: 'Black Oxford Dress Shoes',
        price: 195,
        image: 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/7d203d2a-63b7-46d3-9749-1f203e4ccc00/public',
        category: 'shoes'
      },
      {
        id: 'pocket-1',
        handle: 'white-pocket-square',
        title: 'White Linen Pocket Square',
        price: 25,
        image: 'https://cdn.kctmenswear.com/accessories/pocket-square-white.webp',
        category: 'accessory'
      }
    )
  }
  // If it's a shirt, suggest tie, cufflinks, suit
  else if (title.includes('shirt')) {
    suggestions.push(
      {
        id: 'tie-2',
        handle: 'navy-pattern-tie',
        title: 'Navy Pattern Tie',
        price: 45,
        image: 'https://cdn.kctmenswear.com/ties/navy-pattern-tie.webp',
        category: 'tie'
      },
      {
        id: 'cufflinks-1',
        handle: 'silver-cufflinks',
        title: 'Silver Cufflinks',
        price: 65,
        image: 'https://cdn.kctmenswear.com/accessories/silver-cufflinks.webp',
        category: 'accessory'
      },
      {
        id: 'vest-1',
        handle: 'matching-vest',
        title: 'Matching Vest',
        price: 125,
        image: 'https://cdn.kctmenswear.com/main-solid-vest-tie/dusty-sage-model.png',
        category: 'vest'
      }
    )
  }
  // Default suggestions
  else {
    suggestions.push(
      {
        id: 'belt-1',
        handle: 'leather-dress-belt',
        title: 'Italian Leather Belt',
        price: 85,
        image: 'https://cdn.kctmenswear.com/accessories/leather-belt.webp',
        category: 'accessory'
      },
      {
        id: 'socks-1',
        handle: 'dress-socks',
        title: 'Merino Wool Dress Socks',
        price: 22,
        image: 'https://cdn.kctmenswear.com/accessories/dress-socks.webp',
        category: 'accessory'
      }
    )
  }
  
  return suggestions
}

export default function CompleteTheLook({ currentProduct, onAddToCart }: CompleteTheLookProps) {
  const [suggestions, setSuggestions] = useState<SuggestedProduct[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [bundleDiscount] = useState(15) // 15% off when buying multiple items
  
  useEffect(() => {
    setSuggestions(generateSuggestions(currentProduct))
  }, [currentProduct])
  
  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }
  
  const calculateTotal = () => {
    const selectedProducts = suggestions.filter(s => selectedItems.has(s.id))
    const subtotal = selectedProducts.reduce((acc, p) => acc + p.price, 0) + (currentProduct.price || 0)
    const discount = selectedItems.size > 0 ? subtotal * (bundleDiscount / 100) : 0
    return {
      subtotal,
      discount,
      total: subtotal - discount
    }
  }
  
  const { subtotal, discount, total } = calculateTotal()
  
  return (
    <div className="mt-12 border-t pt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light">Complete the Look</h2>
        {selectedItems.size > 0 && (
          <div className="text-sm">
            <span className="text-green-600 font-medium">Save {bundleDiscount}%</span>
            <span className="text-gray-600 ml-2">on bundle</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {suggestions.map((item) => (
          <div key={item.id} className="relative group">
            <Link href={getProductUrl(item)}>
              <div className="aspect-[3/4] relative overflow-hidden bg-gray-50 mb-3">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                {selectedItems.has(item.id) && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-white rounded-full p-2">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                )}
              </div>
            </Link>
            
            <button
              onClick={() => toggleItem(item.id)}
              className={cn(
                "absolute top-2 right-2 p-2 rounded-full transition-all",
                selectedItems.has(item.id) 
                  ? "bg-green-600 text-white" 
                  : "bg-white/90 hover:bg-white text-gray-700"
              )}
              aria-label={selectedItems.has(item.id) ? "Remove from bundle" : "Add to bundle"}
            >
              <Plus className={cn(
                "w-4 h-4 transition-transform",
                selectedItems.has(item.id) && "rotate-45"
              )} />
            </button>
            
            <div className="px-1">
              <h3 className="text-sm font-light line-clamp-1">{item.title}</h3>
              <p className="text-sm font-medium">${item.price}</p>
            </div>
          </div>
        ))}
      </div>
      
      {selectedItems.size > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Current item</span>
              <span>${currentProduct.price?.toFixed(2) || '0.00'}</span>
            </div>
            {suggestions.filter(s => selectedItems.has(s.id)).map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">+ {item.title}</span>
                <span className="text-gray-600">${item.price.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Bundle Discount ({bundleDiscount}%)</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium mt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => onAddToCart?.(suggestions.filter(s => selectedItems.has(s.id)))}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Add Bundle to Cart
          </button>
        </div>
      )}
    </div>
  )
}