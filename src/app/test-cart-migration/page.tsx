'use client'

import { useState, useEffect } from 'react'
import { useMedusaCart } from '@/hooks/useMedusaCart'
import { checkMedusaConnection } from '@/lib/medusa/client'
import { checkoutHandler } from '@/lib/medusa/checkout-handler'

export default function TestCartMigration() {
  const [connectionStatus, setConnectionStatus] = useState<any>(null)
  const [testResults, setTestResults] = useState<string[]>([])
  
  const {
    isInitialized,
    isLoading,
    error,
    medusaCart,
    zustandCart,
    addItem,
    removeItem,
    clearCart,
    syncFromZustand,
    itemCount,
    subtotal,
    total,
  } = useMedusaCart()

  // Check connection on mount
  useEffect(() => {
    checkMedusaConnection().then(setConnectionStatus)
  }, [])

  // Test functions
  const runTests = async () => {
    const results: string[] = []
    
    // Test 1: Connection
    results.push(`✅ Medusa Connected: ${connectionStatus?.connected}`)
    
    // Test 2: Cart Initialization
    results.push(`✅ Cart Initialized: ${isInitialized}`)
    results.push(`📋 Cart ID: ${medusaCart?.id || 'Not created'}`)
    
    // Test 3: Region
    results.push(`🌍 Region: ${medusaCart?.region?.name || 'Not set'}`)
    results.push(`💵 Currency: ${medusaCart?.region?.currency_code || 'Not set'}`)
    
    setTestResults(results)
  }

  // Test adding a product
  const testAddProduct = async () => {
    // Sample product based on your data
    const testProduct = {
      id: 'prod_01K3SNVX0C91W6Y9Y5S5YBE39M', // You'll need a real product ID
      name: 'Charcoal Double Breasted Suit',
      price: 799,
      images: [],
    }
    
    const result = await addItem(testProduct as any, '40R', 1)
    
    if (result.success) {
      setTestResults(prev => [...prev, '✅ Added product to cart'])
    } else {
      setTestResults(prev => [...prev, `❌ Failed to add product: ${result.error}`])
    }
  }

  // Test checkout URL
  const testCheckout = async () => {
    const result = await checkoutHandler.createCheckoutUrl('test@example.com')
    
    if (result.success) {
      setTestResults(prev => [...prev, `✅ Checkout URL: ${result.url}`])
    } else {
      setTestResults(prev => [...prev, `❌ Checkout failed: ${result.error}`])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Cart Migration Test Dashboard</h1>
        
        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${connectionStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>Medusa Backend: {connectionStatus?.connected ? 'Connected' : 'Disconnected'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span>Cart System: {isInitialized ? 'Ready' : 'Initializing...'}</span>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">
              Error: {error}
            </div>
          )}
        </div>

        {/* Cart Comparison */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Zustand Cart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Zustand Cart (Current)</h3>
            
            <div className="space-y-2 text-sm">
              <p>Items: {zustandCart.length}</p>
              <div className="border-t pt-2">
                {zustandCart.map((item: any, idx: number) => (
                  <div key={idx} className="py-1">
                    {item.name} - Size: {item.size} - Qty: {item.quantity}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Medusa Cart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Medusa Cart (New)</h3>
            
            <div className="space-y-2 text-sm">
              <p>Cart ID: {medusaCart?.id?.slice(0, 8)}...</p>
              <p>Items: {itemCount}</p>
              <p>Subtotal: ${(subtotal / 100).toFixed(2)}</p>
              <p>Total: ${(total / 100).toFixed(2)}</p>
              
              <div className="border-t pt-2">
                {medusaCart?.items?.map((item: any) => (
                  <div key={item.id} className="py-1">
                    {item.variant?.product?.title} - {item.variant?.title} - Qty: {item.quantity}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Test Actions</h3>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={runTests}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={isLoading}
            >
              Run Connection Tests
            </button>
            
            <button
              onClick={testAddProduct}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={isLoading || !isInitialized}
            >
              Test Add Product
            </button>
            
            <button
              onClick={syncFromZustand}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              disabled={isLoading || !isInitialized}
            >
              Sync Zustand → Medusa
            </button>
            
            <button
              onClick={clearCart}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              disabled={isLoading || !isInitialized}
            >
              Clear Cart
            </button>
            
            <button
              onClick={testCheckout}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              disabled={isLoading || !isInitialized || itemCount === 0}
            >
              Test Checkout
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>
            
            <div className="space-y-1 font-mono text-sm">
              {testResults.map((result, idx) => (
                <div key={idx}>{result}</div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
            Processing...
          </div>
        )}
      </div>
    </div>
  )
}