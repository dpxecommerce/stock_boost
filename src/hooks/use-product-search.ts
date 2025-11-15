import { useState, useEffect } from 'react';
import { ProductDocument, ProductSearchResponse } from '@/types/typesense';

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

  // Search function
  const searchProducts = async () => {
    if (!enabled || (debouncedQuery.length < 2 && debouncedQuery !== '*')) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: debouncedQuery,
        query_by: queryBy,
        page: page.toString(),
        per_page: perPage.toString(),
      });

      if (filterBy) {
        params.append('filter_by', filterBy);
      }

      const response = await fetch(`/api/search/products?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Search failed');
      }

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Search failed');
      }
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

// Hook for product suggestions/autocomplete
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
        const params = new URLSearchParams({
          q: query,
          query_by: 'item_no,item_no2,description',
          per_page: limit.toString(),
        });

        const response = await fetch(`/api/search/products?${params}`);
        const result = await response.json();

        if (result.success && result.data.hits) {
          setSuggestions(result.data.hits.map((hit: { document: ProductDocument }) => hit.document));
        } else {
          setSuggestions([]);
        }
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