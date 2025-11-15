import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the entire typesense module
const mockSearch = vi.fn();
const mockRetrieve = vi.fn();
const mockHealth = vi.fn();

vi.mock('typesense', () => ({
  Client: class MockClient {
    collections() {
      return {
        documents: () => ({
          search: mockSearch
        }),
        retrieve: mockRetrieve
      };
    }
    
    get health() {
      return {
        retrieve: mockHealth
      };
    }
  }
}));

// Import after mocking
import { typesenseSearchService } from '@/lib/services/typesense';

describe('TypesenseSearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockSearch.mockResolvedValue({
      found: 2,
      out_of: 2,
      page: 1,
      request_params: {
        collection_name: 'products',
        per_page: 10,
        q: 'test'
      },
      search_time_ms: 5,
      hits: [
        {
          document: {
            id: 'TEST001',
            item_no: 'TEST001',
            item_no2: 'ALT001',
            description: 'Test Product 1',
            client: 'Test Client'
          },
          text_match: 1
        },
        {
          document: {
            id: 'TEST002',
            item_no: 'TEST002', 
            item_no2: 'ALT002',
            description: 'Test Product 2',
            client: 'Test Client'
          },
          text_match: 0.8
        }
      ]
    });

    mockRetrieve.mockResolvedValue({
      name: 'products',
      num_documents: 1000
    });

    mockHealth.mockResolvedValue({ status: 'ok' });
  });

  it('should search products successfully', async () => {
    const result = await typesenseSearchService.searchProducts({
      q: 'test',
      perPage: 10
    });

    expect(result.found).toBe(2);
    expect(result.hits).toHaveLength(2);
    expect(result.hits[0].document.item_no).toBe('TEST001');
    expect(result.hits[0].document.description).toBe('Test Product 1');
  });

  it('should search by item number', async () => {
    const result = await typesenseSearchService.searchByItemNumber('TEST001');

    expect(result.found).toBe(2);
    expect(result.hits).toHaveLength(2);
  });

  it('should search by description', async () => {
    const result = await typesenseSearchService.searchByDescription('Test Product');

    expect(result.found).toBe(2);
    expect(result.hits).toHaveLength(2);
  });

  it('should get product suggestions', async () => {
    const suggestions = await typesenseSearchService.getProductSuggestions('test', 5);

    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].item_no).toBe('TEST001');
    expect(suggestions[1].item_no).toBe('TEST002');
  });

  it('should perform health check', async () => {
    const isHealthy = await typesenseSearchService.healthCheck();
    expect(isHealthy).toBe(true);
  });

  it('should get collection stats', async () => {
    const stats = await typesenseSearchService.getCollectionStats();
    
    expect(stats.name).toBe('products');
    expect(stats.num_documents).toBe(1000);
  });

  it('should handle empty suggestions gracefully', async () => {
    const suggestions = await typesenseSearchService.getProductSuggestions('test');
    expect(Array.isArray(suggestions)).toBe(true);
  });
});