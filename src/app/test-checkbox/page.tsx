'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

export default function TestCheckboxPage() {
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})

  const handleCheckboxChange = (checked: any) => {
    console.log('Raw checked value:', checked)
    console.log('Type of checked:', typeof checked)
    console.log('checked === true:', checked === true)
    console.log('Boolean(checked):', Boolean(checked))
    console.log('!!checked:', !!checked)

    const newValue = checked === true

    setDebugInfo({
      raw: checked,
      type: typeof checked,
      equalsTrue: checked === true,
      boolean: Boolean(checked),
      double: !!checked,
      newValue
    })

    setAcceptTerms(newValue)
    console.log('Setting acceptTerms to:', newValue)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Checkbox Debug Test</h1>

      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Current State:</h2>
          <p>acceptTerms: <strong>{acceptTerms ? 'true' : 'false'}</strong></p>
          <p>Type: <strong>{typeof acceptTerms}</strong></p>
        </div>

        <div className="p-4 bg-blue-50 rounded">
          <h2 className="font-bold mb-2">Debug Info:</h2>
          <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={acceptTerms}
            onCheckedChange={handleCheckboxChange}
          />
          <label htmlFor="terms" className="cursor-pointer">
            I agree to the terms
          </label>
        </div>

        <Button
          disabled={!acceptTerms}
          className="w-full"
        >
          Submit (Enabled: {acceptTerms ? 'Yes' : 'No'})
        </Button>

        <div className="mt-4 p-4 bg-yellow-50 rounded">
          <h3 className="font-bold mb-2">Alternative Handlers:</h3>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="alt1"
                checked={acceptTerms}
                onCheckedChange={(checked) => {
                  console.log('Alt1:', checked)
                  setAcceptTerms(!!checked)
                }}
              />
              <label htmlFor="alt1">Using !!checked</label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="alt2"
                checked={acceptTerms}
                onCheckedChange={(checked) => {
                  console.log('Alt2:', checked)
                  setAcceptTerms(Boolean(checked))
                }}
              />
              <label htmlFor="alt2">Using Boolean(checked)</label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="alt3"
                checked={acceptTerms}
                onCheckedChange={(checked) => {
                  console.log('Alt3:', checked)
                  setAcceptTerms(checked ? true : false)
                }}
              />
              <label htmlFor="alt3">Using checked ? true : false</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}