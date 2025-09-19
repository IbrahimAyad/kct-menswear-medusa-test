import { medusa } from '@/lib/medusa/client'

async function testMedusaAuth() {
  console.log('Testing Medusa Auth Methods...\n')

  // Log available methods
  console.log('medusa.auth methods:', Object.keys(medusa.auth || {}))
  console.log('medusa.customer methods:', Object.keys(medusa.customer || {}))
  console.log('medusa.store methods:', Object.keys(medusa.store || {}))

  // Check if admin exists
  if (medusa.admin) {
    console.log('medusa.admin.auth methods:', Object.keys(medusa.admin.auth || {}))
  }

  // Test actual auth API endpoints
  const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://backend-production-7441.up.railway.app"

  console.log('\nTesting auth endpoints directly...')

  // Test registration endpoint
  console.log('\n1. Testing registration endpoint...')
  const registerResponse = await fetch(`${baseUrl}/auth/customer/emailpass/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'test@kctmenswear.com',
      password: 'Test12345!',
      first_name: 'Test',
      last_name: 'User'
    })
  })

  console.log('Registration response status:', registerResponse.status)
  const registerData = await registerResponse.json()
  console.log('Registration response:', registerData)

  // Test login endpoint
  console.log('\n2. Testing login endpoint...')
  const loginResponse = await fetch(`${baseUrl}/auth/customer/emailpass`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'test@kctmenswear.com',
      password: 'Test12345!'
    })
  })

  console.log('Login response status:', loginResponse.status)
  const loginData = await loginResponse.json()
  console.log('Login response:', loginData)
}

testMedusaAuth().catch(console.error)