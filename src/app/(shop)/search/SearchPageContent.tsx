"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchFilters, FilterState } from "@/components/search/SearchFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { useProducts } from "@/lib/hooks/useProducts";
import { Product } from "@/lib/types";
import { trackSearch } from "@/lib/analytics/google-analytics";

export default function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("search") || "";
  const { products, isLoading } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    categories: [],
    sizes: [],
    colors: [],
    priceRange: [0, 2000],
    sort: "featured",
  });

  const applyFilters = (products: Product[], filters: FilterState) => {
    let filtered = [...products];

    // Filter by search query
    if (query) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filter by categories
    if (filters.categories.length > 0) {
      filtered = filtered.filter((p) => filters.categories.includes(p.category));
    }

    // Filter by sizes
    if (filters.sizes.length > 0) {
      filtered = filtered.filter((p) =>
        p.variants.some((v) => filters.sizes.includes(v.size) && v.stock > 0)
      );
    }

    // Filter by colors
    if (filters.colors.length > 0) {
      filtered = filtered.filter((p) => {
        const productColor = p.color?.toLowerCase() || "";
        return filters.colors.some((color) =>
          productColor.includes(color.toLowerCase())
        );
      });
    }

    // Filter by price range
    filtered = filtered.filter(
      (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // Sort
    switch (filters.sort) {
      case "price_asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        // Sort by ID descending (assuming newer products have higher IDs)
        filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        break;
      case "featured":
      default:
        // Keep original order for featured
        break;
    }

    return filtered;
  };

  const handleFilterChange = (filters: FilterState) => {
    setCurrentFilters(filters);
    setFilteredProducts(applyFilters(products, filters));
  };

  useEffect(() => {
    const filtered = applyFilters(products, currentFilters);
    setFilteredProducts(filtered);
    
    // Track search when query changes
    if (query) {
      trackSearch(query, filtered.length);
    }
  }, [products, query, currentFilters]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {query ? `Search results for "${query}"` : "All Products"}
          </h1>
          <SearchBar />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <SearchFilters 
              onFilterChange={handleFilterChange} 
              productCount={filteredProducts.length}
            />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  {filteredProducts.length} products found
                </p>
                <ProductGrid products={filteredProducts} />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}