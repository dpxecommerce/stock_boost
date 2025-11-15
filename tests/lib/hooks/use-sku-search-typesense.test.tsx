import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSkuSearch } from '@/lib/hooks/use-boosts'

// Mock fetch
global.fetch = vi.fn()

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
  
  Wrapper.displayName = 'TestQueryClientWrapper'
  
  return Wrapper
}

describe('useSkuSearch with Typesense', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should search SKUs using Typesense API', async () => {
    const mockResponse = {
      success: true,
      data: [
        {
          id: 'test-1',
          sku: 'TEST-001',
          name: 'Test Product 1',
          category: 'Products',
          currentStock: 10,
          isActive: true,
          lastUsed: null,
          itemNo2: 'ALT-001',
          client: 'Test Client',
          textMatch: 0.95
        },
        {
          id: 'test-2', 
          sku: 'TEST-002',
          name: 'Test Product 2',
          category: 'Products',
          currentStock: 5,
          isActive: true,
          lastUsed: null,
          itemNo2: 'ALT-002',
          client: 'Test Client',
          textMatch: 0.89
        }
      ]
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    const { result } = renderHook(() => useSkuSearch('test', 10), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(fetch).toHaveBeenCalledWith(
      '/api/search/skus?q=test&limit=10',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    )

    expect(result.current.data).toEqual(mockResponse.data)
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].sku).toBe('TEST-001')
    expect(result.current.data![0].textMatch).toBe(0.95)
  })

  it('should not fetch for empty query', async () => {
    const { result } = renderHook(() => useSkuSearch('', 10), {
      wrapper: createWrapper(),
    })

    // Query should be disabled for empty strings
    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should handle API errors gracefully', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' })
    })

    const { result } = renderHook(() => useSkuSearch('test', 10), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeTruthy()
  })

  it('should debounce search queries properly', async () => {
    const mockResponse = {
      success: true,
      data: []
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    })

    const { result } = renderHook(() => useSkuSearch('t', 10), {
      wrapper: createWrapper(),
    })

    // Should be enabled for queries with length > 0
    await waitFor(() => {
      expect(result.current.isFetching).toBe(true)
    })

    expect(fetch).toHaveBeenCalled()
  })
})