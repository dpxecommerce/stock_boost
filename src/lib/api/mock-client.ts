import { AuthResponse, User } from '@/types/auth'
import { StockBoost, SKU, CreateBoostRequest, DeactivateBoostRequest } from '@/types/boost'
import { ApiResponse, PaginatedResponse } from '@/types/api'

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
    id: 'boost-1',
    sku: 'SKU-001',
    productName: 'Premium Widget A',
    currentStock: 45,
    targetStock: 100,
    boostAmount: 55,
    amount: 55,
    priority: 'high',
    status: 'active',
    estimatedCost: 2750.00,
    supplier: 'Widget Corp',
    createdAt: new Date('2024-11-01T10:00:00Z'),
    updatedAt: new Date('2024-11-01T10:00:00Z'),
    createdBy: 'user-1',
    deactivatedAt: null,
    deactivationReason: null,
    expiresAt: null
  },
  {
    id: 'boost-2',
    sku: 'SKU-002', 
    productName: 'Standard Widget B',
    currentStock: 12,
    targetStock: 50,
    boostAmount: 38,
    amount: 38,
    priority: 'medium',
    status: 'active',
    estimatedCost: 1140.00,
    supplier: 'Global Supplies',
    createdAt: new Date('2024-11-02T14:30:00Z'),
    updatedAt: new Date('2024-11-02T14:30:00Z'),
    createdBy: 'user-1',
    deactivatedAt: null,
    deactivationReason: null,
    expiresAt: null
  },
  {
    id: 'boost-3',
    sku: 'SKU-003',
    productName: 'Economy Widget C', 
    currentStock: 78,
    targetStock: 80,
    boostAmount: 2,
    amount: 2,
    priority: 'low',
    status: 'completed',
    estimatedCost: 60.00,
    supplier: 'Budget Parts',
    createdAt: new Date('2024-10-30T09:15:00Z'),
    updatedAt: new Date('2024-11-01T16:45:00Z'),
    createdBy: 'user-2',
    completedAt: new Date('2024-11-01T16:45:00Z'),
    deactivatedAt: null,
    deactivationReason: null,
    expiresAt: null
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
      data: paginatedBoosts,
      pagination: {
        page,
        limit,
        total: historicalBoosts.length,
        totalPages: Math.ceil(historicalBoosts.length / limit)
      }
    }
  }

  async createBoost(boost: CreateBoostRequest): Promise<ApiResponse<StockBoost>> {
    await delay(500)
    
    if (!this.currentUser) {
      throw new Error('Not authenticated')
    }

    const { sku, amount, targetStock, priority, estimatedCost, supplier } = boost
    
    if (!sku || (!amount && !targetStock) || !priority) {
      throw new Error('SKU, amount/target stock, and priority are required')
    }
    
    const skuData = mockSKUs.find(s => s.id === sku)
    if (!skuData) {
      throw new Error('SKU not found')
    }
    
    const finalAmount = amount || (targetStock ? targetStock - (skuData.currentStock || 0) : 0)
    
    const newBoost: StockBoost = {
      id: 'boost-' + Math.random().toString(36).substr(2, 9),
      sku,
      productName: skuData.name,
      currentStock: skuData.currentStock,
      targetStock: targetStock || (skuData.currentStock || 0) + finalAmount,
      boostAmount: finalAmount,
      amount: finalAmount,
      priority,
      status: 'active',
      estimatedCost: parseFloat(estimatedCost?.toString() || '0'),
      supplier: supplier || 'TBD',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: this.currentUser.id,
      deactivatedAt: null,
      deactivationReason: null,
      expiresAt: boost.expiresAt || null
    }
    
    this.stockBoosts.push(newBoost)
    
    return {
      success: true,
      data: newBoost
    }
  }

  async deactivateBoost(id: string, request: DeactivateBoostRequest): Promise<ApiResponse<StockBoost>> {
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
      status: 'completed',
      completedAt: new Date(),
      completionReason: request.reason || 'Manual deactivation',
      updatedAt: new Date()
    }
    
    return {
      success: true,
      data: this.stockBoosts[boostIndex]
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