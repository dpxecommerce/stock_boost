import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProductDocument, ProductSearchResponse } from '@/types/typesense';
import { typesenseSearchService } from '@/lib/services/typesense';

interface UseProductSearchOptions {
  query?: string;
  queryBy?: string;
  filterBy?: string;
  page?: number;
  perPage?: number;
  debounceMs?: number;
  enabled?: boolean;
}

interface UseProductSearchResult {
  data: ProductSearchResponse | null;
  products: ProductDocument[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  hasMore: boolean;
  totalFound: number;
}

export function useProductSearch({
  query = '',
  queryBy = 'item_no,item_no2,description,client',
  filterBy,
  page = 1,
  perPage = 10,
  debounceMs = 300,
  enabled = true
}: UseProductSearchOptions = {}): UseProductSearchResult {
  const [data, setData] = useState<ProductSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Search function using Typesense service directly
  const searchProducts = async () => {
    if (!enabled || (debouncedQuery.length < 2 && debouncedQuery !== '*')) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchResults = await typesenseSearchService.searchProducts({
        q: debouncedQuery,
        queryBy,
        filterBy,
        page,
        perPage
      });

      setData(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Effect to trigger search
  useEffect(() => {
    searchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, queryBy, filterBy, page, perPage, enabled]);

  // Derived values
  const products = data?.hits?.map(hit => hit.document) || [];
  const totalFound = data?.found || 0;
  const hasMore = data ? (page * perPage) < totalFound : false;

  return {
    data,
    products,
    loading,
    error,
    refetch: searchProducts,
    hasMore,
    totalFound
  };
}

// Hook for product suggestions/autocomplete using Typesense service directly
export function useProductSuggestions(query: string, limit = 5) {
  const [suggestions, setSuggestions] = useState<ProductDocument[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const productSuggestions = await typesenseSearchService.getProductSuggestions(query, limit);
        setSuggestions(productSuggestions);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timer);
  }, [query, limit]);

  return { suggestions, loading };
}

// React Query version with better caching and state management
export const productSearchKeys = {
  all: ['products'] as const,
  search: (query: string, options: Omit<UseProductSearchOptions, 'query'>) => 
    [...productSearchKeys.all, 'search', query, options] as const,
  suggestions: (query: string, limit: number) => 
    [...productSearchKeys.all, 'suggestions', query, limit] as const,
}

export function useProductSearchQuery({
  query = '',
  queryBy = 'item_no,item_no2,description,client',
  filterBy,
  page = 1,
  perPage = 10,
  enabled = true
}: UseProductSearchOptions = {}) {
  return useQuery({
    queryKey: productSearchKeys.search(query, { queryBy, filterBy, page, perPage, enabled }),
    queryFn: async () => {
      if (query.length < 2 && query !== '*') {
        return {
          found: 0,
          out_of: 0,
          page: 1,
          request_params: { collection_name: 'products', per_page: perPage, q: query },
          search_time_ms: 0,
          hits: []
        } as ProductSearchResponse;
      }

      return await typesenseSearchService.searchProducts({
        q: query,
        queryBy,
        filterBy,
        sortBy: '_text_match:desc',
        page,
        perPage
      });
    },
    enabled: enabled && (query.length >= 2 || query === '*'),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useProductSuggestionsQuery(query: string, limit = 5) {
  return useQuery({
    queryKey: productSearchKeys.suggestions(query, limit),
    queryFn: async () => {
      if (query.length < 2) {
        return [];
      }
      return await typesenseSearchService.getProductSuggestions(query, limit);
    },
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}