export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: any
}

export interface PaginatedResponse<T> extends ApiResponse {
  data?: {
    boosts?: T[]
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface ValidationError {
  field: string
  message: string
}

export interface ApiError {
  message: string
  code?: string
  details?: ValidationError[]
}