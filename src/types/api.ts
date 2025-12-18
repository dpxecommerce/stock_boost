export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  details?: Record<string, unknown>
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

export interface SyncbackInfo {
  [syncbackJobId: string]: string
}

export interface SyncJobResult {
  syncback_job: string
  last_synced_at: string | null
  last_synced_status: string | null
}

export interface SyncNowResponse extends ApiResponse {
  message: string
  data: SyncJobResult[]
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