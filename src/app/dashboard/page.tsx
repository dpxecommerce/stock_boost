'use client'

import { useState } from 'react'
import Tabs from '@/components/ui/Tabs'
import Modal from '@/components/ui/Modal'
import ActiveBoostsTable from '@/components/tables/ActiveBoostsTable'
import AddBoostForm from '@/components/forms/AddBoostForm'
import { Button } from '@/components/ui/Button'

export default function DashboardPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const handleAddSuccess = () => {
    setIsAddModalOpen(false)
    // The table will automatically refresh via React Query
  }

  const handleAddCancel = () => {
    setIsAddModalOpen(false)
  }

  const tabs = [
    {
      id: 'active',
      label: 'Active Boosts',
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Active Stock Boosts</h3>
              <p className="text-sm text-gray-500">
                Manage your currently active stock boosts
              </p>
            </div>
            <Button onClick={() => setIsAddModalOpen(true)}>
              Add Boost
            </Button>
          </div>
          <ActiveBoostsTable />
        </div>
      )
    },
    {
      id: 'historical',
      label: 'Historical Boosts',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Historical Stock Boosts</h3>
            <p className="text-sm text-gray-500">
              View previously deactivated stock boosts
            </p>
          </div>
          <div className="text-center py-8 text-gray-500">
            Historical boosts functionality coming in User Story 3
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Manage your stock boosts</p>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <Tabs
            tabs={tabs}
            defaultTab="active"
            className="w-full"
          />
        </div>
      </div>

      {/* Add Boost Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleAddCancel}
        title="Create New Stock Boost"
        size="md"
      >
        <AddBoostForm
          onSuccess={handleAddSuccess}
          onCancel={handleAddCancel}
        />
      </Modal>
    </div>
  )
}