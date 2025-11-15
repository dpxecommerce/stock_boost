import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GET } from '@/app/api/search/skus/route'
import { NextRequest } from 'next/server'

// Mock the typesense service
vi.mock('@/lib/services/typesense', () => ({
  typesenseSearchService: {
    searchProducts: vi.fn()
  }
}))

// Get the mocked function
const { typesenseSearchService } = await import('@/lib/services/typesense')
const mockSearchProducts = vi.mocked(typesenseSearchService.searchProducts)

describe('/api/search/skus', () => {
  beforeEach(() => {
    mockSearchProducts.mockResolvedValue({
      found: 2,
      out_of: 100,
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
            id: 'test-1',
            item_no: 'TEST-001',
            item_no2: 'ALT-001',
            description: 'Test Product 1',
            client: 'Test Client'
          },
          text_match: 0.95
        },
        {
          document: {
            id: 'test-2',
            item_no: 'TEST-002',
            item_no2: 'ALT-002',
            description: 'Test Product 2',
            client: 'Test Client'
          },
          text_match: 0.89
        }
      ]
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should search SKUs and transform results correctly', async () => {
    const url = new URL('http://localhost:3000/api/search/skus?q=test&limit=10')
    const request = new NextRequest(url)

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    
    expect(data.data[0]).toMatchObject({
      id: 'test-1',
      sku: 'TEST-001',
      name: 'Test Product 1',
      category: 'Products',
      currentStock: 0,
      isActive: true,
      lastUsed: null,
      itemNo2: 'ALT-001',
      client: 'Test Client',
      textMatch: 0.95
    })

    expect(mockSearchProducts).toHaveBeenCalledWith({
      q: 'test',
      queryBy: 'item_no,item_no2,description',
      sortBy: '_text_match:desc,item_no:asc',
      page: 1,
      perPage: 10
    })
  })

  it('should return empty array for empty query', async () => {
    const url = new URL('http://localhost:3000/api/search/skus?q=&limit=10')
    const request = new NextRequest(url)

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
    expect(mockSearchProducts).not.toHaveBeenCalled()
  })

  it('should enforce limit constraints', async () => {
    const url = new URL('http://localhost:3000/api/search/skus?q=test&limit=100')
    const request = new NextRequest(url)

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('limit cannot exceed 50')
  })

  it('should handle Typesense errors gracefully', async () => {
    mockSearchProducts.mockRejectedValueOnce(new Error('Typesense connection failed'))

    const url = new URL('http://localhost:3000/api/search/skus?q=test&limit=10')
    const request = new NextRequest(url)

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('SKU search failed')
    expect(data.details).toBe('Typesense connection failed')
  })

  it('should use default limit when not specified', async () => {
    const url = new URL('http://localhost:3000/api/search/skus?q=test')
    const request = new NextRequest(url)

    const response = await GET(request)
    await response.json()

    expect(response.status).toBe(200)
    expect(mockSearchProducts).toHaveBeenCalledWith({
      q: 'test',
      queryBy: 'item_no,item_no2,description',
      sortBy: '_text_match:desc,item_no:asc',
      page: 1,
      perPage: 10
    })
  })
})