'use client'

import { useState, useEffect } from 'react'
import { useCreateBoost, useSkuSearch } from '@/lib/hooks/use-boosts'
import { CreateBoostRequest } from '@/types/boost'
import { CreateBoostSchema } from '@/lib/validations'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface AddBoostFormProps {
  onSuccess: () => void
  onCancel: () => void
  className?: string
}

interface FormErrors {
  sku?: string
  amount?: string
  general?: string
}

export default function AddBoostForm({
  onSuccess,
  onCancel,
  className
}: AddBoostFormProps) {
  const [formData, setFormData] = useState<CreateBoostRequest>({
    sku: '',
    amount: 0
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [skuQuery, setSkuQuery] = useState('')
  const [showSkuDropdown, setShowSkuDropdown] = useState(false)

  const createBoostMutation = useCreateBoost()
  const { data: skus = [], isLoading: isSearching } = useSkuSearch(skuQuery, 10)

  // Reset form when success
  useEffect(() => {
    if (createBoostMutation.isSuccess) {
      onSuccess()
    }
  }, [createBoostMutation.isSuccess, onSuccess])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required'
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    // Additional validation using Zod schema
    try {
      CreateBoostSchema.parse(formData)
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => {
          if (err.path.length > 0) {
            const field = err.path[0] as keyof FormErrors
            newErrors[field] = err.message
          }
        })
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await createBoostMutation.mutateAsync(formData)
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Error creating boost'
      })
    }
  }

  const handleSkuChange = (value: string) => {
    setFormData(prev => ({ ...prev, sku: value }))
    setSkuQuery(value)
    setShowSkuDropdown(value.length > 0)
    
    // Clear SKU error when user starts typing
    if (errors.sku) {
      setErrors(prev => ({ ...prev, sku: undefined }))
    }
  }

  const handleSkuSelect = (sku: string) => {
    setFormData(prev => ({ ...prev, sku }))
    setSkuQuery(sku)
    setShowSkuDropdown(false)
    
    // Clear SKU error
    if (errors.sku) {
      setErrors(prev => ({ ...prev, sku: undefined }))
    }
  }

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0
    setFormData(prev => ({ ...prev, amount }))
    
    // Clear amount error when user starts typing
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: undefined }))
    }
  }

  const isLoading = createBoostMutation.isPending

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {errors.general && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {errors.general}
        </div>
      )}

      {/* SKU Field with Search */}
      <div className="relative">
        <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
          SKU
        </label>
        <Input
          id="sku"
          type="text"
          value={skuQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSkuChange(e.target.value)}
          placeholder="Search for SKU..."
          error={errors.sku}
          disabled={isLoading}
          autoComplete="off"
        />
        
        {/* SKU Dropdown */}
        {showSkuDropdown && skus.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {isSearching && (
              <div className="px-4 py-2 text-gray-500 text-sm">
                Searching...
              </div>
            )}
            {skus.map((sku) => (
              <button
                key={sku.sku}
                type="button"
                onClick={() => handleSkuSelect(sku.sku)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                <div className="font-medium">{sku.sku}</div>
                <div className="text-sm text-gray-500">{sku.name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Amount Field */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <Input
          id="amount"
          type="number"
          value={formData.amount || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAmountChange(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          error={errors.amount}
          disabled={isLoading}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Boost'}
        </Button>
      </div>
    </form>
  )
}