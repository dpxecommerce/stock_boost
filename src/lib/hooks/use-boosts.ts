import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/factory'
import { StockBoost, CreateBoostRequest, DeactivateBoostRequest } from '@/types/boost'

// Query keys for caching
export const boostKeys = {
  all: ['boosts'] as const,
  active: () => [...boostKeys.all, 'active'] as const,
  historical: () => [...boostKeys.all, 'historical'] as const,
  historicalWithPagination: (page: number, limit: number) => 
    [...boostKeys.historical(), page, limit] as const,
}

export const skuKeys = {
  all: ['skus'] as const,
  search: (query: string, limit: number) => [...skuKeys.all, 'search', query, limit] as const,
}

// Active boosts query
export function useActiveBoosts() {
  return useQuery({
    queryKey: boostKeys.active(),
    queryFn: async () => {
      const response = await api.getActiveBoosts()
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch active boosts')
      }
      // Handle both array response and object with boosts property
      if (!response.data) return []
      return Array.isArray(response.data) ? response.data : []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Historical boosts query with pagination
export function useHistoricalBoosts(page = 1, limit = 20) {
  return useQuery({
    queryKey: boostKeys.historicalWithPagination(page, limit),
    queryFn: async () => {
      const response = await api.getHistoricalBoosts(page, limit)
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch historical boosts')
      }
      // Extract boosts and pagination from nested data object
      if (!response.data) {
        return { boosts: [], pagination: undefined }
      }
      return {
        boosts: response.data.boosts || [],
        pagination: response.data.pagination
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (historical data changes less frequently)
    gcTime: 15 * 60 * 1000, // 15 minutes
  })
}

// SKU search query
export function useSkuSearch(query: string, limit = 10) {
  return useQuery({
    queryKey: skuKeys.search(query, limit),
    queryFn: async () => {
      if (!query.trim()) {
        return []
      }
      const response = await api.searchSKUs(query, limit)
      if (!response.success) {
        throw new Error(response.error || 'Failed to search SKUs')
      }
      // Handle both array response and object with data property
      return Array.isArray(response.data) ? response.data : []
    },
    enabled: query.trim().length > 0,
    staleTime: 30 * 1000, // 30 seconds (search results can be cached briefly)
    gcTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Create boost mutation
export function useCreateBoost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (boost: CreateBoostRequest) => {
      const response = await api.createBoost(boost)
      if (!response.success) {
        throw new Error(response.error || 'Failed to create boost')
      }
      return response.data
    },
    onSuccess: (newBoost) => {
      if (!newBoost) return

      // Update active boosts cache
      queryClient.setQueryData<StockBoost[]>(
        boostKeys.active(),
        (oldData) => {
          if (!oldData) return [newBoost]
          return [newBoost, ...oldData]
        }
      )

      // Optionally refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: boostKeys.active() })
    },
    onError: (error) => {
      console.error('Failed to create boost:', error)
    }
  })
}

// Deactivate boost mutation
export function useDeactivateBoost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, request }: { id: number; request: DeactivateBoostRequest }) => {
      const response = await api.deactivateBoost(id, request)
      if (!response.success) {
        throw new Error(response.error || 'Failed to deactivate boost')
      }
      return response.data
    },
    onSuccess: (deactivatedBoost) => {
      if (!deactivatedBoost) return

      // Remove from active boosts
      queryClient.setQueryData<StockBoost[]>(
        boostKeys.active(),
        (oldData) => {
          if (!oldData) return []
          return oldData.filter(boost => boost.id !== deactivatedBoost.id)
        }
      )

      // Add to historical boosts cache if it exists
      queryClient.setQueryData(
        boostKeys.historicalWithPagination(1, 20),
        (oldData: { boosts: StockBoost[]; pagination: { total: number; totalPages: number } } | undefined) => {
          if (!oldData) return oldData
          return {
            boosts: [deactivatedBoost, ...(oldData.boosts || [])],
            pagination: {
              ...oldData.pagination,
              total: (oldData.pagination?.total || 0) + 1
            }
          }
        }
      )

      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: boostKeys.active() })
      queryClient.invalidateQueries({ queryKey: boostKeys.historical() })
    },
    onError: (error) => {
      console.error('Failed to deactivate boost:', error)
    }
  })
}

// Sync now mutation
export function useSyncNow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.syncNow(id)
      if (!response.success) {
        throw new Error(response.error || 'Failed to sync boost')
      }
      return response
    },
    onSuccess: () => {
      // Refetch active boosts to get updated data
      queryClient.invalidateQueries({ queryKey: boostKeys.active() })
    },
    onError: (error) => {
      console.error('Failed to sync boost:', error)
    }
  })
}

// Bulk operations
export function useInvalidateBoosts() {
  const queryClient = useQueryClient()

  return {
    invalidateActive: () => queryClient.invalidateQueries({ queryKey: boostKeys.active() }),
    invalidateHistorical: () => queryClient.invalidateQueries({ queryKey: boostKeys.historical() }),
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: boostKeys.all }),
  }
}