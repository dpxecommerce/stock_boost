'use client'

import { useState } from 'react'
import { useActiveBoosts, useDeactivateBoost } from '@/lib/hooks/use-boosts'
import { StockBoost } from '@/types/boost'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface ActiveBoostsTableProps {
  className?: string
}

export default function ActiveBoostsTable({ className }: ActiveBoostsTableProps) {
  const { data: boosts = [], isLoading, error, refetch } = useActiveBoosts()
  const deactivateBoostMutation = useDeactivateBoost()
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null)

  const handleDeactivate = async (boost: StockBoost) => {
    if (deactivatingId) return // Prevent multiple simultaneous deactivations

    try {
      setDeactivatingId(boost.id)
      await deactivateBoostMutation.mutateAsync({
        id: boost.id,
        request: { reason: 'manual' }
      })
    } catch (error) {
      console.error('Failed to deactivate boost:', error)
      // Error is handled by the mutation's onError callback
    } finally {
      setDeactivatingId(null)
    }
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const formatQuantity = (amount: number) => {
    return Math.floor(amount).toLocaleString('en-US')
  }

  if (isLoading) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading active boosts...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('w-full', className)}>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            Error loading active boosts: {error.message}
          </div>
          <Button onClick={() => refetch()} variant="secondary">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (boosts.length === 0) {
    return (
      <div className={cn('w-full', className)}>
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            No active boosts found
          </div>
          <p className="text-sm text-gray-400">
            Create your first boost to get started
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {boosts.map((boost: StockBoost) => (
                <tr key={boost.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {boost.sku}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatQuantity(boost.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {boost.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(boost.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeactivate(boost)}
                      disabled={deactivatingId === boost.id || deactivateBoostMutation.isPending}
                    >
                      {deactivatingId === boost.id ? 'Deactivating...' : 'Deactivate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer with summary */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Total active boosts: {boosts.length}
          </div>
        </div>
      </div>
    </div>
  )
}