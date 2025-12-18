import { AuthResponse, User } from '@/types/auth'
import { StockBoost, SKU, CreateBoostRequest, DeactivateBoostRequest } from '@/types/boost'
import { ApiResponse, PaginatedResponse, SyncbackInfo, SyncNowResponse } from '@/types/api'

// Mock data
const mockUsers: Record<string, { id: string; username: string; password: string; email: string; role: string }> = {
  'admin': {
    id: 'user-1',
    username: 'admin',
    password: 'admin123',
    email: 'admin@stockboost.com',
    role: 'admin'
  },
  'demo': {
    id: 'user-2', 
    username: 'demo',
    password: 'demo123',
    email: 'demo@stockboost.com',
    role: 'user'
  }
}

const mockStockBoosts: StockBoost[] = [
  {
    id: 1,
    sku: 'SKU-001',
    amount: 55,
    status: 'active',
    sourceProductId: 1,
    createdAt: '2024-11-01T10:00:00Z',
    sourceStock: 120,
    targetStocks: [
      {
        id: 1,
        syncback_job_id: 101,
        item_id: 'ITEM-001-A',
        variation_id: 'VAR-001',
        sku: 'SKU-001-A',
        current_quantity: 30,
        booked_quantity: 5,
        to_sync: true,
        amount: 20,
        boost_quantity: 20,
        sellable_quantity: 45
      },
      {
        id: 2,
        syncback_job_id: 101,
        item_id: 'ITEM-001-B',
        variation_id: 'VAR-002',
        sku: 'SKU-001-B',
        current_quantity: 25,
        booked_quantity: 3,
        to_sync: true,
        amount: 35,
        boost_quantity: 35,
        sellable_quantity: 57
      }
    ]
  },
  {
    id: 2,
    sku: 'SKU-002', 
    amount: 38,
    status: 'active',
    sourceProductId: 2,
    createdAt: '2024-11-02T14:30:00Z',
    sourceStock: 85,
    targetStocks: [
      {
        id: 3,
        syncback_job_id: 102,
        item_id: 'ITEM-002-A',
        variation_id: null,
        sku: 'SKU-002',
        current_quantity: 12,
        booked_quantity: 2,
        to_sync: true,
        amount: 38,
        boost_quantity: 38,
        sellable_quantity: 48
      }
    ]
  },
  {
    id: 3,
    sku: 'SKU-003',
    amount: 2,
    status: 'completed',
    sourceProductId: 3,
    createdAt: '2024-10-30T09:15:00Z',
    sourceStock: 78,
    targetStocks: []
  }
]

const mockSKUs: SKU[] = [
  { id: 'SKU-001', sku: 'SKU-001', name: 'Premium Widget A', category: 'Widgets', currentStock: 45, isActive: true, lastUsed: null },
  { id: 'SKU-002', sku: 'SKU-002', name: 'Standard Widget B', category: 'Widgets', currentStock: 12, isActive: true, lastUsed: null },
  { id: 'SKU-003', sku: 'SKU-003', name: 'Economy Widget C', category: 'Widgets', currentStock: 78, isActive: true, lastUsed: null },
  { id: 'SKU-004', sku: 'SKU-004', name: 'Deluxe Gadget X', category: 'Gadgets', currentStock: 23, isActive: true, lastUsed: null },
  { id: 'SKU-005', sku: 'SKU-005', name: 'Basic Tool Y', category: 'Tools', currentStock: 67, isActive: true, lastUsed: null },
  { id: 'SKU-006', sku: 'SKU-006', name: 'Advanced Component Z', category: 'Components', currentStock: 8, isActive: true, lastUsed: null }
]

const mockSyncbackInfo: SyncbackInfo = {
  '101': 'Shopee Malaysia Sync',
  '102': 'Lazada Thailand Sync',
  '103': 'Tokopedia Indonesia Sync',
  '104': 'Shopee Singapore Sync',
  '105': 'TikTok Shop Vietnam Sync'
}

// Helper function to simulate API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Generate mock token
function generateMockToken(): string {
  return 'mock_token_' + Math.random().toString(36).substr(2, 9)
}

class MockApiClient {
  private currentUser: User | null = null
  private authToken: string | null = null
  private stockBoosts: StockBoost[] = [...mockStockBoosts]

  constructor() {
    // Check if user is already logged in (only on client side)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('user_data')
      if (token && userData) {
        this.authToken = token
        this.currentUser = JSON.parse(userData)
      }
    }
  }

  private saveAuthState(token: string, user: User) {
    this.authToken = token
    this.currentUser = user
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(user))
    }
  }

  private clearAuthState() {
    this.authToken = null
    this.currentUser = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
    }
  }

  // Authentication methods
  async login(credentials: { username: string; password: string }): Promise<AuthResponse> {
    await delay(300) // Simulate network delay

    const { username, password } = credentials

    if (!username || !password) {
      throw new Error('Username and password are required')
    }

    const user = mockUsers[username]
    
    if (!user || user.password !== password) {
      throw new Error('Invalid username or password')
    }

    const token = generateMockToken()
    const userWithoutPassword: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: new Date(),
      lastLoginAt: new Date()
    }
    
    this.saveAuthState(token, userWithoutPassword)

    return {
      success: true,
      data: {
        token,
        user: userWithoutPassword
      }
    }
  }

  async logout(): Promise<void> {
    await delay(100)
    this.clearAuthState()
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    await delay(100)
    
    if (!this.currentUser) {
      throw new Error('Not authenticated')
    }

    return {
      success: true,
      data: this.currentUser
    }
  }

  async refreshToken(): Promise<{ token: string }> {
    await delay(200)
    
    if (!this.currentUser) {
      throw new Error('Not authenticated')
    }

    const newToken = generateMockToken()
    this.saveAuthState(newToken, this.currentUser)
    
    return { token: newToken }
  }

  // Stock boost methods
  async getActiveBoosts(): Promise<ApiResponse<StockBoost[]>> {
    await delay(300)
    
    if (!this.currentUser) {
      throw new Error('Not authenticated')
    }

    const activeBoosts = this.stockBoosts.filter(boost => boost.status === 'active')
    
    return {
      success: true,
      data: activeBoosts
    }
  }

  async getHistoricalBoosts(page = 1, limit = 20): Promise<PaginatedResponse<StockBoost>> {
    await delay(400)
    
    if (!this.currentUser) {
      throw new Error('Not authenticated')
    }

    const historicalBoosts = this.stockBoosts.filter(boost => boost.status === 'completed')
    
    // Simple pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedBoosts = historicalBoosts.slice(startIndex, endIndex)
    
    return {
      success: true,
      data: {
        boosts: paginatedBoosts,
        pagination: {
          page,
          limit,
          total: historicalBoosts.length,
          totalPages: Math.ceil(historicalBoosts.length / limit)
        }
      }
    }
  }

  async createBoost(boost: CreateBoostRequest): Promise<ApiResponse<StockBoost>> {
    await delay(500)
    
    if (!this.currentUser) {
      throw new Error('Not authenticated')
    }

    const { sku, amount } = boost
    
    if (!sku || !amount) {
      throw new Error('SKU and amount are required')
    }
    
    const skuData = mockSKUs.find(s => s.sku === sku)
    if (!skuData) {
      throw new Error('SKU not found')
    }
    
    const newId = Math.max(...this.stockBoosts.map(b => b.id), 0) + 1
    
    const newBoost: StockBoost = {
      id: newId,
      sku,
      amount,
      status: 'active',
      sourceProductId: newId,
      createdAt: new Date().toISOString(),
      sourceStock: skuData.currentStock || 0,
      targetStocks: [
        {
          id: newId * 10 + 1,
          syncback_job_id: newId * 100,
          item_id: `ITEM-${sku}-A`,
          variation_id: `VAR-${newId}`,
          sku: `${sku}-TARGET`,
          current_quantity: Math.floor(amount * 0.4),
          booked_quantity: Math.floor(amount * 0.1),
          to_sync: true,
          amount: amount,
          boost_quantity: amount,
          sellable_quantity: Math.floor(amount * 1.5)
        }
      ]
    }
    
    this.stockBoosts.push(newBoost)
    
    return {
      success: true,
      data: newBoost
    }
  }

  async deactivateBoost(id: number, _request: DeactivateBoostRequest): Promise<ApiResponse<StockBoost>> {
    await delay(400)
    
    if (!this.currentUser) {
      throw new Error('Not authenticated')
    }

    const boostIndex = this.stockBoosts.findIndex(boost => boost.id === id)
    
    if (boostIndex === -1) {
      throw new Error('Boost not found')
    }
    
    // Mark as completed instead of actually deleting
    this.stockBoosts[boostIndex] = {
      ...this.stockBoosts[boostIndex],
      status: 'completed'
    }
    
    return {
      success: true,
      data: this.stockBoosts[boostIndex]
    }
  }

  async syncNow(id: number): Promise<SyncNowResponse> {
    await delay(600)
    
    if (!this.currentUser) {
      throw new Error('Not authenticated')
    }

    const boostIndex = this.stockBoosts.findIndex(boost => boost.id === id)
    
    if (boostIndex === -1) {
      throw new Error('Boost not found')
    }
    
    // Simulate sync response - message and data at root level
    return {
      success: true,
      message: `Sync initiated for boost ${id}`,
      data: [
        {
          syncback_job: 'Shopee Malaysia Sync',
          last_synced_at: new Date().toISOString(),
          last_synced_status: 'success'
        },
        {
          syncback_job: 'Lazada Thailand Sync',
          last_synced_at: null,
          last_synced_status: null
        },
        {
          syncback_job: 'TikTok Shop Vietnam Sync',
          last_synced_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
          last_synced_status: 'success'
        }
      ]
    }
  }

  // SKU methods
  async searchSKUs(query: string, limit = 10): Promise<ApiResponse<SKU[]>> {
    await delay(200)
    
    if (!this.currentUser) {
      throw new Error('Not authenticated')
    }
    
    if (!query) {
      throw new Error('Search query is required')
    }
    
    const filteredSKUs = mockSKUs.filter(sku => 
      (sku.id && sku.id.toLowerCase().includes(query.toLowerCase())) ||
      sku.sku.toLowerCase().includes(query.toLowerCase()) ||
      sku.name.toLowerCase().includes(query.toLowerCase()) ||
      sku.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit)
    
    return {
      success: true,
      data: filteredSKUs
    }
  }

  // Syncback methods
  async getSyncbackInfo(): Promise<ApiResponse<SyncbackInfo>> {
    await delay(200)
    
    if (!this.currentUser) {
      throw new Error('Not authenticated')
    }
    
    return {
      success: true,
      data: mockSyncbackInfo
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.authToken && !!this.currentUser
  }

  getToken(): string | null {
    return this.authToken
  }

  getCurrentUserSync(): User | null {
    return this.currentUser
  }
}

export const mockApiClient = new MockApiClient()
export default MockApiClient