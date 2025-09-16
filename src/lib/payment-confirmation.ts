/**
 * Payment Confirmation Utilities
 * Handles client-side payment confirmation with retry logic
 */

interface ConfirmPaymentOptions {
  payment_intent_id: string
  order_id: string
  maxRetries?: number
  retryDelay?: number
}

interface ConfirmPaymentResult {
  success: boolean
  message?: string
  order?: {
    id: string
    payment_status: string
    payment_captured: boolean
    confirmed_at?: string
  }
  error?: string
}

/**
 * Confirms a payment with the backend, including retry logic
 * @param options Payment confirmation options
 * @returns Confirmation result
 */
export async function confirmPaymentWithRetry(
  options: ConfirmPaymentOptions
): Promise<ConfirmPaymentResult> {
  const { 
    payment_intent_id, 
    order_id, 
    maxRetries = 3, 
    retryDelay = 1000 
  } = options

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Payment Confirmation] Attempt ${attempt} of ${maxRetries}`)
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/checkout/confirm-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
          },
          body: JSON.stringify({
            payment_intent_id,
            order_id
          }),
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        console.log('[Payment Confirmation] ✅ Payment confirmed successfully')
        return {
          success: true,
          message: data.message,
          order: data.order
        }
      }

      // If payment was already captured, that's still a success
      if (data.message === 'Payment already confirmed') {
        console.log('[Payment Confirmation] Payment was already confirmed')
        return {
          success: true,
          message: data.message,
          order: data.order
        }
      }

      // If we got an error but it's not a network error, don't retry
      if (response.status >= 400 && response.status < 500) {
        console.error('[Payment Confirmation] Client error, not retrying:', data.error)
        return {
          success: false,
          error: data.error || 'Failed to confirm payment'
        }
      }

      // Server error, will retry
      lastError = new Error(data.error || `Server error: ${response.status}`)
      
    } catch (error: any) {
      console.error(`[Payment Confirmation] Network error on attempt ${attempt}:`, error)
      lastError = error
    }

    // Wait before retrying (except on last attempt)
    if (attempt < maxRetries) {
      console.log(`[Payment Confirmation] Waiting ${retryDelay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
    }
  }

  // All retries failed
  console.error('[Payment Confirmation] All retry attempts failed')
  return {
    success: false,
    error: lastError?.message || 'Failed to confirm payment after multiple attempts'
  }
}

/**
 * Polls the payment status to check if it's been confirmed
 * Useful as a fallback if the initial confirmation fails
 */
export async function pollPaymentStatus(
  payment_intent_id: string,
  order_id: string,
  maxAttempts: number = 10,
  interval: number = 2000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/checkout/confirm-payment?` +
        `payment_intent_id=${payment_intent_id}&order_id=${order_id}`,
        {
          headers: {
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.order?.payment_captured === true) {
          console.log('[Payment Status] Payment has been captured')
          return true
        }
      }
    } catch (error) {
      console.error('[Payment Status] Error checking status:', error)
    }

    if (i < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, interval))
    }
  }

  return false
}

/**
 * Ensures payment is confirmed, using multiple strategies
 * 1. Try to confirm immediately
 * 2. If that fails, poll for status (webhook might have processed it)
 * 3. Return result
 */
export async function ensurePaymentConfirmed(
  payment_intent_id: string,
  order_id: string
): Promise<ConfirmPaymentResult> {
  // First, try to confirm the payment
  const confirmResult = await confirmPaymentWithRetry({
    payment_intent_id,
    order_id
  })

  if (confirmResult.success) {
    return confirmResult
  }

  // If confirmation failed, check if webhook already processed it
  console.log('[Payment Confirmation] Direct confirmation failed, checking status...')
  const isConfirmed = await pollPaymentStatus(
    payment_intent_id,
    order_id,
    5, // Check 5 times
    2000 // Every 2 seconds
  )

  if (isConfirmed) {
    return {
      success: true,
      message: 'Payment confirmed via webhook',
      order: {
        id: order_id,
        payment_status: 'captured',
        payment_captured: true
      }
    }
  }

  // Payment confirmation failed completely
  return confirmResult
}