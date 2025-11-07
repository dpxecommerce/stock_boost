'use client'

import { useState } from 'react'
import { useHistoricalBoosts } from '@/lib/hooks/use-boosts'
import { StockBoost } from '@/types/boost'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface HistoricalBoostsTableProps {
  className?: string
}

export default function HistoricalBoostsTable({ className }: HistoricalBoostsTableProps) {
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading, error, refetch } = useHistoricalBoosts(page, limit)
  
  const boosts = data?.boosts || []
  const pagination = data?.pagination

  const formatDate = (date: Date) => {
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

  const getReasonBadge = (boost: StockBoost) => {
    if (boost.deactivationReason === 'manual') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          Manual
        </span>
      )
    }
    if (boost.deactivationReason === 'expired') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
          Expired
        </span>
      )
    }
    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
        Unknown
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading historical boosts...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('w-full', className)}>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            Error loading historical boosts: {error.message}
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
            No historical boosts found
          </div>
          <p className="text-sm text-gray-400">
            Deactivated boosts will appear here
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
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deactivated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {boosts.map((boost) => (
                <tr key={boost.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {boost.sku}
                    </div>
                    {boost.productName && (
                      <div className="text-xs text-gray-500">{boost.productName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatQuantity(boost.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {boost.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getReasonBadge(boost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(boost.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {boost.deactivatedAt ? formatDate(boost.deactivatedAt) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer with pagination */}
        {pagination && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center px-3 text-sm text-gray-700">
                  Page {page} of {pagination.totalPages}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
