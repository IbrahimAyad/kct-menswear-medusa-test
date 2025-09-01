import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, shipping, items, total } = body

    // Generate a test order ID
    const orderId = `TEST_ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Log the order for testing
    console.log('Test Mode Order Created:', {
      orderId,
      email,
      shipping,
      items,
      total
    })

    // Return a test success response
    return NextResponse.json({
      success: true,
      orderId,
      message: 'Test order created successfully',
      testMode: true,
      redirectUrl: `/checkout/success?order_id=${orderId}&test_mode=true`
    })
  } catch (error: any) {
    console.error('Test checkout error:', error)
    return NextResponse.json(
      { error: error?.message || 'Test checkout failed' },
      { status: 500 }
    )
  }
}