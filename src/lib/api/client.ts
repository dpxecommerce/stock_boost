import { AuthResponse, User } from '@/types/auth'
import { StockBoost, SKU, CreateBoostRequest, DeactivateBoostRequest } from '@/types/boost'
import { ApiResponse, PaginatedResponse, SyncbackInfo } from '@/types/api'

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
    const response = await this.request<{ success: boolean; data: { boosts: StockBoost[] } }>('/boosts/active')
    // Transform response to match expected format
    return {
      success: response.success,
      data: response.data?.boosts || []
    }
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

  async deactivateBoost(id: number, request: DeactivateBoostRequest): Promise<ApiResponse<StockBoost>> {
    return this.request<ApiResponse<StockBoost>>(`/boosts/${id}/deactivate`, {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  // SKU methods
  async searchSKUs(query: string, limit = 10): Promise<ApiResponse<SKU[]>> {
    const params = new URLSearchParams({ 
      query: query, 
      limit: limit.toString() 
    })
    
    const response = await this.request<ApiResponse<Array<{
      id: string
      item_no: string
      item_no2: string
      description: string
      client?: string
      row_id?: number
      current_stock?: number
      stock_last_updated_at?: string
    }>>>(`/skus/search?${params}`)
    
    // Transform the API response to SKU format
    if (response.success && response.data) {
      const transformedData: SKU[] = response.data.map(item => ({
        id: item.id,
        sku: item.item_no,
        name: item.description,
        category: 'Products',
        currentStock: item.current_stock || 0,
        isActive: true,
        lastUsed: null,
        // Additional fields
        itemNo2: item.item_no2,
        client: item.client,
        stockLastUpdatedAt: item.stock_last_updated_at
      }))
      
      return {
        success: true,
        data: transformedData
      }
    }
    
    return {
      success: false,
      error: response.error || 'Failed to search SKUs'
    }
  }

  // Syncback methods
  async getSyncbackInfo(): Promise<ApiResponse<SyncbackInfo>> {
    return this.request<ApiResponse<SyncbackInfo>>('/auth/syncback_info')
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