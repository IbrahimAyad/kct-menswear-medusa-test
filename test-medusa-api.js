// Direct test of Medusa API to check product handles
const MEDUSA_URL = 'https://backend-production-7441.up.railway.app';

async function testMedusaAPI() {
  try {
    console.log('Fetching products from Medusa backend...\n');

    const response = await fetch(`${MEDUSA_URL}/store/products?limit=5&offset=0`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-publishable-api-key': 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'
      }
    });

    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    const products = data.products || [];

    console.log(`Found ${products.length} products\n`);
    console.log('Product Handle Analysis:');
    console.log('=' .repeat(60));

    products.forEach((product, index) => {
      console.log(`\nProduct ${index + 1}:`);
      console.log(`  Title: ${product.title}`);
      console.log(`  Handle: ${product.handle || 'NO HANDLE - THIS IS THE PROBLEM!'}`);
      console.log(`  ID: ${product.id}`);
      console.log(`  Has Thumbnail: ${!!product.thumbnail}`);
      console.log(`  Variants: ${product.variants?.length || 0}`);

      // Check first variant price
      if (product.variants?.[0]) {
        const variant = product.variants[0];
        const price = variant.prices?.[0]?.amount;
        if (price) {
          console.log(`  Price: $${(price / 100).toFixed(2)}`);
        }
      }
    });

    // Check if any products are missing handles
    const missingHandles = products.filter(p => !p.handle);
    if (missingHandles.length > 0) {
      console.log('\n' + '!' .repeat(60));
      console.log('CRITICAL ISSUE: Products missing handles!');
      console.log(`${missingHandles.length} out of ${products.length} products have no handle`);
      console.log('These products will NOT be navigable on the frontend');
      console.log('!' .repeat(60));
    } else {
      console.log('\n✓ All products have handles');
    }

  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

testMedusaAPI();