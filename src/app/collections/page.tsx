'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { MasterCollectionPage } from '@/components/collections/MasterCollectionPage';
import { fetchMedusaProductsPaginated, getMedusaDisplayPrice, type MedusaProduct } from '@/services/medusaBackendService';

// All categories with updated images and dynamic counts
const allCategories = [
  {
    id: 'suits',
    name: 'Suits',
    image: 'https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/kct-prodcuts/suits/navy/navy-main-2.jpg',
    count: 0, // Will be updated dynamically
    description: 'Complete suit collections'
  },
  {
    id: 'shirts',
    name: 'Shirts',
    image: 'https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/kct-prodcuts/shirts/classic-fit-collection.jpg',
    count: 0,
    description: 'Dress shirts and casual shirts'
  },
  {
    id: 'vest',
    name: 'Vests',
    image: 'https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/kct-prodcuts/Spring%20Wedding%20Bundles/dusty-sage-vest-tie.png',
    count: 0,
    description: 'Formal and casual vests'
  },
  {
    id: 'jackets',
    name: 'Jackets',
    image: 'https://cdn.kctmenswear.com/blazers/prom/mens-red-floral-pattern-prom-blazer/front.webp',
    count: 0,
    description: 'Blazers and sport coats'
  },
  {
    id: 'pants',
    name: 'Shirt & Tie',
    image: 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/dd5c1f7d-722d-4e17-00be-60a3fdb33900/public',
    count: 0,
    description: 'Dress pants and trousers'
  },
  {
    id: 'knitwear',
    name: 'Knitwear',
    image: 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/9ac91a19-5951-43d4-6a98-c9d658765c00/public',
    count: 0,
    description: 'Sweaters and knit tops'
  },
  {
    id: 'accessories',
    name: 'Accessories',
    image: 'https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/kct-prodcuts/3000-MM%20(Burgundy)/mm-burgundy-bowtie.jpg',
    count: 0,
    description: 'Ties, belts, and more'
  },
  {
    id: 'shoes',
    name: 'Shoes',
    image: 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/7d203d2a-63b7-46d3-9749-1f203e4ccc00/public',
    count: 0,
    description: 'Dress shoes and boots'
  }
];

function CollectionsContent() {
  const [products, setProducts] = useState<MedusaProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allProductsLoaded, setAllProductsLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch Medusa products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load first page
        const firstBatch = await fetchMedusaProductsPaginated(1, 50);
        setProducts(firstBatch.products);
        
        // Load remaining pages in background
        if (firstBatch.totalPages > 1) {
          const remainingPages = [];
          for (let page = 2; page <= Math.min(firstBatch.totalPages, 10); page++) {
            remainingPages.push(fetchMedusaProductsPaginated(page, 50));
          }
          
          const results = await Promise.all(remainingPages);
          const allProducts = [
            ...firstBatch.products,
            ...results.flatMap(r => r.products)
          ];
          setProducts(allProducts);
        }
        
        setAllProductsLoaded(true);
      } catch (err) {
        console.error('Failed to fetch Medusa products:', err);
        setError('Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  // Calculate category counts
  const categoriesWithCounts = useMemo(() => {
    if (!products || products.length === 0) return allCategories;
    
    return allCategories.map(category => {
      const count = products.filter(product => {
        const productTitle = product.title?.toLowerCase() || '';
        const productHandle = product.handle?.toLowerCase() || '';
        const categoryId = category.id.toLowerCase();
        
        // Match logic for different categories based on title/handle
        if (categoryId === 'suits') {
          return productTitle.includes('suit') || 
                 productHandle.includes('suit') ||
                 productTitle.includes('tuxedo') ||
                 productTitle.includes('blazer');
        }
        if (categoryId === 'shirts') {
          return productTitle.includes('shirt') || productHandle.includes('shirt');
        }
        if (categoryId === 'vest') {
          return productTitle.includes('vest') || productHandle.includes('vest');
        }
        if (categoryId === 'jackets') {
          return productTitle.includes('jacket') || 
                 productTitle.includes('blazer') ||
                 productTitle.includes('coat');
        }
        if (categoryId === 'pants') {
          return productTitle.includes('pant') || 
                 productTitle.includes('trouser');
        }
        if (categoryId === 'knitwear') {
          return productTitle.includes('knit') || 
                 productTitle.includes('sweater') ||
                 productTitle.includes('cardigan');
        }
        if (categoryId === 'accessories') {
          return productTitle.includes('tie') || 
                 productTitle.includes('bow') ||
                 productTitle.includes('belt') ||
                 productTitle.includes('suspender') ||
                 productTitle.includes('pocket') ||
                 productTitle.includes('cufflink');
        }
        if (categoryId === 'shoes') {
          return productTitle.includes('shoe') || 
                 productTitle.includes('boot');
        }
        
        return false;
      }).length;
      
      return { ...category, count };
    });
  }, [products]);

  // Transform Medusa products for MasterCollectionPage
  const transformedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    return products.map((product: MedusaProduct) => {
      const productTitle = product.title?.toLowerCase() || '';
      const price = getMedusaDisplayPrice(product);
      
      return {
        id: product.id,
        name: product.title,
        handle: product.handle,
        price: price,
        originalPrice: price > 100 ? Math.round(price * 1.2) : undefined,
        image: product.thumbnail || product.images?.[0]?.url || '/placeholder-product.jpg',
        hoverImage: product.images?.[1]?.url,
        category: productTitle.includes('suit') ? 'suits' :
                  productTitle.includes('shirt') ? 'shirts' :
                  productTitle.includes('vest') ? 'vest' :
                  productTitle.includes('jacket') || productTitle.includes('blazer') ? 'jackets' :
                  productTitle.includes('pant') ? 'pants' :
                  productTitle.includes('knit') || productTitle.includes('sweater') ? 'knitwear' :
                  productTitle.includes('tie') || productTitle.includes('belt') ? 'accessories' :
                  productTitle.includes('shoe') ? 'shoes' : 'other',
        tags: [],
        isNew: false,
        isSale: false
      };
    });
  }, [products]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black mx-auto"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Collections</h2>
          <p className="text-gray-600 animate-pulse">Fetching products from our catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <MasterCollectionPage
      title="Master Collection"
      subtitle="COMPLETE MENSWEAR"
      description="Precision-tailored pieces in timeless colors enhance every part of a man's wardrobe"
      categories={categoriesWithCounts}
      products={transformedProducts}
      heroImage="https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/kct-prodcuts/suits/navy/navy-3-main.jpg"
    />
  );
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-burgundy mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-burgundy rounded-full animate-pulse"></div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Collections</h2>
          <p className="text-gray-600 animate-pulse">Preparing your shopping experience...</p>
        </div>
      </div>
    }>
      <CollectionsContent />
    </Suspense>
  );
}