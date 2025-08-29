// Quick test script to check if the unified API is working
fetch('http://localhost:3000/api/products/unified')
  .then(res => {
    console.log('Status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
    console.log('Products count:', data.products?.length || 0);
    console.log('Total count:', data.totalCount || 0);
  })
  .catch(err => {
    console.error('Error:', err);
  });