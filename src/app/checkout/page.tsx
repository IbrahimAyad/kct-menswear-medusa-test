'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMedusaCart } from '@/hooks/useMedusaCart'
import { medusa } from '@/lib/medusa/client'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { 
  Check, 
  ShoppingCart, 
  Truck, 
  CreditCard, 
  CheckCircle,
  ChevronRight,
  Lock,
  Package,
  MapPin,
  User,
  Mail,
  Phone,
  Building,
  AlertCircle
} from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type CheckoutStep = 'cart' | 'shipping' | 'billing' | 'delivery' | 'payment' | 'confirmation'

const steps: { id: CheckoutStep; label: string; icon: any }[] = [
  { id: 'cart', label: 'Cart', icon: ShoppingCart },
  { id: 'shipping', label: 'Shipping', icon: MapPin },
  { id: 'billing', label: 'Billing', icon: Building },
  { id: 'delivery', label: 'Delivery', icon: Truck },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'confirmation', label: 'Confirm', icon: CheckCircle }
]

export default function ProfessionalCheckout() {
  const router = useRouter()
  const { medusaCart, isLoading, setShippingAddress, setBillingAddress, setCustomerEmail, addShippingMethod } = useMedusaCart()
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart')
  const [completedSteps, setCompletedSteps] = useState<Set<CheckoutStep>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [selectedShipping, setSelectedShipping] = useState<string>('')
  const [orderData, setOrderData] = useState<any>(null)
  
  // Form states
  const [email, setEmail] = useState('')
  const [shippingForm, setShippingForm] = useState({
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: '',
    phone: ''
  })
  
  const [billingForm, setBillingForm] = useState({
    sameAsShipping: true,
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    postalCode: ''
  })

  const [shippingOptions] = useState([
    { id: 'so_01K3S6BKMKFTYS3ASAC3HBCSD5', name: 'Free Shipping', price: 0, days: '5-7' },
    { id: 'express', name: 'Express Shipping', price: 15, days: '2-3' },
    { id: 'overnight', name: 'Overnight', price: 35, days: '1' }
  ])

  // Auto-save to localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('checkoutData')
    if (savedData) {
      const data = JSON.parse(savedData)
      setEmail(data.email || '')
      setShippingForm(data.shipping || shippingForm)
      setBillingForm(data.billing || billingForm)
    }
  }, [])

  useEffect(() => {
    if (email || shippingForm.firstName) {
      localStorage.setItem('checkoutData', JSON.stringify({
        email,
        shipping: shippingForm,
        billing: billingForm
      }))
    }
  }, [email, shippingForm, billingForm])

  const handleStepComplete = (step: CheckoutStep) => {
    setCompletedSteps(prev => new Set(prev).add(step))
  }

  const goToStep = (step: CheckoutStep) => {
    const stepIndex = steps.findIndex(s => s.id === step)
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    
    // Can only go to previous steps or next immediate step
    if (stepIndex <= currentIndex || stepIndex === currentIndex + 1) {
      setCurrentStep(step)
    }
  }

  const handleCartReview = () => {
    if (!medusaCart?.items?.length) {
      setError('Your cart is empty')
      return
    }
    handleStepComplete('cart')
    goToStep('shipping')
  }

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsProcessing(true)

    try {
      // Validate form
      if (!email || !shippingForm.firstName || !shippingForm.lastName || 
          !shippingForm.address || !shippingForm.city || !shippingForm.state || 
          !shippingForm.postalCode) {
        throw new Error('Please fill in all required fields')
      }

      // Update cart with email
      await setCustomerEmail(email)

      // Update shipping address
      await setShippingAddress({
        first_name: shippingForm.firstName,
        last_name: shippingForm.lastName,
        address_1: shippingForm.address,
        address_2: shippingForm.apartment,
        city: shippingForm.city,
        province: shippingForm.state,
        postal_code: shippingForm.postalCode,
        country_code: 'us',
        phone: shippingForm.phone
      })

      handleStepComplete('shipping')
      goToStep('billing')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBillingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsProcessing(true)

    try {
      const billingAddress = billingForm.sameAsShipping ? {
        first_name: shippingForm.firstName,
        last_name: shippingForm.lastName,
        address_1: shippingForm.address,
        address_2: shippingForm.apartment,
        city: shippingForm.city,
        province: shippingForm.state,
        postal_code: shippingForm.postalCode,
        country_code: 'us'
      } : {
        first_name: billingForm.firstName,
        last_name: billingForm.lastName,
        address_1: billingForm.address,
        address_2: billingForm.apartment,
        city: billingForm.city,
        province: billingForm.state,
        postal_code: billingForm.postalCode,
        country_code: 'us'
      }

      await setBillingAddress(billingAddress)
      handleStepComplete('billing')
      goToStep('delivery')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsProcessing(true)

    try {
      if (!selectedShipping) {
        throw new Error('Please select a shipping method')
      }

      // Add shipping method - use free shipping for now
      await addShippingMethod('so_01K3S6BKMKFTYS3ASAC3HBCSD5')
      
      // Initialize payment
      const paymentCollection = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/payment-collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
        },
        body: JSON.stringify({
          cart_id: medusaCart.id
        })
      })

      if (!paymentCollection.ok) {
        throw new Error('Failed to initialize payment')
      }

      const collection = await paymentCollection.json()
      const collectionId = collection.payment_collection?.id || collection.id

      // Create payment session
      const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/payment-collections/${collectionId}/payment-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
        },
        body: JSON.stringify({
          provider_id: 'stripe'
        })
      })

      if (!sessionResponse.ok) {
        throw new Error('Failed to create payment session')
      }

      const sessionData = await sessionResponse.json()
      const secret = sessionData.payment_collection?.payment_sessions?.[0]?.data?.client_secret ||
                     sessionData.payment_sessions?.[0]?.data?.client_secret

      if (!secret) {
        throw new Error('No payment client secret received')
      }

      setClientSecret(secret)
      handleStepComplete('delivery')
      goToStep('payment')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const calculateTotal = () => {
    const subtotal = medusaCart?.subtotal || 0
    const shipping = shippingOptions.find(o => o.id === selectedShipping)?.price || 0
    const tax = medusaCart?.tax_total || 0
    return subtotal + shipping + tax
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading checkout...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = completedSteps.has(step.id)
              const isClickable = index === 0 || completedSteps.has(steps[index - 1].id)
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => isClickable && goToStep(step.id)}
                    disabled={!isClickable}
                    className={`flex items-center ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  >
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isActive ? 'bg-black text-white' : 
                        isCompleted ? 'bg-green-500 text-white' : 
                        'bg-gray-200 text-gray-400'}
                    `}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`ml-2 text-sm font-medium hidden sm:block
                      ${isActive ? 'text-black' : 
                        isCompleted ? 'text-green-600' : 
                        'text-gray-400'}
                    `}>
                      {step.label}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 mx-2 text-gray-300 flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2">
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Cart Review Step */}
            {currentStep === 'cart' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Review Your Cart</h2>
                <div className="space-y-4 mb-6">
                  {medusaCart?.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center py-4 border-b">
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-gray-600">
                          {item.variant?.title} • Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">
                        ${(item.unit_price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleCartReview}
                  className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800"
                >
                  Continue to Shipping
                </button>
              </div>
            )}

            {/* Shipping Step */}
            {currentStep === 'shipping' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
                <form onSubmit={handleShippingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Mail className="inline w-4 h-4 mr-1" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <User className="inline w-4 h-4 mr-1" />
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingForm.firstName}
                        onChange={(e) => setShippingForm({...shippingForm, firstName: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name</label>
                      <input
                        type="text"
                        required
                        value={shippingForm.lastName}
                        onChange={(e) => setShippingForm({...shippingForm, lastName: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Street Address
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingForm.address}
                      onChange={(e) => setShippingForm({...shippingForm, address: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black"
                      placeholder="123 Main St"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Apartment, suite, etc. (optional)
                    </label>
                    <input
                      type="text"
                      value={shippingForm.apartment}
                      onChange={(e) => setShippingForm({...shippingForm, apartment: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">City</label>
                      <input
                        type="text"
                        required
                        value={shippingForm.city}
                        onChange={(e) => setShippingForm({...shippingForm, city: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">State</label>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        value={shippingForm.state}
                        onChange={(e) => setShippingForm({...shippingForm, state: e.target.value.toUpperCase()})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black"
                        placeholder="NY"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">ZIP Code</label>
                      <input
                        type="text"
                        required
                        value={shippingForm.postalCode}
                        onChange={(e) => setShippingForm({...shippingForm, postalCode: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <Phone className="inline w-4 h-4 mr-1" />
                        Phone (optional)
                      </label>
                      <input
                        type="tel"
                        value={shippingForm.phone}
                        onChange={(e) => setShippingForm({...shippingForm, phone: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
                  >
                    {isProcessing ? 'Processing...' : 'Continue to Billing'}
                  </button>
                </form>
              </div>
            )}

            {/* Other steps continue... */}
            
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-bold mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-4">
                {medusaCart?.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-gray-600">
                        {item.variant?.title} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${(medusaCart?.subtotal || 0).toFixed(2)}</span>
                </div>
                
                {selectedShipping && (
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>
                      {shippingOptions.find(o => o.id === selectedShipping)?.price === 0 
                        ? 'FREE' 
                        : `$${shippingOptions.find(o => o.id === selectedShipping)?.price?.toFixed(2)}`}
                    </span>
                  </div>
                )}
                
                {medusaCart?.tax_total > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${(medusaCart.tax_total).toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Lock className="w-4 h-4 mr-2" />
                  Secure SSL Encryption
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Truck className="w-4 h-4 mr-2" />
                  Free shipping on orders over $100
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Package className="w-4 h-4 mr-2" />
                  30-day return policy
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}