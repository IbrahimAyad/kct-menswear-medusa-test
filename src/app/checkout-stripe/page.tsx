'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMedusaCart } from '@/contexts/MedusaCartContext'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { addShippingAddress, addShippingMethod, createPaymentCollection, createPaymentSession } from '@/services/medusaBackendService'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react'

// Initialize Stripe
const stripePromise = typeof window !== 'undefined' 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  : null

// Payment Form Component
function CheckoutForm({ clientSecret, cartId }: { clientSecret: string, cartId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?cart_id=${cartId}`,
        },
      })

      if (result.error) {
        setError(result.error.message || 'Payment failed')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || processing}
        className="w-full"
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Complete Payment
          </>
        )}
      </Button>
    </form>
  )
}

export default function StripeCheckoutPage() {
  const router = useRouter()
  const { cart, isLoading } = useMedusaCart()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [initializingPayment, setInitializingPayment] = useState(false)
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping')
  
  const [shippingInfo, setShippingInfo] = useState({
    email: '',
    first_name: '',
    last_name: '',
    address_1: '',
    city: '',
    state: '',
    postal_code: '',
    phone: ''
  })

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!cart?.id) {
      setError('No cart found')
      return
    }

    setInitializingPayment(true)
    setError(null)

    try {
      // Save cart data to localStorage for success page
      const cartDataForSuccess = {
        items: cart.items.map((item: any) => ({
          name: item.title,
          size: item.variant?.title || 'One Size',
          quantity: item.quantity,
          price: `$${((item.unit_price || 0) / 100).toFixed(2)}`
        })),
        total: `$${total.toFixed(2)}`
      };
      localStorage.setItem('last_cart_items', JSON.stringify(cartDataForSuccess));
      localStorage.setItem('checkout_email', shippingInfo.email);
      
      // Step 1: Add shipping address
      console.log('Adding shipping address...')
      await addShippingAddress(cart.id, {
        ...shippingInfo,
        country_code: 'us'
      })

      // Step 2: Add shipping method (FREE shipping)
      console.log('Adding shipping method...')
      await addShippingMethod(cart.id, 'Free Shipping', 0)

      // Step 3: Create payment collection
      console.log('Creating payment collection...')
      const paymentCollection = await createPaymentCollection(cart.id)
      
      if (!paymentCollection) {
        throw new Error('Failed to create payment collection')
      }

      // Step 4: Create payment session with Stripe
      console.log('Creating payment session...')
      const paymentSession = await createPaymentSession(paymentCollection.id)
      
      if (!paymentSession?.client_secret) {
        throw new Error('Failed to create payment session')
      }

      setClientSecret(paymentSession.client_secret)
      setStep('payment')
    } catch (err: any) {
      console.error('Checkout error:', err)
      setError(err.message || 'Failed to initialize payment')
    } finally {
      setInitializingPayment(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingInfo(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <h2 className="text-2xl font-light mb-4">Your cart is empty</h2>
          <Button onClick={() => router.push('/collections')} className="w-full">
            Continue Shopping
          </Button>
        </Card>
      </div>
    )
  }

  // Calculate pricing details
  const subtotal = (cart.subtotal || 0) / 100
  const shippingCost = 0.00 // FREE shipping
  const taxRate = 0.06 // 6% tax rate (adjust based on location)
  const taxAmount = subtotal * taxRate
  const total = subtotal + shippingCost + taxAmount

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-light mb-8">Checkout</h1>

        {/* Order Summary */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Order Summary</h2>
          <div className="space-y-3">
            {cart.items.map(item => (
              <div key={item.id} className="border-b pb-3">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.thumbnail ? (
                      <img 
                        src={item.thumbnail} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <div className="text-sm text-gray-600 mt-1">
                          {item.variant?.title && (
                            <p>Size: {item.variant.title}</p>
                          )}
                          {item.variant?.sku && (
                            <p className="text-xs">SKU: {item.variant.sku}</p>
                          )}
                          <p>Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${((item.unit_price || 0) / 100).toFixed(2)}</p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-gray-500">
                            ${((item.unit_price || 0) / 100 * item.quantity).toFixed(2)} total
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {step === 'shipping' ? (
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Shipping Information</h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleShippingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={shippingInfo.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={shippingInfo.first_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={shippingInfo.last_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  name="address_1"
                  value={shippingInfo.address_1}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={shippingInfo.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={shippingInfo.state}
                    onChange={handleInputChange}
                    required
                    maxLength={2}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Postal Code</label>
                  <input
                    type="text"
                    name="postal_code"
                    value={shippingInfo.postal_code}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={initializingPayment}
              >
                {initializingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </Button>
            </form>
          </Card>
        ) : (
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Payment</h2>
            {clientSecret && stripePromise && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm clientSecret={clientSecret} cartId={cart.id} />
              </Elements>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}