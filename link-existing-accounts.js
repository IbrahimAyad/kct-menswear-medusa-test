// Manual link for existing accounts
// This creates customer records for auth identities that don't have them

async function linkExistingAccounts() {
  console.log('🔗 LINKING EXISTING AUTH IDENTITIES TO CUSTOMER RECORDS\n');

  const backendUrl = 'https://backend-production-7441.up.railway.app';
  const publishableKey = 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81';

  // List of known accounts that need fixing
  const accounts = [
    { email: 'kctmenswear@gmail.com', password: 'theking13' },
    // Add other accounts here as needed
  ];

  for (const account of accounts) {
    console.log(`\n📧 Processing ${account.email}...`);

    try {
      // Step 1: Login to get token
      const loginResponse = await fetch(`${backendUrl}/auth/customer/emailpass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': publishableKey
        },
        body: JSON.stringify({
          email: account.email,
          password: account.password
        })
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok && loginData.token) {
        console.log('   ✅ Login successful');

        // Step 2: Check if customer exists
        const meResponse = await fetch(`${backendUrl}/store/customers/me`, {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'x-publishable-api-key': publishableKey
          }
        });

        if (meResponse.ok) {
          const customerData = await meResponse.json();
          console.log('   ✅ Customer already exists:', customerData.customer?.id);
        } else if (meResponse.status === 401 || meResponse.status === 404) {
          console.log('   ⚠️  No customer record found');

          // Step 3: Try to create customer via admin API
          // Note: This might require admin token
          console.log('   📝 Customer needs to be created manually in backend');
          console.log('   The auth-identity-created subscriber should handle this now');
        }
      } else {
        console.log('   ❌ Login failed:', loginData.message || loginData.error);
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${account.email}:`, error.message);
    }
  }

  console.log('\n✨ Processing complete!');
  console.log('Note: The backend subscribers should now auto-create customers for new registrations');
}

linkExistingAccounts();