export interface User {
  id: string
  username: string
  email?: string
  role?: string
  createdAt: Date
  lastLoginAt: Date | null
}

export interface UserWithPassword extends User {
  passwordHash: string
}

export interface Session {
  userId: string
  username: string
  iat?: number
  exp?: number
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  success: boolean
  data?: {
    token?: string
    user?: User
  }
  error?: string
}