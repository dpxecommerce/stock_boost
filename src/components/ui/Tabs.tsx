'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  onTabChange?: (tabId: string) => void
  className?: string
  tabListClassName?: string
  tabClassName?: string
  activeTabClassName?: string
  contentClassName?: string
}

export default function Tabs({
  tabs,
  defaultTab,
  onTabChange,
  className,
  tabListClassName,
  tabClassName,
  activeTabClassName,
  contentClassName
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(
    defaultTab || tabs.find(tab => !tab.disabled)?.id || tabs[0]?.id
  )

  const handleTabChange = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab && !tab.disabled) {
      setActiveTab(tabId)
      onTabChange?.(tabId)
    }
  }

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <div className={cn('w-full', className)}>
      {/* Tab List */}
      <div 
        className={cn(
          'flex border-b border-gray-200',
          tabListClassName
        )}
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => handleTabChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              'px-4 py-2 text-sm font-medium text-gray-500 border-b-2 border-transparent',
              'hover:text-gray-700 hover:border-gray-300',
              'focus:outline-none focus:text-gray-700 focus:border-gray-300',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-200',
              tabClassName,
              activeTab === tab.id && [
                'text-blue-600 border-blue-600',
                activeTabClassName
              ]
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div 
        className={cn('mt-4', contentClassName)}
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTabContent}
      </div>
    </div>
  )
}

// Export helper components for better composition
export const TabContent = ({ children, className }: { 
  children: React.ReactNode
  className?: string 
}) => (
  <div className={cn('w-full', className)}>
    {children}
  </div>
)