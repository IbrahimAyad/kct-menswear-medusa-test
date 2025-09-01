'use client'

import { useState, useEffect } from 'react'
import { useMedusaCart } from '@/hooks/useMedusaCart'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, AlertCircle, Check, Truck } from 'lucide-react'
import Link from 'next/link'

export default function DirectStripeCheckoutPage() {
  const router = useRouter()
  const { medusaCart, isLoading, setCustomerEmail, setShippingAddress } = useMedusaCart()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<'info' | 'processing' | 'success'>('info')
  
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    phone: ''
  })

  const handleDirectCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setError(null)
    
    try {
      if (!medusaCart?.id) {
        throw new Error('No cart available')
      }

      setStep('processing')

      // Update cart with customer information
      await setCustomerEmail(customerInfo.email)
      
      // Set shipping address for tax calculation
      await setShippingAddress({
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        address_1: customerInfo.address,
        city: customerInfo.city,
        province: customerInfo.state,
        postal_code: customerInfo.postalCode,
        country_code: 'us',
        phone: customerInfo.phone
      })

      // Create a direct Stripe checkout session
      const response = await fetch('/api/checkout/direct-stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartId: medusaCart.id,
          email: customerInfo.email,
          shipping: {
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            address: {
              line1: customerInfo.address,
              city: customerInfo.city,
              state: customerInfo.state,
              postal_code: customerInfo.postalCode,
              country: 'US'
            }
          },
          items: medusaCart.items.map((item: any) => ({
            name: item.title || item.variant?.product?.title || 'Product',
            amount: item.unit_price,
            quantity: item.quantity,
            description: item.variant?.title || ''
          })),
          subtotal: medusaCart.subtotal,
          tax_total: medusaCart.tax_total || 0,
          shipping_total: medusaCart.shipping_total || 0,
          total: medusaCart.total
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Checkout failed')
      }

      const { url } = await response.json()
      
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
      
    } catch (err: any) {
      console.error('Checkout error:', err)
      setError(err?.message || 'Checkout failed')
      setStep('info')
    } finally {
      setIsProcessing(false)
    }
  }

  const calculateTaxPercentage = () => {
    if (!medusaCart || !medusaCart.subtotal) return 0
    return ((medusaCart.tax_total || 0) / medusaCart.subtotal * 100).toFixed(2)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading checkout...</div>
      </div>
    )
  }

  if (!medusaCart || !medusaCart.items?.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl mb-4">Your cart is empty</h1>
        <Link href="/kct-shop" className="text-blue-600 hover:underline">
          Continue Shopping
        </Link>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Check className="h-16 w-16 text-green-500 mb-4" />
        <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
        <p className="text-gray-600 mb-8">Thank you for your purchase.</p>
        <Link href="/kct-shop" className="px-6 py-3 bg-black text-white rounded hover:bg-gray-800">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <Link href="/kct-shop" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </Link>

        <h1 className="text-3xl font-bold mb-8">Secure Checkout</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {medusaCart.items.map((item: any) => (
                <div key={item.id} className="flex justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">
                      {item.title || item.variant?.product?.title || 'Product'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.variant?.title && `Size: ${item.variant.title}`}
                      {item.quantity > 1 && ` • Qty: ${item.quantity}`}
                    </p>
                  </div>
                  <p className="font-medium">
                    ${((item.unit_price || 0) * item.quantity / 100).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${((medusaCart.subtotal || 0) / 100).toFixed(2)}</span>
              </div>
              
              {medusaCart.tax_total > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax ({calculateTaxPercentage()}%)</span>
                  <span>${((medusaCart.tax_total || 0) / 100).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>
                  {medusaCart.shipping_total === 0 ? 'FREE' : `$${(medusaCart.shipping_total / 100).toFixed(2)}`}
                </span>
              </div>
              
              <div className="flex justify-between text-xl font-bold pt-2 border-t">
                <span>Total</span>
                <span>${((medusaCart.total || 0) / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Tax Info */}
            {medusaCart.tax_total > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
                <p className="font-medium text-blue-900">✓ Stripe Tax Active</p>
                <p className="text-blue-700">Accurate tax calculated for your location</p>
              </div>
            )}
          </div>

          {/* Customer Information Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleDirectCheckout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <input
                    type="text"
                    required
                    value={customerInfo.firstName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <input
                    type="text"
                    required
                    value={customerInfo.lastName}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Street Address</label>
                <input
                  type="text"
                  required
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    required
                    value={customerInfo.city}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Los Angeles"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={customerInfo.state}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="CA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">ZIP Code</label>
                  <input
                    type="text"
                    required
                    value={customerInfo.postalCode}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="90210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  'Processing...'
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Proceed to Payment
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-sm text-gray-600 justify-center">
                <Truck className="h-4 w-4" />
                <span>Free shipping on orders over $100</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}