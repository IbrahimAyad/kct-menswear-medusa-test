import { NextRequest, NextResponse } from 'next/server'
import { medusa } from '@/lib/medusa/client'

export async function POST(request: NextRequest) {
  try {
    const { cartId } = await request.json()
    
    if (!cartId) {
      return NextResponse.json({ 
        error: 'Cart ID is required' 
      }, { status: 400 })
    }

    // Get available payment providers
    const providers = await medusa.store.payment.listPaymentProviders()
    
    return NextResponse.json({
      success: true,
      providers: providers.map((p: any) => ({
        id: p.id,
        is_enabled: p.is_enabled,
      }))
    })
  } catch (error) {
    console.error('Payment providers API error:', error)
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to get payment providers',
      success: false 
    }, { status: 500 })
  }
}