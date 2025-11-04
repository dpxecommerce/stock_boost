import { z } from 'zod'

// Authentication schemas
export const LoginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters').regex(/^[A-Za-z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password must be less than 100 characters')
})

// Stock boost schemas
export const CreateBoostSchema = z.object({
  sku: z.string().min(3, 'SKU must be at least 3 characters').max(50, 'SKU must be less than 50 characters').regex(/^[A-Za-z0-9_-]+$/, 'SKU can only contain letters, numbers, hyphens, and underscores'),
  amount: z.number().positive('Amount must be positive').max(999999.99, 'Amount must be less than 1,000,000').refine((val) => Number((val * 100).toFixed(0)) / 100 === val, {
    message: 'Amount can have at most 2 decimal places'
  }),
  expiresAt: z.date().optional().nullable()
})

export const DeactivateBoostSchema = z.object({
  reason: z.enum(['manual'], { message: 'Deactivation reason is required' })
})

// SKU schemas
export const SKUSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query must be less than 100 characters'),
  limit: z.number().int().min(1).max(100).optional().default(10)
})

// Pagination schemas
export const PaginationSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20)
})