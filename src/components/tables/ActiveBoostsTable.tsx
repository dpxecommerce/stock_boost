'use client'

import { useState } from 'react'
import { useActiveBoosts, useDeactivateBoost } from '@/lib/hooks/use-boosts'
import { useSyncbackInfo, getSyncbackName } from '@/lib/hooks/use-syncback-info'
import { StockBoost } from '@/types/boost'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface ActiveBoostsTableProps {
  className?: string
}

export default function ActiveBoostsTable({ className }: ActiveBoostsTableProps) {
  const { data: boosts = [], isLoading, error, refetch } = useActiveBoosts()
  const { data: syncbackInfo } = useSyncbackInfo()
  const deactivateBoostMutation = useDeactivateBoost()
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

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

  const toggleRow = (boostId: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(boostId)) {
      newExpanded.delete(boostId)
    } else {
      newExpanded.add(boostId)
    }
    setExpandedRows(newExpanded)
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                  {/* Expand column */}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Boost Amount
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
              {boosts.map((boost: StockBoost) => {
                const isExpanded = expandedRows.has(boost.id)
                const hasTargets = boost.targetStocks && boost.targetStocks.length > 0
                
                return (
                  <>
                    {/* Main row */}
                    <tr key={boost.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasTargets && (
                          <button
                            onClick={() => toggleRow(boost.id)}
                            className="text-gray-500 hover:text-gray-700 transition-transform duration-200"
                            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {boost.sku}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {boost.sourceStock !== undefined ? formatQuantity(boost.sourceStock) : '-'}
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
                    
                    {/* Expanded target stocks sub-rows */}
                    {isExpanded && hasTargets && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="ml-8">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">
                              Target Stocks ({boost.targetStocks.length})
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-300 border border-gray-300 rounded-md">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                      Syncback
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                      Item ID
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                      Variation ID
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                      Booked Qty
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                      Sellable Qty
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {boost.targetStocks.map((target) => (
                                    <tr key={target.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex flex-col">
                                          <span className="font-medium">{getSyncbackName(syncbackInfo, target.syncback_job_id)}</span>
                                          <span className="text-xs text-gray-500">ID: {target.syncback_job_id}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                        {target.item_id}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                        {target.variation_id || '-'}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                                        {formatQuantity(target.booked_quantity)}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600 font-semibold text-right">
                                        {formatQuantity(target.sellable_quantity)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
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