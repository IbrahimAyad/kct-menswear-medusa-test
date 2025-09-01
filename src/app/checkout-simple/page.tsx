'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CheckoutSimpleRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Clear any stale cart data and redirect to shop
    if (typeof window !== 'undefined') {
      // Clear old cart items from localStorage
      localStorage.removeItem('cart-storage')
      localStorage.removeItem('medusa_cart_id')
    }
    // Redirect to shop to start fresh
    router.replace('/kct-shop')
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl mb-2">Starting fresh shopping experience...</p>
        <p className="text-sm text-gray-600">Redirecting to shop</p>
      </div>
    </div>
  )
}