// Fix existing account - Add customer record for kctmenswear@gmail.com

async function fixExistingAccount() {
  console.log('🔧 FIXING EXISTING ACCOUNT: kctmenswear@gmail.com\n');

  const backendUrl = 'https://backend-production-7441.up.railway.app';
  const publishableKey = 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81';

  try {
    // Step 1: Login to get token
    console.log('1️⃣ Logging in to get auth token...');

    const loginResponse = await fetch(`${backendUrl}/auth/customer/emailpass`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey
      },
      body: JSON.stringify({
        email: 'kctmenswear@gmail.com',
        password: 'theking13'
      })
    });

    const loginData = await loginResponse.json();

    if (loginResponse.ok && loginData.token) {
      console.log('   ✅ Login successful');
      console.log('   Token:', loginData.token.substring(0, 50) + '...\n');

      // Step 2: Check if customer exists
      console.log('2️⃣ Checking if customer record exists...');

      const meResponse = await fetch(`${backendUrl}/store/customers/me`, {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'x-publishable-api-key': publishableKey
        }
      });

      if (meResponse.status === 401 || meResponse.status === 404) {
        console.log('   ❌ No customer record found\n');

        // Step 3: Create customer record
        console.log('3️⃣ Creating customer record...');

        const createResponse = await fetch(`${backendUrl}/store/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginData.token}`,
            'x-publishable-api-key': publishableKey
          },
          body: JSON.stringify({
            email: 'kctmenswear@gmail.com',
            first_name: 'KCT',
            last_name: 'Menswear'
          })
        });

        const createData = await createResponse.json();

        if (createResponse.ok) {
          console.log('   ✅ Customer record created!');
          console.log('   Customer ID:', createData.customer?.id);
          console.log('   Email:', createData.customer?.email);
          console.log('\n✨ Account fixed! Login will now work properly.');
        } else {
          console.log('   ❌ Failed to create customer:', createData);
        }

      } else if (meResponse.ok) {
        const customerData = await meResponse.json();
        console.log('   ✅ Customer record already exists!');
        console.log('   Customer ID:', customerData.customer?.id);
        console.log('   No fix needed.');
      }

    } else {
      console.log('   ❌ Login failed:', loginData);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixExistingAccount();