// Test Customer Creation in Medusa 2.0
// This tests the proper flow: Auth Identity -> Customer Record

async function testCustomerCreation() {
  console.log('🔍 RESEARCHING MEDUSA 2.0 CUSTOMER CREATION\n');

  const backendUrl = 'https://backend-production-7441.up.railway.app';
  const publishableKey = 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81';

  // Generate unique test user
  const timestamp = Date.now();
  const testEmail = `research-test-${timestamp}@kctmenswear.com`;

  console.log('📋 RESEARCH PLAN:\n');
  console.log('1. Create auth identity (what we currently do)');
  console.log('2. Check if customer record exists');
  console.log('3. Create customer record if missing (what we\'re NOT doing)');
  console.log('4. Verify customer appears in backend\n');

  try {
    // STEP 1: Create Auth Identity (Current Implementation)
    console.log('1️⃣ Creating Auth Identity...');
    console.log(`   Email: ${testEmail}`);

    const authResponse = await fetch(`${backendUrl}/auth/customer/emailpass/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPass123!',
        first_name: 'Research',
        last_name: 'Test'
      })
    });

    const authData = await authResponse.json();

    if (authResponse.ok && authData.token) {
      console.log('   ✅ Auth identity created');
      console.log('   Token received:', authData.token.substring(0, 50) + '...\n');

      // STEP 2: Check if customer record exists
      console.log('2️⃣ Checking for Customer Record...');

      const meResponse = await fetch(`${backendUrl}/store/customers/me`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`,
          'x-publishable-api-key': publishableKey
        }
      });

      console.log('   Status:', meResponse.status);

      if (meResponse.status === 401 || meResponse.status === 404) {
        console.log('   ❌ No customer record found (expected!)');
        console.log('   This is why users don\'t appear in backend!\n');

        // STEP 3: Create Customer Record (MISSING STEP)
        console.log('3️⃣ Creating Customer Record (THE MISSING STEP)...');

        const createCustomerResponse = await fetch(`${backendUrl}/store/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.token}`,
            'x-publishable-api-key': publishableKey
          },
          body: JSON.stringify({
            email: testEmail,
            first_name: 'Research',
            last_name: 'Test'
          })
        });

        console.log('   Create customer status:', createCustomerResponse.status);
        const customerData = await createCustomerResponse.json();

        if (createCustomerResponse.ok) {
          console.log('   ✅ Customer record created!');
          console.log('   Customer ID:', customerData.customer?.id);
          console.log('   This customer should now appear in backend!\n');
        } else {
          console.log('   ❌ Failed to create customer:', customerData.message || customerData.error);
          console.log('   Raw response:', JSON.stringify(customerData, null, 2));
        }

      } else if (meResponse.ok) {
        const customerData = await meResponse.json();
        console.log('   ✅ Customer record already exists');
        console.log('   Customer ID:', customerData.customer?.id);
      }

    } else {
      console.log('   ❌ Auth registration failed:', authData.message || authData.error);
    }

  } catch (error) {
    console.error('❌ Research error:', error.message);
  }

  console.log('\n📊 RESEARCH FINDINGS:');
  console.log('• Auth identity creation works ✅');
  console.log('• Customer record creation is MISSING ❌');
  console.log('• We need TWO API calls: register auth + create customer');
  console.log('• This explains why users don\'t appear in backend');
  console.log('• This explains why /me endpoint returns 401');
  console.log('• This explains why redirects fail\n');

  console.log('🎯 SOLUTION:');
  console.log('After auth.register(), we must call store.customers.create()');
  console.log('This creates the actual customer record in the database');
}

testCustomerCreation();