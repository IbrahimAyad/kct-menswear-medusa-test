'use client'

import { useState } from 'react'
import { useMedusaCart } from '@/contexts/MedusaCartContext'
import { useMedusaAuth } from '@/contexts/MedusaAuthContext'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'https://backend-production-7441.up.railway.app'
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_PUBLISHABLE_KEY || 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'

export default function MedusaCheckoutPage() {
  const { cart } = useMedusaCart()
  const { user } = useMedusaAuth()
  const router = useRouter()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [shippingInfo, setShippingInfo] = useState({
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    address_1: '',
    city: '',
    country_code: 'us',
    postal_code: '',
    phone: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!cart) {
      setError('No cart found')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Update cart with shipping address
      const addressResponse = await fetch(`${API_URL}/store/carts/${cart.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          email: shippingInfo.email,
          shipping_address: {
            first_name: shippingInfo.first_name,
            last_name: shippingInfo.last_name,
            address_1: shippingInfo.address_1,
            city: shippingInfo.city,
            country_code: shippingInfo.country_code,
            postal_code: shippingInfo.postal_code,
            phone: shippingInfo.phone
          },
          billing_address: {
            first_name: shippingInfo.first_name,
            last_name: shippingInfo.last_name,
            address_1: shippingInfo.address_1,
            city: shippingInfo.city,
            country_code: shippingInfo.country_code,
            postal_code: shippingInfo.postal_code,
            phone: shippingInfo.phone
          }
        })
      })

      if (!addressResponse.ok) {
        throw new Error('Failed to update shipping address')
      }

      // Create payment collection
      const paymentResponse = await fetch(`${API_URL}/store/carts/${cart.id}/payment-collection`, {
        method: 'POST',
        headers: {
          'x-publishable-api-key': PUBLISHABLE_KEY
        }
      })

      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment collection')
      }

      // Redirect to payment page (simplified for now)
      alert('Order placed successfully! Payment integration coming soon.')
      router.push('/account-new/orders')
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100)
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <a href="/shop-new" className="text-black hover:underline">
            Continue shopping
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shipping Form */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={shippingInfo.email}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    required
                    value={shippingInfo.first_name}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, first_name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    required
                    value={shippingInfo.last_name}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, last_name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  required
                  value={shippingInfo.address_1}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, address_1: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    required
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="postal_code"
                    required
                    value={shippingInfo.postal_code}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, postal_code: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={shippingInfo.phone}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
            
            <div className="bg-white rounded-lg shadow p-6">
              <ul className="divide-y divide-gray-200">
                {cart.items.map((item) => (
                  <li key={item.id} className="py-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatPrice(item.unit_price * item.quantity)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between">
                  <p className="text-base font-medium text-gray-900">Total</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatPrice(cart.total || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}