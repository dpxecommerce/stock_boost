'use client';

import { useState } from 'react';
import ProductSearch from '@/components/ProductSearch';
import { ProductDocument } from '@/types/typesense';

export default function TypesenseTestPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductDocument | null>(null);

  const handleProductSelect = (product: ProductDocument) => {
    setSelectedProduct(product);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Typesense Product Search Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Search Component */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Search Products</h2>
          <ProductSearch 
            onSelectProduct={handleProductSelect}
            placeholder="Search by item number, description, or client..."
            className="w-full"
          />
        </div>

        {/* Selected Product Display */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Selected Product</h2>
          {selectedProduct ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div>
                  <span className="font-medium">ID:</span> {selectedProduct.id}
                </div>
                <div>
                  <span className="font-medium">Item No:</span> {selectedProduct.item_no}
                </div>
                {selectedProduct.item_no2 && (
                  <div>
                    <span className="font-medium">Item No 2:</span> {selectedProduct.item_no2}
                  </div>
                )}
                <div>
                  <span className="font-medium">Description:</span> {selectedProduct.description}
                </div>
                {selectedProduct.client && (
                  <div>
                    <span className="font-medium">Client:</span> {selectedProduct.client}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No product selected</p>
          )}
        </div>
      </div>

      {/* API Test Instructions */}
      <div className="mt-12 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">API Test Instructions</h2>
        <p className="mb-4">You can test the API directly using curl:</p>
        <div className="bg-white p-4 rounded border font-mono text-sm overflow-x-auto">
          <div className="mb-2">
            <strong>Basic search:</strong>
          </div>
          <code className="block mb-4">
            curl &quot;http://localhost:3000/api/search/products?q=*&amp;per_page=10&amp;page=1&quot;
          </code>
          
          <div className="mb-2">
            <strong>Your original curl equivalent:</strong>
          </div>
          <code className="block">
            curl &quot;http://localhost:3000/api/search/products?q=*&amp;query_by=item_no,item_no2,description,client&amp;per_page=10&amp;page=1&quot;
          </code>
        </div>
      </div>
    </div>
  );
}