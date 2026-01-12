'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { apiClient } from '@/lib/api/client'
import { SKU } from '@/types/boost'

interface SkuDescriptionContextType {
  getDetail: (sku: string) => Promise<string | null>
  addDescriptions: (skus: SKU[]) => void
  clearCache: () => void
}

const SkuDescriptionContext = createContext<SkuDescriptionContextType | undefined>(undefined)

export function SkuDescriptionProvider({ children }: { children: ReactNode }) {
  const [descriptionMap, setDescriptionMap] = useState<Map<string, string>>(new Map())

  const addDescriptions = useCallback((skus: SKU[]) => {
    setDescriptionMap(prev => {
      const newMap = new Map(prev)
      skus.forEach(sku => {
        if (sku.sku && sku.name) {
          newMap.set(sku.sku, sku.name)
        }
      })
      return newMap
    })
  }, [])

  const getDetail = useCallback(async (sku: string): Promise<string | null> => {
    // Check if already in cache
    if (descriptionMap.has(sku)) {
      return descriptionMap.get(sku) || null
    }

    // Query skuDetails API
    try {
      const response = await apiClient.skuDetails([sku])
      if (response.success && response.data && response.data.length > 0) {
        const skuData = response.data[0]
        const description = skuData.name
        
        // Add to cache
        setDescriptionMap(prev => {
          const newMap = new Map(prev)
          newMap.set(sku, description)
          return newMap
        })
        
        return description
      }
      return null
    } catch (error) {
      console.error('Failed to fetch SKU details:', error)
      return null
    }
  }, [descriptionMap])

  const clearCache = useCallback(() => {
    setDescriptionMap(new Map())
  }, [])

  return (
    <SkuDescriptionContext.Provider value={{ getDetail, addDescriptions, clearCache }}>
      {children}
    </SkuDescriptionContext.Provider>
  )
}

export function useSkuDescription() {
  const context = useContext(SkuDescriptionContext)
  if (!context) {
    throw new Error('useSkuDescription must be used within a SkuDescriptionProvider')
  }
  return context
}
