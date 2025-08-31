'use client'

import { useState, useEffect } from 'react'
import { cartAdapter } from '@/lib/medusa/cart-adapter'
import { medusa } from '@/lib/medusa/client'

export default function TestPaymentProviders() {
  const [providers, setProviders] = useState<any>(null)
  const [regions, setRegions] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Test 1: Get regions
        console.log('Fetching regions...')
        const regionsResponse = await medusa.store.region.list()
        console.log('Regions response:', regionsResponse)
        setRegions(regionsResponse)

        // Test 2: Get payment providers using cart adapter
        console.log('Getting payment providers via cart adapter...')
        const providersResult = await cartAdapter.getPaymentProviders()
        console.log('Cart adapter providers result:', providersResult)
        
        // Test 3: Try direct API call for each region
        const providersByRegion: any = {}
        if (regionsResponse?.regions) {
          for (const region of regionsResponse.regions) {
            console.log(`Fetching providers for region ${region.id}...`)
            try {
              const regionProviders = await medusa.store.payment.listPaymentProviders({
                region_id: region.id
              })
              console.log(`Providers for region ${region.id}:`, regionProviders)
              providersByRegion[region.id] = regionProviders
            } catch (err) {
              console.error(`Failed to get providers for region ${region.id}:`, err)
              providersByRegion[region.id] = { error: String(err) }
            }
          }
        }

        setProviders({
          cartAdapter: providersResult,
          byRegion: providersByRegion
        })
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err?.message || 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-4">Testing Payment Providers</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Payment Providers Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Regions */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Available Regions</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(regions, null, 2)}
          </pre>
        </section>

        {/* Providers from Cart Adapter */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Providers via Cart Adapter</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(providers?.cartAdapter, null, 2)}
          </pre>
        </section>

        {/* Providers by Region */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Providers by Region</h2>
          {regions?.regions?.map((region: any) => (
            <div key={region.id} className="mb-4">
              <h3 className="font-medium">Region: {region.name} ({region.id})</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto mt-2">
                {JSON.stringify(providers?.byRegion?.[region.id], null, 2)}
              </pre>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}