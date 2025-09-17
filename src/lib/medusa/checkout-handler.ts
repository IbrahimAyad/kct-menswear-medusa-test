import { medusa, MEDUSA_CONFIG } from './client'
import { cartAdapter } from './cart-adapter'
import { useCartStore } from '@/lib/store/cartStore'

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
   * Complete checkout process with optimized order-first approach
   */
  async processCheckout(checkoutData: CheckoutData) {
    try {
      const cart = cartAdapter.getCart()
      if (!cart?.id) {
        throw new Error('No cart available for checkout')
      }

      // Execute cart setup steps in parallel for speed
      const [emailUpdate, shippingUpdate] = await Promise.all([
        cartAdapter.setCustomerEmail(checkoutData.email),
        cartAdapter.setShippingAddress(checkoutData.shippingAddress)
      ])

      // Step 3: Add billing address (use shipping if not provided)
      const billingAddress = checkoutData.billingAddress || {
        ...checkoutData.shippingAddress,
        phone: undefined, // billing doesn't need phone
      }

      // Execute billing and shipping options in parallel
      const [billingUpdate, shippingOptions] = await Promise.all([
        medusa.store.cart.update(cart.id, {
          billing_address: billingAddress,
        }),
        medusa.store.shipping.listCartOptions(cart.id)
      ])
      
      // Step 5: Select first available shipping option
      if (shippingOptions.length > 0) {
        await medusa.store.cart.addShippingMethod(cart.id, {
          option_id: shippingOptions[0].id,
        })
      }

      // Step 6: Use order-first checkout (no fallback for speed)
      console.log('Creating order-first payment...')
      const orderFirstResult = await this.createOrderFirstPayment(cart.id, checkoutData.email, checkoutData.shippingAddress, billingAddress)
      
      if (orderFirstResult.success) {
        console.log('✅ Order-first checkout created successfully')
        return {
          success: true,
          cartId: cart.id,
          clientSecret: orderFirstResult.clientSecret,
          paymentIntentId: orderFirstResult.paymentIntentId,
          orderId: orderFirstResult.orderId,
          method: 'order_first'
        }
      } else {
        throw new Error(orderFirstResult.error || 'Order-first checkout failed')
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
   * Create order-first payment (primary method with proper tax calculation)
   */
  async createOrderFirstPayment(
    cartId: string, 
    email: string, 
    shippingAddress: any, 
    billingAddress: any
  ) {
    try {
      console.log('🎯 Creating order-first payment...')
      
      // Get cart data first
      const cart = cartAdapter.getCart()
      if (!cart || !cart.items || cart.items.length === 0) {
        throw new Error('Cart is empty or invalid')
      }

      // Get Zustand cart for size information
      const zustandCart = useCartStore.getState().items

      // Extract cart items WITH VARIANT DATA AND SIZE FROM ZUSTAND
      const items = cart.items.map(item => {
        // Find matching Zustand item to get the size
        const zustandItem = zustandCart.find(z => 
          z.productId === item.product?.id || z.productId === item.product_id
        )
        
        // Get size from multiple sources: variant.title, zustand item, or fallback
        const size = item.variant?.title || zustandItem?.size || 'Standard'
        
        return {
          title: item.product?.title || item.title || 'Product',
          variant_id: item.variant_id,
          product_id: item.product?.id,
          quantity: item.quantity,
          unit_price: item.unit_price || item.product?.price || 0,
          // Include variant object with size
          variant: {
            ...(item.variant || {}),
            title: size
          },
          product: item.product,
          thumbnail: item.thumbnail,
          metadata: {
            variant: item.variant,
            product_handle: item.product?.handle,
            size: size // Also include size in metadata
          }
        }
      })
      
      const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

      console.log('🔑 Using publishable key:', publishableKey.substring(0, 20) + '...');
      console.log('🔗 Calling endpoint:', `${MEDUSA_CONFIG.baseUrl}/store/checkout/create-order`);
      console.log('📦 Sending items:', items.length, 'items');
      console.log('💰 Total amount:', cart.total || 0);

      if (!publishableKey || !publishableKey.startsWith('pk_')) {
        console.error('Invalid publishable key:', publishableKey);
        throw new Error('Invalid or missing Medusa publishable key');
      }
      
      const response = await fetch(`${MEDUSA_CONFIG.baseUrl}/store/checkout/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': publishableKey,
        },
        body: JSON.stringify({
          cart_id: cartId,
          email: email,  // ✅ CORRECT FIELD NAME
          shipping_address: shippingAddress,
          billing_address: billingAddress,
          items: items,  // ✅ ADD ITEMS
          amount: cart.total || 0,  // ✅ ADD AMOUNT
          currency_code: 'usd'  // ✅ ADD CURRENCY
        })
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Request failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || `Order-first payment failed: ${response.status}`);
      }

      const data = await response.json()
      
      if (!data.success || !data.client_secret) {
        throw new Error(data.error || 'Order-first payment failed - no client secret')
      }

      return {
        success: true,
        clientSecret: data.client_secret,
        paymentIntentId: data.payment_intent_id,
        orderId: data.order_id,
        amount: data.amount,
        currency: data.currency
      }
    } catch (error) {
      console.error('Order-first payment creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Order-first payment creation failed'
      }
    }
  }

  /**
   * Create direct Stripe payment (bypass Medusa payment system - fallback only)
   */
  async createDirectStripePayment(
    cartId: string, 
    email: string, 
    shippingAddress: any, 
    billingAddress: any
  ) {
    try {
      console.log('🚀 Creating bypass Stripe payment (fallback)...')
      
      // Get cart data WITH VARIANT INFO
      const cart = cartAdapter.getCart()
      
      // Get Zustand cart for size information
      const zustandCart = useCartStore.getState().items
      
      const items = cart?.items?.map(item => {
        // Find matching Zustand item to get the size
        const zustandItem = zustandCart.find(z => 
          z.productId === item.product?.id || z.productId === item.product_id
        )
        
        // Get size from multiple sources
        const size = item.variant?.title || zustandItem?.size || 'Standard'
        
        return {
          title: item.product?.title || item.title || 'Product',
          variant_id: item.variant_id,
          product_id: item.product?.id,
          quantity: item.quantity,
          unit_price: item.unit_price || item.product?.price || 0,
          // Include variant object with size
          variant: {
            ...(item.variant || {}),
            title: size
          },
          product: item.product,
          thumbnail: item.thumbnail,
          metadata: {
            size: size
          }
        }
      }) || []
      
      const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

      console.log('🔑 Using publishable key:', publishableKey.substring(0, 20) + '...');
      console.log('🔗 Calling endpoint:', `${MEDUSA_CONFIG.baseUrl}/stripe-bypass`);

      if (!publishableKey || !publishableKey.startsWith('pk_')) {
        console.error('Invalid publishable key:', publishableKey);
        throw new Error('Invalid or missing Medusa publishable key');
      }
      
      const response = await fetch(`${MEDUSA_CONFIG.baseUrl}/stripe-bypass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': publishableKey,
        },
        body: JSON.stringify({
          cart_id: cartId,
          email: email,  // ✅ FIX FIELD NAME
          shipping_address: shippingAddress,
          billing_address: billingAddress,
          items: items,
          amount: cart?.total || 0,
          currency_code: 'usd'
        })
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Request failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || `Bypass payment failed: ${response.status}`);
      }

      const data = await response.json()
      
      if (!data.success || !data.client_secret) {
        throw new Error(data.error || 'Bypass payment failed - no client secret')
      }

      return {
        success: true,
        clientSecret: data.client_secret,
        paymentIntentId: data.payment_intent_id,
        orderId: data.order_id,
        amount: data.amount,
        currency: data.currency
      }
    } catch (error) {
      console.error('Bypass Stripe payment creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bypass payment creation failed'
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