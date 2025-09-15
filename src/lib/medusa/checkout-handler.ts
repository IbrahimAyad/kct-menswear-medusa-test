import { medusa, MEDUSA_CONFIG } from './client'
import { cartAdapter } from './cart-adapter'

interface CheckoutData {
  email: string
  shippingAddress: {
    first_name: string
    last_name: string
    address_1: string
    address_2?: string
    city: string
    province?: string
    postal_code: string
    country_code: string
    phone?: string
  }
  billingAddress?: {
    first_name: string
    last_name: string
    address_1: string
    address_2?: string
    city: string
    province?: string
    postal_code: string
    country_code: string
  }
}

export class CheckoutHandler {
  /**
   * Complete checkout process with Medusa (with direct Stripe fallback)
   */
  async processCheckout(checkoutData: CheckoutData) {
    try {
      const cart = cartAdapter.getCart()
      if (!cart?.id) {
        throw new Error('No cart available for checkout')
      }

      // Step 1: Add customer email
      await cartAdapter.setCustomerEmail(checkoutData.email)

      // Step 2: Add shipping address
      await cartAdapter.setShippingAddress(checkoutData.shippingAddress)

      // Step 3: Add billing address (use shipping if not provided)
      const billingAddress = checkoutData.billingAddress || {
        ...checkoutData.shippingAddress,
        phone: undefined, // billing doesn't need phone
      }

      await medusa.store.cart.update(cart.id, {
        billing_address: billingAddress,
      })

      // Step 4: List available shipping options
      const shippingOptions = await medusa.store.shipping.listCartOptions(cart.id)
      
      // Step 5: Select first available shipping option
      if (shippingOptions.length > 0) {
        await medusa.store.cart.addShippingMethod(cart.id, {
          option_id: shippingOptions[0].id,
        })
      }

      // Step 6: Try to initialize payment with Medusa first, then fallback to direct Stripe
      try {
        console.log('Attempting Medusa payment initialization...')
        
        // Need to pass the cart object, not just the ID
        const paymentCollection = await medusa.store.payment.initiatePaymentSession(
          cart,
          {
            provider_id: 'stripe',  // Stripe module always registers as 'stripe'
          }
        )

        // Get payment session client secret for Stripe
        const clientSecret = paymentCollection.payment_sessions?.[0]?.data?.client_secret

        if (clientSecret) {
          console.log('✅ Medusa payment session created successfully')
          return {
            success: true,
            cartId: cart.id,
            clientSecret,
            paymentSessionId: paymentCollection.payment_sessions?.[0]?.id,
            method: 'medusa'
          }
        } else {
          throw new Error('No client secret received from Medusa payment session')
        }
      } catch (medusaError) {
        console.warn('Medusa payment failed, attempting direct Stripe fallback:', medusaError)
        
        // Fallback to direct Stripe payment
        const directResult = await this.createDirectStripePayment(cart.id, checkoutData.email, checkoutData.shippingAddress, billingAddress)
        
        if (directResult.success) {
          console.log('✅ Direct Stripe payment created successfully')
          return {
            success: true,
            cartId: cart.id,
            clientSecret: directResult.clientSecret,
            paymentIntentId: directResult.paymentIntentId,
            method: 'direct_stripe'
          }
        } else {
          throw new Error(directResult.error || 'Both Medusa and direct Stripe payment failed')
        }
      }
    } catch (error) {
      console.error('Checkout failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Checkout failed',
      }
    }
  }

  /**
   * Create direct Stripe payment (bypass Medusa payment system)
   */
  async createDirectStripePayment(
    cartId: string, 
    email: string, 
    shippingAddress: any, 
    billingAddress: any
  ) {
    try {
      console.log('🚀 Creating direct Stripe payment...')
      
      const response = await fetch(`${MEDUSA_CONFIG.baseUrl}/stripe-bypass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart_id: cartId,
          customer_email: email,
          shipping_address: shippingAddress,
          billing_address: billingAddress
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Direct payment failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success || !data.client_secret) {
        throw new Error(data.error || 'Direct payment failed - no client secret')
      }

      return {
        success: true,
        clientSecret: data.client_secret,
        paymentIntentId: data.payment_intent_id,
        amount: data.amount,
        currency: data.currency
      }
    } catch (error) {
      console.error('Direct Stripe payment creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Direct payment creation failed'
      }
    }
  }

  /**
   * Complete the payment after Stripe confirmation
   */
  async completePayment(cartId: string) {
    try {
      // Complete the cart which creates an order
      const result = await medusa.store.cart.complete(cartId)
      
      // DISABLED: Cart deletion moved to after order confirmation
      // const cartStore = (await import('@/lib/store/cartStore')).useCartStore.getState()
      // cartStore.clearCart()
      
      // DISABLED: Cart deletion moved to after order confirmation  
      // if (typeof window !== 'undefined') {
      //   localStorage.removeItem('medusa_cart_id')
      // }

      return {
        success: true,
        order: result.order,
        orderId: result.order?.id,
      }
    } catch (error) {
      console.error('Payment completion failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment completion failed',
      }
    }
  }

  /**
   * Create checkout session for redirect (alternative to embedded)
   */
  async createCheckoutUrl(email?: string) {
    try {
      const cart = cartAdapter.getCart()
      if (!cart?.id) {
        throw new Error('No cart available for checkout')
      }

      // Add email if provided
      if (email) {
        await cartAdapter.setCustomerEmail(email)
      }

      // For Medusa 2.0, we use payment links
      // This creates a shareable checkout link
      const checkoutUrl = `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/checkout/${cart.id}`

      return {
        success: true,
        url: checkoutUrl,
        cartId: cart.id,
      }
    } catch (error) {
      console.error('Failed to create checkout URL:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create checkout',
      }
    }
  }
}

export const checkoutHandler = new CheckoutHandler()