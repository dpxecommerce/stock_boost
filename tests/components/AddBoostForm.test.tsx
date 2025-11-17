import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AddBoostForm from '../../src/components/forms/AddBoostForm'
import { api } from '../../src/lib/api/factory'
import type { SKU } from '../../src/types/boost'

// Mock the API factory
vi.mock('../../src/lib/api/factory')

const mockedApi = vi.mocked(api)

const mockSkus: SKU[] = [
  { sku: 'SKU-001', name: 'Product 1', category: 'Electronics', isActive: true, lastUsed: null },
  { sku: 'SKU-002', name: 'Product 2', category: 'Clothing', isActive: true, lastUsed: null },
  { sku: 'SKU-003', name: 'Product 3', category: 'Books', isActive: true, lastUsed: null }
]

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('AddBoostForm Component', () => {
  const mockOnSuccess = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock API responses
    mockedApi.searchSKUs.mockResolvedValue({
      success: true,
      data: mockSkus
    })
    
    mockedApi.createBoost.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        sku: 'SKU-001',
        amount: 10,
        status: 'active',
        sourceProductId: 1,
        createdAt: '2024-01-01T00:00:00Z'
      }
    })
  })

  it('should render form fields correctly', async () => {
    render(
      <AddBoostForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    )

    // Check form fields are present
    expect(screen.getByLabelText('SKU')).toBeInTheDocument()
    expect(screen.getByLabelText('Amount')).toBeInTheDocument()
    expect(screen.getByText('Create Boost')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('should show validation errors for invalid input', async () => {
    render(
      <AddBoostForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    )

    // Try to submit empty form
    const submitButton = screen.getByText('Create Boost')
    fireEvent.click(submitButton)

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/sku is required/i)).toBeInTheDocument()
      expect(screen.getByText(/amount must be greater than 0/i)).toBeInTheDocument()
    })
  })

  it('should search for SKUs when typing in SKU field', async () => {
    render(
      <AddBoostForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    )

    const skuInput = screen.getByLabelText('SKU')
    
    // Type in SKU field
    fireEvent.change(skuInput, { target: { value: 'SKU' } })

    // Should call search API
    await waitFor(() => {
      expect(mockedApi.searchSKUs).toHaveBeenCalledWith('SKU', 10)
    })
  })

  it('should submit form with valid data', async () => {
    render(
      <AddBoostForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    )

    // Fill out form
    const skuSelect = screen.getByLabelText('SKU')
    fireEvent.change(skuSelect, { target: { value: 'SKU-001' } })

    const amountInput = screen.getByLabelText('Amount')
    fireEvent.change(amountInput, { target: { value: '10.00' } })

    // Submit form
    const submitButton = screen.getByText('Create Boost')
    fireEvent.click(submitButton)

    // Should call create API
    await waitFor(() => {
      expect(mockedApi.createBoost).toHaveBeenCalledWith({
        sku: 'SKU-001',
        amount: 10.00
      })
    })

    // Should call onSuccess callback
    expect(mockOnSuccess).toHaveBeenCalled()
  })

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <AddBoostForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    )

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should handle API errors gracefully', async () => {
    // Mock API error
    mockedApi.createBoost.mockRejectedValue(new Error('Create boost failed'))

    render(
      <AddBoostForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    )

    // Fill out and submit form
    const skuSelect = screen.getByLabelText('SKU')
    fireEvent.change(skuSelect, { target: { value: 'SKU-001' } })

    const amountInput = screen.getByLabelText('Amount')
    fireEvent.change(amountInput, { target: { value: '10.00' } })

    const submitButton = screen.getByText('Create Boost')
    fireEvent.click(submitButton)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/create boost failed/i)).toBeInTheDocument()
    })

    // Should not call onSuccess
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('should validate amount is a positive number', async () => {
    render(
      <AddBoostForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { wrapper: createWrapper() }
    )

    const skuInput = screen.getByLabelText('SKU')
    fireEvent.change(skuInput, { target: { value: 'SKU-001' } })

    // Type SKU to trigger selection
    await waitFor(() => {
      expect(mockedApi.searchSKUs).toHaveBeenCalled()
    })

    // Try negative amount
    const amountInput = screen.getByLabelText('Amount')
    fireEvent.change(amountInput, { target: { value: '-5' } })

    const submitButton = screen.getByText('Create Boost')
    fireEvent.click(submitButton)

    // Verify create API was NOT called
    expect(mockedApi.createBoost).not.toHaveBeenCalled()
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })
})