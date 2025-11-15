import { Client } from 'typesense';
import { 
  ProductDocument, 
  ProductSearchParams, 
  ProductSearchResponse 
} from '@/types/typesense';

class TypesenseSearchService {
  private client: Client;

  constructor() {
    this.client = new Client({
      nodes: [
        {
          host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || 'localhost',
          port: parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT || '8108'),
          protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || 'http',
        },
      ],
      apiKey: process.env.NEXT_PUBLIC_TYPESENSE_API_KEY || '',
      connectionTimeoutSeconds: 2,
    });
  }

  /**
   * Search products using Typesense
   */
  async searchProducts({
    q = '*',
    queryBy = 'item_no,item_no2,description,client',
    filterBy,
    sortBy = '_text_match:desc,item_no:asc',
    page = 1,
    perPage = 10
  }: ProductSearchParams): Promise<ProductSearchResponse> {
    try {
      const searchParameters: Record<string, unknown> = {
        q,
        query_by: queryBy,
        sort_by: sortBy,
        page,
        per_page: perPage,
      };

      // Add optional filter
      if (filterBy) {
        searchParameters.filter_by = filterBy;
      }

      const searchResults = await this.client
        .collections('products')
        .documents()
        .search(searchParameters);

      return searchResults as ProductSearchResponse;
    } catch (error) {
      console.error('Typesense search error:', error);
      throw new Error(`Product search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search products with fuzzy matching (for typos)
   */
  async searchProductsFuzzy({
    q,
    queryBy = 'item_no,item_no2,description,client',
    filterBy,
    page = 1,
    perPage = 10
  }: ProductSearchParams): Promise<ProductSearchResponse> {
    return this.searchProducts({
      q,
      queryBy,
      filterBy,
      sortBy: '_text_match:desc,item_no:asc',
      page,
      perPage
    });
  }

  /**
   * Search products by item number (exact or partial match)
   */
  async searchByItemNumber(itemNo: string, page = 1, perPage = 10): Promise<ProductSearchResponse> {
    return this.searchProducts({
      q: itemNo,
      queryBy: 'item_no,item_no2',
      page,
      perPage
    });
  }

  /**
   * Search products by description
   */
  async searchByDescription(description: string, page = 1, perPage = 10): Promise<ProductSearchResponse> {
    return this.searchProducts({
      q: description,
      queryBy: 'description',
      page,
      perPage
    });
  }

  /**
   * Search products by client
   */
  async searchByClient(client: string, page = 1, perPage = 10): Promise<ProductSearchResponse> {
    return this.searchProducts({
      q: '*',
      queryBy: 'item_no,item_no2,description',
      filterBy: `client:=${client}`,
      page,
      perPage
    });
  }

  /**
   * Get product suggestions (for autocomplete)
   */
  async getProductSuggestions(query: string, limit = 5): Promise<ProductDocument[]> {
    try {
      const results = await this.searchProducts({
        q: query,
        queryBy: 'item_no,item_no2,description',
        perPage: limit
      });

      return results.hits.map(hit => hit.document);
    } catch (error) {
      console.error('Typesense suggestions error:', error);
      return [];
    }
  }

  /**
   * Check if Typesense service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.health.retrieve();
      return true;
    } catch (error) {
      console.error('Typesense health check failed:', error);
      return false;
    }
  }

  /**
   * Get collection stats
   */
  async getCollectionStats(): Promise<{ name: string; num_documents: number }> {
    try {
      const collection = await this.client.collections('products').retrieve();
      return {
        name: collection.name,
        num_documents: collection.num_documents
      };
    } catch (error) {
      console.error('Failed to get collection stats:', error);
      throw new Error('Failed to retrieve collection statistics');
    }
  }
}

// Export singleton instance
export const typesenseSearchService = new TypesenseSearchService();
export default typesenseSearchService;