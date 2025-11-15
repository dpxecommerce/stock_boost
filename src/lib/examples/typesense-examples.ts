/**
 * Example usage of Typesense Product Search Service
 * 
 * This file demonstrates how to use the TypesenseSearchService
 * for various product search scenarios.
 */

import { typesenseSearchService } from '@/lib/services/typesense';

// Example 1: Basic product search
export async function basicProductSearch(query: string) {
  try {
    const results = await typesenseSearchService.searchProducts({
      q: query,
      perPage: 10
    });
    
    console.log(`Found ${results.found} products`);
    results.hits.forEach(hit => {
      console.log(`- ${hit.document.item_no}: ${hit.document.description}`);
    });
    
    return results;
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
}

// Example 2: Search by item number only
export async function searchByItemNumber(itemNo: string) {
  try {
    const results = await typesenseSearchService.searchByItemNumber(itemNo);
    return results.hits.map(hit => hit.document);
  } catch (error) {
    console.error('Item number search failed:', error);
    return [];
  }
}

// Example 3: Search with pagination
export async function paginatedSearch(query: string, page: number = 1) {
  try {
    const results = await typesenseSearchService.searchProducts({
      q: query,
      page,
      perPage: 20
    });
    
    return {
      products: results.hits.map(hit => hit.document),
      pagination: {
        page,
        totalFound: results.found,
        hasMore: (page * 20) < results.found
      }
    };
  } catch (error) {
    console.error('Paginated search failed:', error);
    return {
      products: [],
      pagination: { page, totalFound: 0, hasMore: false }
    };
  }
}

// Example 4: Search with client filter
export async function searchByClientFilter(clientName: string) {
  try {
    const results = await typesenseSearchService.searchByClient(clientName);
    return results.hits.map(hit => hit.document);
  } catch (error) {
    console.error('Client filter search failed:', error);
    return [];
  }
}

// Example 5: Get autocomplete suggestions
export async function getProductSuggestions(partialQuery: string) {
  try {
    const suggestions = await typesenseSearchService.getProductSuggestions(partialQuery, 5);
    return suggestions.map(product => ({
      value: product.item_no,
      label: `${product.item_no} - ${product.description}`,
      product
    }));
  } catch (error) {
    console.error('Suggestions failed:', error);
    return [];
  }
}

// Example 6: Advanced search with multiple filters
export async function advancedProductSearch(options: {
  query?: string;
  client?: string;
  itemPrefix?: string;
  page?: number;
}) {
  try {
    const { query = '*', client, itemPrefix, page = 1 } = options;
    
    let filterBy: string | undefined;
    let searchQuery = query;
    let queryBy = 'item_no,item_no2,description,client';

    // Build filters
    if (client) {
      filterBy = `client:=${client}`;
    }

    // Modify search for item prefix
    if (itemPrefix) {
      searchQuery = `${itemPrefix}*`;
      queryBy = 'item_no,item_no2';
    }

    const results = await typesenseSearchService.searchProducts({
      q: searchQuery,
      queryBy,
      filterBy,
      page,
      perPage: 25
    });

    return {
      products: results.hits.map(hit => hit.document),
      meta: {
        found: results.found,
        page,
        searchTime: results.search_time_ms
      }
    };
  } catch (error) {
    console.error('Advanced search failed:', error);
    return {
      products: [],
      meta: { found: 0, page: 1, searchTime: 0 }
    };
  }
}

// Example 7: Health check and diagnostics
export async function runDiagnostics() {
  try {
    console.log('Running Typesense diagnostics...');
    
    // Health check
    const isHealthy = await typesenseSearchService.healthCheck();
    console.log(`Health status: ${isHealthy ? 'OK' : 'FAILED'}`);
    
    if (isHealthy) {
      // Collection stats
      const stats = await typesenseSearchService.getCollectionStats();
      console.log(`Collection: ${stats.name}`);
      console.log(`Documents: ${stats.num_documents}`);
      
      // Test search
      const testResults = await typesenseSearchService.searchProducts({
        q: '*',
        perPage: 1
      });
      console.log(`Test search: ${testResults.found > 0 ? 'PASS' : 'FAIL'}`);
    }
    
    return isHealthy;
  } catch (error) {
    console.error('Diagnostics failed:', error);
    return false;
  }
}

// Usage examples for API routes or server actions
export const ProductSearchExamples = {
  basicProductSearch,
  searchByItemNumber,
  paginatedSearch,
  searchByClientFilter,
  getProductSuggestions,
  advancedProductSearch,
  runDiagnostics
};