export interface TargetStock {
  id: number
  syncback_job_id: number
  item_id: string
  variation_id: string | null
  sku: string
  current_quantity: number
  booked_quantity: number
  to_sync: boolean
  amount: number
  boost_quantity: number
  sellable_quantity: number
}

export interface StockBoost {
  id: number
  sku: string
  status: 'active' | 'inactive' | 'completed'
  amount: number
  sourceProductId: number
  createdAt: string
  sourceStock: number
  targetStocks: TargetStock[]
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