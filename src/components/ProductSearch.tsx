'use client';

import { useState } from 'react';
import { useProductSearch } from '@/hooks/use-product-search';
import { ProductDocument } from '@/types/typesense';

interface ProductSearchProps {
  onSelectProduct?: (product: ProductDocument) => void;
  placeholder?: string;
  className?: string;
}

export default function ProductSearch({ 
  onSelectProduct, 
  placeholder = "Search products...",
  className = ""
}: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const { 
    products, 
    loading, 
    error, 
    hasMore, 
    totalFound 
  } = useProductSearch({
    query,
    page,
    perPage: 20,
    enabled: query.length >= 2 || query === '*'
  });

  const handleProductSelect = (product: ProductDocument) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
    setQuery(''); // Clear search after selection
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1); // Reset to first page on new query
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Search Results */}
      {query.length >= 2 && !loading && products.length === 0 && !error && (
        <div className="mt-2 p-3 text-gray-500 text-center">
          No products found for &quot;{query}&quot;
        </div>
      )}

      {products.length > 0 && (
        <div className="mt-2 border border-gray-200 rounded-md max-h-96 overflow-y-auto">
          {/* Results Header */}
          <div className="px-4 py-2 bg-gray-50 border-b text-sm text-gray-600">
            Found {totalFound} product{totalFound !== 1 ? 's' : ''}
          </div>

          {/* Product List */}
          <div className="divide-y divide-gray-100">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => handleProductSelect(product)}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {product.item_no}
                      {product.item_no2 && (
                        <span className="ml-2 text-sm text-gray-500">
                          ({product.item_no2})
                        </span>
                      )}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {product.client && (
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          Client: {product.client}
                        </span>
                      )}
                      {product.current_stock !== undefined && (
                        <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          Stock: {product.current_stock}
                        </span>
                      )}
                    </div>
                    {product.stock_last_updated_at && (
                      <div className="text-xs text-gray-400 mt-1">
                        Last updated: {new Date(product.stock_last_updated_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="px-4 py-3 bg-gray-50 border-t">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}