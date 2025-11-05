import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Hoist mocks before any imports
const { mockPush, mockRefresh, mockLogin } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockLogin: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

vi.mock('@/lib/auth', () => ({
  authManager: {
    login: mockLogin,
    isAuthenticated: () => false,
    getCurrentUser: () => null,
  },
}))

import { LoginForm } from '@/components/forms/LoginForm'

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully login with valid credentials and redirect to dashboard', async () => {
    // Mock successful login response
    mockLogin.mockResolvedValueOnce({
      success: true,
      data: {
        id: 'user-1',
        username: 'admin',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
    })

    render(<LoginForm />)

    // Fill in login form
    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(usernameInput, { target: { value: 'admin' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Verify authManager.login was called
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'admin',
        password: 'password123',
      })
    })

    // Verify redirect to dashboard
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('should show error message with invalid credentials', async () => {
    // Mock failed login response
    mockLogin.mockResolvedValueOnce({
      success: false,
      error: 'Invalid username or password',
    })

    render(<LoginForm />)

    // Fill in login form with invalid credentials
    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(usernameInput, { target: { value: 'wronguser' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpass123' } })
    fireEvent.click(submitButton)

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Invalid username or password')).toBeInTheDocument()
    })

    // Verify no redirect occurred
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should show loading state during login attempt', async () => {
    // Mock delayed response
    mockLogin.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
                data: { id: 'user-1', username: 'admin' },
              }),
            100
          )
        )
    )

    render(<LoginForm />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(usernameInput, { target: { value: 'admin' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Verify loading state
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('should handle network errors gracefully', async () => {
    // Mock network error - authManager catches errors and returns error message
    mockLogin.mockResolvedValueOnce({
      success: false,
      error: 'Network error',
    })

    render(<LoginForm />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(usernameInput, { target: { value: 'admin' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Verify generic error message is displayed (from authManager catch block)
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })
})