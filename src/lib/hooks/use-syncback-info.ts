import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/factory'
import { SyncbackInfo } from '@/types/api'

// Query key for caching
export const syncbackKeys = {
  all: ['syncback'] as const,
  info: () => [...syncbackKeys.all, 'info'] as const,
}

/**
 * Hook to fetch syncback information
 * Returns a dictionary mapping syncback_job_id to syncback name
 */
export function useSyncbackInfo() {
  return useQuery({
    queryKey: syncbackKeys.info(),
    queryFn: async () => {
      const response = await api.getSyncbackInfo()
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch syncback info')
      }
      return response.data || {}
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (syncback info rarely changes)
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Helper function to get syncback name by ID
 * @param syncbackInfo - The syncback info object
 * @param syncbackJobId - The syncback job ID to lookup
 * @returns The syncback name or the ID if not found
 */
export function getSyncbackName(
  syncbackInfo: SyncbackInfo | undefined,
  syncbackJobId: number | string
): string {
  if (!syncbackInfo) return String(syncbackJobId)
  return syncbackInfo[String(syncbackJobId)] || String(syncbackJobId)
}
