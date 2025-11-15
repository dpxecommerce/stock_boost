import { AuthResponse, User } from '@/types/auth'
import { StockBoost, SKU, CreateBoostRequest, DeactivateBoostRequest } from '@/types/boost'
import { ApiResponse, PaginatedResponse } from '@/types/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
const BASE_URL = `${API_BASE_URL}`

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`
    const headers = this.getAuthHeaders()

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Authentication methods
  async login(credentials: { username: string; password: string }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })

    if (response.success && response.data?.token) {
      localStorage.setItem('auth_token', response.data.token)
    }

    return response
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token')
    // Optionally call logout endpoint to invalidate token on server
    try {
      await this.request('/auth/logout', { method: 'POST' })
    } catch {
      // Ignore logout errors since token is already removed locally
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('/auth/me')
  }

  async refreshToken(): Promise<{ token: string }> {
    const response = await this.request<{ success: boolean; data: { token: string } }>('/auth/refresh', {
      method: 'POST'
    })
    
    if (response.success && response.data.token) {
      localStorage.setItem('auth_token', response.data.token)
      return response.data
    }
    
    throw new Error('Failed to refresh token')
  }

  // Stock boost methods
  async getActiveBoosts(): Promise<ApiResponse<StockBoost[]>> {
    return this.request<ApiResponse<StockBoost[]>>('/boosts/active')
  }

  async getHistoricalBoosts(page = 1, limit = 20): Promise<PaginatedResponse<StockBoost>> {
    return this.request<PaginatedResponse<StockBoost>>(`/boosts/historical?page=${page}&limit=${limit}`)
  }

  async createBoost(boost: CreateBoostRequest): Promise<ApiResponse<StockBoost>> {
    return this.request<ApiResponse<StockBoost>>('/boosts', {
      method: 'POST',
      body: JSON.stringify(boost)
    })
  }

  async deactivateBoost(id: string, request: DeactivateBoostRequest): Promise<ApiResponse<StockBoost>> {
    return this.request<ApiResponse<StockBoost>>(`/boosts/${id}/deactivate`, {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  // SKU methods - now using Typesense directly
  async searchSKUs(query: string, limit = 10): Promise<ApiResponse<SKU[]>> {
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        data: []
      }
    }

    try {
      // Import Typesense service dynamically to avoid SSR issues
      const { typesenseSearchService } = await import('@/lib/services/typesense')
      
      // Search products using Typesense
      const searchResults = await typesenseSearchService.searchProducts({
        q: query.trim(),
        queryBy: 'item_no,item_no2,description',
        sortBy: '_text_match:desc',
        page: 1,
        perPage: limit
      })

      // Transform Typesense products to SKU format
      const skus = searchResults.hits.map(hit => ({
        id: hit.document.id,
        sku: hit.document.item_no,
        name: hit.document.description,
        category: 'Products', // Default category since it's not in ProductDocument
        currentStock: 0, // This would need to come from inventory system
        isActive: true,
        lastUsed: null,
        // Additional fields that might be useful
        itemNo2: hit.document.item_no2,
        client: hit.document.client,
        textMatch: hit.text_match
      }))

      return {
        success: true,
        data: skus
      }
    } catch (error) {
      console.error('Typesense SKU search error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SKU search failed'
      }
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token')
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token')
  }
}

export const apiClient = new ApiClient()