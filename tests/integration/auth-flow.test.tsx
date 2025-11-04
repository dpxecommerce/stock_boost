import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/components/forms/LoginForm'

// Mock Next.js router
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    refresh: mockRefresh,
  })),
}))

// Mock authManager
const mockLogin = vi.fn()
vi.mock('@/lib/auth', () => ({
  authManager: {
    login: mockLogin,
  },
}))

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
      error: 'Invalid credentials',
    })

    render(<LoginForm />)

    // Fill in login form with invalid credentials
    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(usernameInput, { target: { value: 'wrong' } })
    fireEvent.change(passwordInput, { target: { value: 'wrong' } })
    fireEvent.click(submitButton)

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
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
    // Mock network error
    mockLogin.mockRejectedValueOnce(new Error('Network error'))

    render(<LoginForm />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(usernameInput, { target: { value: 'admin' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Verify generic error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument()
    })
  })
})