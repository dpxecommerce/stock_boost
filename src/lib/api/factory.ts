import { apiClient } from './client'
import { mockApiClient } from './mock-client'

// Factory to return the appropriate API client based on environment
export function getApiClient() {
  const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true'
  
  if (useMockApi) {
    if (typeof window !== 'undefined') {
      console.log('🔧 Using Mock API Client for development')
    }
    return mockApiClient
  }
  
  if (typeof window !== 'undefined') {
    console.log('🌐 Using External API Client')
  }
  return apiClient
}

// Export the configured client
export const api = getApiClient()