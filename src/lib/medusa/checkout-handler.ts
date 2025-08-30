import { medusa } from './client'
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
   * Complete checkout process with Medusa
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

      // Step 6: Initialize payment session with Stripe
      const paymentCollection = await medusa.store.payment.initiatePaymentSession(
        cart.id,
        {
          provider_id: 'stripe',
        }
      )

      // Step 7: Get payment session client secret for Stripe
      const clientSecret = paymentCollection.payment_sessions?.[0]?.data?.client_secret

      return {
        success: true,
        cartId: cart.id,
        clientSecret,
        paymentSessionId: paymentCollection.payment_sessions?.[0]?.id,
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
   * Complete the payment after Stripe confirmation
   */
  async completePayment(cartId: string) {
    try {
      // Complete the cart which creates an order
      const result = await medusa.store.cart.complete(cartId)
      
      // Clear local cart after successful order
      const cartStore = (await import('@/lib/store/cartStore')).useCartStore.getState()
      cartStore.clearCart()
      
      // Clear Medusa cart ID from storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('medusa_cart_id')
      }

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