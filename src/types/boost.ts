export interface StockBoost {
  id: number
  sku: string
  status: 'active' | 'inactive' | 'completed'
  amount: number
  sourceProductId: number
  createdAt: string
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
  stockLastUpdatedAt?: string
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