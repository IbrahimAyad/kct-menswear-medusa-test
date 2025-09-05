'use client'

import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { MedusaCartProvider } from '@/context/medusa-cart-context'

export default function MedusaCheckoutPage() {
  return (
    <MedusaCartProvider>
      <div className="min-h-screen bg-white">
        <CheckoutForm />
      </div>
    </MedusaCartProvider>
  )
}