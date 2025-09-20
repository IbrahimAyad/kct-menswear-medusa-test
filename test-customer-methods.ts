import { medusa } from './src/lib/medusa/client'

async function testCustomerMethods() {
  console.log('🔍 Checking Medusa SDK Customer Methods\n')

  const backendUrl = 'https://backend-production-7441.up.railway.app'
  const publishableKey = 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'

  try {
    // Check available methods on customer object
    console.log('Available customer methods:')
    if (medusa.store.customer) {
      console.log(Object.keys(medusa.store.customer))
      console.log('\nCustomer object:', medusa.store.customer)
    } else {
      console.log('No customer object found on medusa.store')
    }

    // Try direct API call to create customer
    console.log('\n📋 Testing Direct API Customer Creation:')

    // First login to get token
    const loginResult = await medusa.auth.login(
      "customer",
      "emailpass",
      {
        email: 'kctmenswear@gmail.com',
        password: 'theking13'
      }
    )

    const token = loginResult.token || loginResult
    console.log('✅ Got token:', token.substring(0, 50) + '...')

    // Try to create customer via direct API
    console.log('\n🔨 Attempting to create customer via API...')
    const createResponse = await fetch(`${backendUrl}/store/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-publishable-api-key': publishableKey
      },
      body: JSON.stringify({
        email: 'kctmenswear@gmail.com',
        first_name: 'KCT',
        last_name: 'Menswear'
      })
    })

    console.log('Create customer response status:', createResponse.status)
    const createData = await createResponse.json()
    console.log('Create customer response:', createData)

    // Check if medusa.store.customer.create exists
    if (medusa.store.customer?.create) {
      console.log('\n✅ medusa.store.customer.create method exists!')

      // Try using it
      const result = await medusa.store.customer.create({
        email: 'kctmenswear@gmail.com',
        first_name: 'KCT',
        last_name: 'Menswear'
      })
      console.log('SDK create result:', result)
    } else {
      console.log('\n❌ medusa.store.customer.create method does NOT exist')
      console.log('We need to use direct API calls instead')
    }

  } catch (error: any) {
    console.error('Error:', error.message)
  }
}

testCustomerMethods()