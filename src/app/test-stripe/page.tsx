'use client'

import { useState } from 'react'
import { medusa } from '@/lib/medusa/client'

export default function TestStripe() {
  const [status, setStatus] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    const results: any = {}
    
    try {
      // Test 1: Get regions
      const regions = await medusa.store.region.list()
      results.regions = regions.regions?.map((r: any) => ({
        id: r.id,
        name: r.name,
        currency_code: r.currency_code
      }))
      
      // Test 2: Get payment providers for US region
      const providers = await medusa.store.payment.listPaymentProviders({
        region_id: 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD'
      })
      results.providers = providers.payment_providers
      
      // Test 3: Check for Stripe
      results.stripeAvailable = providers.payment_providers?.some(
        (p: any) => p.id === 'pp_stripe_stripe'
      )
      
      results.success = true
    } catch (error: any) {
      results.error = error.message
      results.success = false
    }
    
    setStatus(results)
    setLoading(false)
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Stripe Integration Test</h1>
      
      <button
        onClick={runTest}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Run Test'}
      </button>
      
      {status.success !== undefined && (
        <div className="mt-6">
          <div className={`p-4 rounded ${status.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <h2 className="font-bold mb-2">
              {status.success ? '✅ Stripe is Available!' : '❌ Test Failed'}
            </h2>
            
            {status.stripeAvailable && (
              <p className="text-green-700 font-medium">
                Stripe provider (pp_stripe_stripe) is ready for checkout!
              </p>
            )}
            
            {status.regions && (
              <div className="mt-4">
                <h3 className="font-semibold">Regions:</h3>
                <pre className="bg-white p-2 rounded mt-1 text-sm">
                  {JSON.stringify(status.regions, null, 2)}
                </pre>
              </div>
            )}
            
            {status.providers && (
              <div className="mt-4">
                <h3 className="font-semibold">Payment Providers:</h3>
                <pre className="bg-white p-2 rounded mt-1 text-sm">
                  {JSON.stringify(status.providers, null, 2)}
                </pre>
              </div>
            )}
            
            {status.error && (
              <p className="text-red-700 mt-2">Error: {status.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}