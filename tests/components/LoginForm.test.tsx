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

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form with username and password fields', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should show validation errors for invalid username', async () => {
    render(<LoginForm />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Enter invalid username (too short)
    fireEvent.change(usernameInput, { target: { value: 'ab' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Should show validation error for username
    await waitFor(() => {
      expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument()
    })
  })

  it('should show validation errors for invalid password', async () => {
    render(<LoginForm />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Enter invalid password (too short)
    fireEvent.change(usernameInput, { target: { value: 'admin' } })
    fireEvent.change(passwordInput, { target: { value: 'pass' } })
    fireEvent.click(submitButton)

    // Should show validation error for password
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    })
  })

  it('should disable form inputs and button during submission', async () => {
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

    // Verify inputs and button are disabled during submission
    expect(usernameInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it('should clear errors on new form submission', async () => {
    // First submission with error
    mockLogin.mockResolvedValueOnce({
      success: false,
      error: 'Invalid username or password',
    })

    render(<LoginForm />)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(usernameInput, { target: { value: 'wronguser' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpass123' } })
    fireEvent.click(submitButton)

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Invalid username or password')).toBeInTheDocument()
    })

    // Verify error is visible
    expect(screen.getByText('Invalid username or password')).toBeInTheDocument()

    // Second submission (successful)
    mockLogin.mockResolvedValueOnce({
      success: true,
      data: { user: { id: 'user-1', username: 'admin' } },
    })

    fireEvent.change(usernameInput, { target: { value: 'admin' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Error should be cleared immediately when form is submitted
    await waitFor(() => {
      expect(screen.queryByText('Invalid username or password')).not.toBeInTheDocument()
    })
  })

  it('should update form state when typing in inputs', () => {
    render(<LoginForm />)

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.change(passwordInput, { target: { value: 'testpass' } })

    expect(usernameInput.value).toBe('testuser')
    expect(passwordInput.value).toBe('testpass')
  })
})