async function testSignupCORS() {
  console.log('Testing Signup with CORS...\n')

  const backendUrl = 'https://backend-production-7441.up.railway.app'
  const publishableKey = 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'

  // Generate unique email for test
  const timestamp = Date.now()
  const testUser = {
    email: `test${timestamp}@kctmenswear.com`,
    password: 'Test12345!',
    first_name: 'Test',
    last_name: 'User'
  }

  try {
    console.log('Testing signup with:', testUser.email)

    // Test registration endpoint
    const response = await fetch(`${backendUrl}/auth/customer/emailpass/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey
      },
      body: JSON.stringify(testUser)
    })

    console.log('\nResponse status:', response.status)
    console.log('CORS Headers:')
    console.log('  Access-Control-Allow-Origin:', response.headers.get('access-control-allow-origin'))

    const data = await response.json()

    if (response.ok || response.status === 200) {
      console.log('\n✅ Registration successful!')
      console.log('Response:', data)

      // Now try to login
      console.log('\nTesting login with new account...')
      const loginResponse = await fetch(`${backendUrl}/auth/customer/emailpass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': publishableKey
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      })

      console.log('Login status:', loginResponse.status)
      const loginData = await loginResponse.json()

      if (loginResponse.ok) {
        console.log('✅ Login successful! Token:', loginData.token ? 'Received' : 'Not received')
      } else {
        console.log('❌ Login failed:', loginData)
      }

    } else {
      console.log('\n❌ Registration failed:', data)
    }

  } catch (error: any) {
    console.error('\n❌ Test failed:', error?.message || error)
  }
}

testSignupCORS()