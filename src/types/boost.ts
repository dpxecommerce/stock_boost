export interface StockBoost {
  id: string
  sku: string
  productName?: string
  currentStock?: number
  targetStock?: number
  boostAmount?: number
  amount: number
  priority?: 'high' | 'medium' | 'low'
  status: 'active' | 'inactive' | 'completed'
  estimatedCost?: number
  supplier?: string
  createdAt: Date
  updatedAt?: Date
  createdBy: string
  deactivatedAt: Date | null
  deactivationReason: 'expired' | 'manual' | null
  expiresAt: Date | null
  completedAt?: Date
  completionReason?: string
}

export interface SKU {
  id?: string
  sku: string
  name: string
  category: string
  currentStock?: number
  isActive: boolean
  lastUsed: Date | null
  // Additional Typesense fields
  itemNo2?: string
  client?: string
  textMatch?: number
}

export interface CreateBoostRequest {
  sku: string
  amount: number
  targetStock?: number
  priority?: 'high' | 'medium' | 'low'
  estimatedCost?: number
  supplier?: string
}

export interface DeactivateBoostRequest {
  reason: 'manual' | string
}