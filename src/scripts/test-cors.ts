async function testCORS() {
  console.log('Testing CORS configuration...\n')

  const backendUrl = 'https://backend-production-7441.up.railway.app'
  const vercelOrigin = 'https://kct-menswear-medusa-test.vercel.app'

  // Test user credentials
  const testUser = {
    email: 'kctmenswear@gmail.com',
    password: 'Test12345!'
  }

  try {
    console.log('Testing from origin:', vercelOrigin)
    console.log('Backend URL:', backendUrl)

    // Test login endpoint with CORS headers
    const response = await fetch(`${backendUrl}/auth/customer/emailpass`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': vercelOrigin,
        'x-publishable-api-key': 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'
      },
      body: JSON.stringify(testUser)
    })

    console.log('Response status:', response.status)
    console.log('Response headers:')
    console.log('  Access-Control-Allow-Origin:', response.headers.get('access-control-allow-origin'))
    console.log('  Access-Control-Allow-Credentials:', response.headers.get('access-control-allow-credentials'))

    if (response.ok) {
      const data = await response.json()
      console.log('\n✅ CORS is working! Login successful')
      console.log('Token received:', data.token ? 'Yes' : 'No')
    } else {
      console.log('\n❌ Request failed with status:', response.status)
      const text = await response.text()
      console.log('Response:', text)
    }

  } catch (error: any) {
    console.error('\n❌ CORS test failed:', error?.message || error)
  }
}

testCORS()