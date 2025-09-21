import { NextRequest, NextResponse } from 'next/server'
import { medusa } from '@/lib/medusa/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cartId, email, shipping } = body

    // Step 1: Update cart with customer information
    try {
      await medusa.store.cart.update(cartId, {
        email,
        shipping_address: {
          first_name: shipping.firstName,
          last_name: shipping.lastName,
          address_1: shipping.address,
          city: shipping.city,
          province: shipping.state,
          postal_code: shipping.postalCode,
          country_code: 'us',
          phone: shipping.phone || ''
        },
        billing_address: {
          first_name: shipping.firstName,
          last_name: shipping.lastName,
          address_1: shipping.address,
          city: shipping.city,
          province: shipping.state,
          postal_code: shipping.postalCode,
          country_code: 'us',
          phone: shipping.phone || ''
        }
      })
    } catch (error) {
      console.error('Failed to update cart addresses:', error)
    }

    // Step 2: Complete the cart to create an order
    try {
      const response = await medusa.store.cart.complete(cartId)
      
      // The response contains the completed cart, which becomes an order
      const completedCart = response as any
      
      return NextResponse.json({
        success: true,
        orderId: completedCart.id,
        orderNumber: completedCart.display_id || completedCart.id,
        total: completedCart.total,
        redirectUrl: `/checkout/success?order_id=${completedCart.id}`
      })
    } catch (completeError: any) {
      // If cart completion fails, return error details
      console.error('Cart completion failed:', completeError)
      
      // Try to get more error details
      const errorMessage = completeError?.response?.data?.message || 
                          completeError?.message || 
                          'Failed to complete checkout'
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: completeError?.response?.data || {}
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error?.message || 'Checkout failed',
        details: error?.response?.data || {}
      },
      { status: 500 }
    )
  }
}