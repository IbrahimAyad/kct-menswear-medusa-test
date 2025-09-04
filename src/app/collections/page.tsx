'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { MasterCollectionPage } from '@/components/collections/MasterCollectionPage';
import { CollectionSkeleton } from '@/components/collections/CollectionSkeleton';
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
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<MedusaProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allProductsLoaded, setAllProductsLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Medusa products only after mount
  useEffect(() => {
    if (!mounted) return;
    
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load only 12 products initially for super fast load
        const firstBatch = await fetchMedusaProductsPaginated(1, 12);
        setProducts(firstBatch.products);
        setLoading(false); // Show initial products immediately
        
        // Load next batch in background
        if (firstBatch.totalPages > 1) {
          setTimeout(async () => {
            const secondBatch = await fetchMedusaProductsPaginated(2, 24);
            setProducts(prev => [...prev, ...secondBatch.products]);
            
            // Load remaining pages progressively
            if (firstBatch.totalPages > 2) {
              for (let page = 3; page <= Math.min(firstBatch.totalPages, 6); page++) {
                await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between loads
                const batch = await fetchMedusaProductsPaginated(page, 24);
                setProducts(prev => [...prev, ...batch.products]);
              }
            }
            setAllProductsLoaded(true);
          }, 100); // Small delay to ensure UI renders first
        } else {
          setAllProductsLoaded(true);
        }
      } catch (err) {
        console.error('Failed to fetch Medusa products:', err);
        setError('Failed to fetch products');
      } finally {
        // Loading is set to false earlier for faster perceived performance
      }
    };
    
    loadProducts();
  }, [mounted]);

  // Calculate category counts
  const categoriesWithCounts = useMemo(() => {
    if (!products || products.length === 0) return allCategories;
    
    return allCategories.map(category => {
      const count = products.filter(product => {
        const productTitle = product.title?.toLowerCase() || '';
        const productHandle = product.handle?.toLowerCase() || '';
        const combinedText = `${productTitle} ${productHandle}`;
        const categoryId = category.id.toLowerCase();
        
        // More comprehensive matching patterns
        if (categoryId === 'suits') {
          return combinedText.match(/\b(suit|tuxedo|2-piece|3-piece|two.?piece|three.?piece)\b/);
        }
        if (categoryId === 'shirts') {
          return combinedText.match(/\b(shirt|dress.?shirt|button.?up|oxford|formal.?shirt)\b/) &&
                 !combinedText.includes('tie');
        }
        if (categoryId === 'vest') {
          return combinedText.match(/\b(vest|waistcoat)\b/);
        }
        if (categoryId === 'jackets') {
          // Match blazers and jackets but exclude suits
          return combinedText.match(/\b(blazer|jacket|sport.?coat|dinner.?jacket)\b/) &&
                 !combinedText.match(/\b(suit|2-piece|3-piece)\b/);
        }
        if (categoryId === 'pants') {
          // This category seems to be for "Shirt & Tie" based on the UI
          // Let's match shirt and tie combinations
          return combinedText.includes('shirt') && combinedText.includes('tie') ||
                 combinedText.match(/\b(combo|combination|set)\b/);
        }
        if (categoryId === 'knitwear') {
          return combinedText.match(/\b(knit|sweater|cardigan|pullover|jumper)\b/);
        }
        if (categoryId === 'accessories') {
          return combinedText.match(/\b(tie|bowtie|bow.?tie|necktie|belt|suspender|cufflink|pocket.?square|handkerchief)\b/) &&
                 !combinedText.includes('shirt');
        }
        if (categoryId === 'shoes') {
          return combinedText.match(/\b(shoe|oxford|loafer|boot|derby|brogue|sneaker)\b/);
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
      const productHandle = product.handle?.toLowerCase() || '';
      const combinedText = `${productTitle} ${productHandle}`;
      const price = getMedusaDisplayPrice(product);
      
      // Determine category with same logic as counting
      let category = 'other';
      if (combinedText.match(/\b(suit|tuxedo|2-piece|3-piece)\b/)) {
        category = 'suits';
      } else if (combinedText.match(/\b(blazer|jacket|sport.?coat)\b/) && !combinedText.includes('suit')) {
        category = 'jackets';
      } else if (combinedText.match(/\b(shirt|dress.?shirt)\b/) && !combinedText.includes('tie')) {
        category = 'shirts';
      } else if (combinedText.match(/\b(vest|waistcoat)\b/)) {
        category = 'vest';
      } else if (combinedText.includes('shirt') && combinedText.includes('tie')) {
        category = 'pants'; // This is "Shirt & Tie" category
      } else if (combinedText.match(/\b(tie|bowtie|belt|suspender|cufflink|pocket.?square)\b/)) {
        category = 'accessories';
      } else if (combinedText.match(/\b(knit|sweater|cardigan)\b/)) {
        category = 'knitwear';
      } else if (combinedText.match(/\b(shoe|oxford|loafer|boot)\b/)) {
        category = 'shoes';
      }
      
      return {
        id: product.id,
        name: product.title,
        handle: product.handle,
        price: price,
        originalPrice: price > 100 ? Math.round(price * 1.2) : undefined,
        image: product.thumbnail || product.images?.[0]?.url || '/placeholder-product.jpg',
        hoverImage: product.images?.[1]?.url,
        category: category,
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

  // Show skeleton during SSR and initial load
  if (!mounted || (loading && products.length === 0)) {
    return <CollectionSkeleton />;
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