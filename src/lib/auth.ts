import { api } from './api/factory'
import { User } from '@/types/auth'

// Client-side authentication utilities for static export
export class AuthManager {
  private static instance: AuthManager
  private currentUser: User | null = null
  private listeners: ((user: User | null) => void)[] = []

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return api.isAuthenticated()
  }

  // Get current user (cached)
  getCurrentUser(): User | null {
    return this.currentUser
  }

  // Set current user and notify listeners
  setCurrentUser(user: User | null): void {
    this.currentUser = user
    this.listeners.forEach(listener => listener(user))
  }

  // Subscribe to auth state changes
  subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Login user
  async login(credentials: { username: string; password: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.login(credentials)
      if (response.success && response.data?.user) {
        this.setCurrentUser(response.data.user)
        return { success: true }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' }
    }
  }

  // Logout user
  async logout(): Promise<void> {
    await api.logout()
    this.setCurrentUser(null)
  }

  // Load user from token (for app initialization)
  async loadUser(): Promise<User | null> {
    if (!this.isAuthenticated()) {
      return null
    }

    try {
      const response = await api.getCurrentUser()
      if (response.success && response.data) {
        this.setCurrentUser(response.data)
        return response.data
      } else {
        // Token is invalid, clear it
        await this.logout()
        return null
      }
    } catch {
      // Error loading user, clear token
      await this.logout()
      return null
    }
  }

  // Refresh token if needed
  async refreshTokenIfNeeded(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false
    }

    try {
      await api.refreshToken()
      return true
    } catch {
      await this.logout()
      return false
    }
  }
}

export const authManager = AuthManager.getInstance()