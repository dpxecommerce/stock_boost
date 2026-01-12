'use client'

import { useState, useEffect } from 'react'
import { useActiveBoosts, useDeactivateBoost, useSyncNow } from '@/lib/hooks/use-boosts'
import { useSyncbackInfo, getSyncbackName } from '@/lib/hooks/use-syncback-info'
import { useSkuDescription } from '@/contexts/SkuDescriptionContext'
import { StockBoost } from '@/types/boost'
import { SyncNowResponse } from '@/types/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface ActiveBoostsTableProps {
  className?: string
  filter?: string
}

function SkuCell({ sku }: { sku: string }) {
  const { getDetail } = useSkuDescription()
  const [description, setDescription] = useState<string | null>(null)

  useEffect(() => {
    getDetail(sku).then(setDescription)
  }, [sku, getDetail])

  return (
    <div className="text-sm font-medium text-gray-900">
      {sku}
      {description && (
        <div className="text-xs text-gray-500 mt-1">
          {description}
        </div>
      )}
    </div>
  )
}

export default function ActiveBoostsTable({ className, filter = '' }: ActiveBoostsTableProps) {
  const { data: boosts = [], isLoading, error, refetch } = useActiveBoosts()
  const { data: syncbackInfo } = useSyncbackInfo()
  const deactivateBoostMutation = useDeactivateBoost()
  const syncNowMutation = useSyncNow()
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null)
  const [syncingId, setSyncingId] = useState<number | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [syncResult, setSyncResult] = useState<SyncNowResponse | null>(null)
  const [showSyncModal, setShowSyncModal] = useState(false)

  // Filter boosts based on filter prop
  const filteredBoosts = boosts.filter((boost: StockBoost) => {
    if (!filter.trim()) return true
    
    const searchTerm = filter.toLowerCase().trim()
    
    // Check SKU
    if (boost.sku?.toLowerCase().includes(searchTerm)) return true
    
    // Check allSkus array
    if (boost.allSkus?.some(sku => sku?.toLowerCase().includes(searchTerm))) return true
    
    // Check if there's a description field in targetStocks or other fields
    // Note: Based on the StockBoost interface, there doesn't seem to be a description field,
    // but we can check targetStocks SKUs as well
    if (boost.targetStocks?.some(target => target.sku?.toLowerCase().includes(searchTerm))) return true
    
    return false
  })

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

  const handleSyncNow = async (boost: StockBoost) => {
    if (syncingId) return // Prevent multiple simultaneous syncs

    try {
      setSyncingId(boost.id)
      const result = await syncNowMutation.mutateAsync(boost.id)
      if (result) {
        setSyncResult(result)
        setShowSyncModal(true)
      }
    } catch (error) {
      console.error('Failed to sync boost:', error)
      // Error is handled by the mutation's onError callback
    } finally {
      setSyncingId(null)
    }
  }

  const closeSyncModal = () => {
    setShowSyncModal(false)
    setSyncResult(null)
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

  if (filteredBoosts.length === 0) {
    if (filter.trim() && boosts.length > 0) {
      return (
        <div className={cn('w-full', className)}>
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              No boosts match your filter
            </div>
            <p className="text-sm text-gray-400">
              Try a different search term or clear the filter
            </p>
          </div>
        </div>
      )
    }
    
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
    <>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBoosts.map((boost: StockBoost) => {
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
                          <SkuCell sku={boost.sku} />
                          {boost.allSkus && (
                            <div className="text-xs text-gray-500 mt-1">
                              {boost.allSkus}
                            </div>
                          )}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {boost.createdBy || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleSyncNow(boost)}
                              disabled={syncingId === boost.id || syncNowMutation.isPending}
                            >
                              {syncingId === boost.id ? 'Syncing...' : 'Sync Now'}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeactivate(boost)}
                              disabled={deactivatingId === boost.id || deactivateBoostMutation.isPending}
                            >
                              {deactivatingId === boost.id ? 'Deactivating...' : 'Deactivate'}
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded target stocks sub-rows */}
                      {isExpanded && hasTargets && (
                        <tr className="bg-gray-50">
                          <td colSpan={8} className="px-6 py-4">
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

      {/* Sync Results Modal */}
      <Modal
        isOpen={showSyncModal}
        onClose={closeSyncModal}
        title="Sync Results"
        size="lg"
      >
        {syncResult && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Sync Initiated Successfully</span>
              </div>
              <p className="text-sm text-green-700">
                {syncResult.message}
              </p>
            </div>

            {syncResult.data && syncResult.data.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Syncback Jobs ({syncResult.data.length})
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Syncback Job
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Last Synced At
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {syncResult.data.map((job, index) => {
                          const isMoreThan5MinutesAgo = job.last_synced_at &&
                            (new Date().getTime() - new Date(job.last_synced_at).getTime()) > 5 * 60 * 1000
                          const isNotSuccessful = job.last_synced_status !== 'success'
                          const shouldHighlight = !job.last_synced_at || isNotSuccessful || isMoreThan5MinutesAgo

                          return (
                            <tr
                              key={index}
                              className={cn(
                                "hover:bg-gray-50",
                                shouldHighlight && "bg-red-50"
                              )}
                            >
                              <td className={cn(
                                "px-4 py-3 text-sm font-medium",
                                shouldHighlight ? "text-red-900" : "text-gray-900"
                              )}>
                                {job.syncback_job}
                              </td>
                              <td className={cn(
                                "px-4 py-3 text-sm",
                                shouldHighlight ? "text-red-700" : "text-gray-600"
                              )}>
                                {job.last_synced_at ? (
                                  <div className="flex flex-col">
                                    <span>{formatDate(job.last_synced_at)}</span>
                                    {isMoreThan5MinutesAgo && (
                                      <span className="text-xs text-red-600 font-semibold">
                                        ⚠ More than 5 minutes ago
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-red-600 font-semibold italic">Never synced</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {job.last_synced_status ? (
                                  <span className={cn(
                                    "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                                    job.last_synced_status === 'success'
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  )}>
                                    {job.last_synced_status}
                                  </span>
                                ) : (
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                    pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={closeSyncModal} variant="primary">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}