import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from '../../src/app/dashboard/page'
import { api } from '../../src/lib/api/factory'
import { authManager } from '../../src/lib/auth'
import type { StockBoost, SKU } from '../../src/types/boost'
import type { User } from '../../src/types/auth'

// Mock the API factory and auth manager
vi.mock('../../src/lib/api/factory')
vi.mock('../../src/lib/auth')

const mockedApi = vi.mocked(api)
const mockedAuthManager = vi.mocked(authManager)

// Mock data
const mockUser: User = {
  id: '1',
  username: 'testuser',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  lastLoginAt: new Date('2024-01-01T00:00:00Z')
}

const mockActiveBoosts: StockBoost[] = [
  {
    id: '1',
    sku: 'TEST-SKU-1',
    amount: 10.00,
    status: 'active',
    createdBy: '1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    deactivatedAt: null,
    deactivationReason: null,
    expiresAt: null
  },
  {
    id: '2',
    sku: 'TEST-SKU-2', 
    amount: 15.00,
    status: 'active',
    createdBy: '1',
    createdAt: new Date('2024-01-02T00:00:00Z'),
    deactivatedAt: null,
    deactivationReason: null,
    expiresAt: null
  }
]

const mockSkus: SKU[] = [
  { sku: 'TEST-SKU-1', name: 'Test Product 1', category: 'Electronics', isActive: true, lastUsed: null },
  { sku: 'TEST-SKU-2', name: 'Test Product 2', category: 'Electronics', isActive: true, lastUsed: null },
  { sku: 'TEST-SKU-3', name: 'Test Product 3', category: 'Electronics', isActive: true, lastUsed: null }
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

describe('Boost Management Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock auth manager
    vi.mocked(mockedAuthManager.getCurrentUser).mockReturnValue(mockUser)
    vi.mocked(mockedAuthManager.isAuthenticated).mockReturnValue(true)
    
    // Mock API responses
    vi.mocked(mockedApi.getActiveBoosts).mockResolvedValue({
      success: true,
      data: mockActiveBoosts
    })
    
    vi.mocked(mockedApi.searchSKUs).mockResolvedValue({
      success: true,
      data: mockSkus
    })
    
    vi.mocked(mockedApi.createBoost).mockResolvedValue({
      success: true,
      data: {
        id: '3',
        sku: 'TEST-SKU-3',
        amount: 5.00,
        status: 'active' as const,
        createdBy: '1',
        createdAt: new Date('2024-01-03T00:00:00Z'),
        deactivatedAt: null,
        deactivationReason: null,
        expiresAt: null
      }
    })
    
    vi.mocked(mockedApi.deactivateBoost).mockResolvedValue({
      success: true,
      data: {
        id: '1',
        sku: 'TEST-SKU-1',
        amount: 10.00,
        status: 'inactive' as const,
        createdBy: '1',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        deactivatedAt: new Date(),
        deactivationReason: 'manual' as const,
        expiresAt: null
      }
    })
  })

  it('should display active boosts in a table', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    
    // Should show active boosts tab by default
    expect(screen.getByText('Active Boosts')).toBeInTheDocument()
    
    // Wait for boosts to load
    await waitFor(() => {
      expect(screen.getByText('TEST-SKU-1')).toBeInTheDocument()
      expect(screen.getByText('TEST-SKU-2')).toBeInTheDocument()
    })
    
    // Verify API was called
    expect(mockedApi.getActiveBoosts).toHaveBeenCalledTimes(1)
  })

  it('should open modal when add boost button is clicked', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    
    // Find and click the add boost button
    const addButton = await screen.findByText('Add Boost')
    fireEvent.click(addButton)
    
    // Modal should be visible
    await waitFor(() => {
      expect(screen.getByText('Create New Stock Boost')).toBeInTheDocument()
    })
  })

  it('should create a new boost through the modal form', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    
    // Open modal
    const addButton = await screen.findByText('Add Boost')
    fireEvent.click(addButton)
    
    // Fill out form
    await waitFor(() => {
      expect(screen.getByText('Create New Stock Boost')).toBeInTheDocument()
    })
    
    // Select SKU
    const skuSelect = screen.getByLabelText('SKU')
    fireEvent.change(skuSelect, { target: { value: 'TEST-SKU-3' } })
    
    // Enter amount
    const amountInput = screen.getByLabelText('Amount')
    fireEvent.change(amountInput, { target: { value: '5.00' } })
    
    // Submit form
    const submitButton = screen.getByText('Create Boost')
    fireEvent.click(submitButton)
    
    // Verify API was called
    await waitFor(() => {
      expect(mockedApi.createBoost).toHaveBeenCalledWith({
        sku: 'TEST-SKU-3',
        amount: 5.00
      })
    })
    
    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Create New Stock Boost')).not.toBeInTheDocument()
    })
  })

  it('should deactivate a boost when deactivate button is clicked', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })
    
    // Wait for boosts to load
    await waitFor(() => {
      expect(screen.getByText('TEST-SKU-1')).toBeInTheDocument()
    })
    
    // Find and click deactivate button for first boost
    const deactivateButtons = screen.getAllByText('Deactivate')
    fireEvent.click(deactivateButtons[0])
    
    // Verify API was called
    await waitFor(() => {
      expect(mockedApi.deactivateBoost).toHaveBeenCalledWith('1', { reason: 'manual' })
    })
  })

  it('should handle API errors gracefully', async () => {
    // Mock API error
    vi.mocked(mockedApi.getActiveBoosts).mockRejectedValue(new Error('Failed to load boosts'))
    
    render(<Dashboard />, { wrapper: createWrapper() })
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})