'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authManager } from '@/lib/auth'
import { User } from '@/types/auth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      if (!authManager.isAuthenticated()) {
        router.push('/login')
        return
      }

      try {
        const currentUser = await authManager.loadUser()
        if (currentUser) {
          setUser(currentUser)
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Failed to load user:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    loadUser()

    // Subscribe to auth changes
    const unsubscribe = authManager.subscribe((newUser) => {
      setUser(newUser)
      if (!newUser) {
        router.push('/login')
      }
    })

    return unsubscribe
  }, [router])

  const handleLogout = async () => {
    await authManager.logout()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Stock Boost Management
              </h1>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-4">
                Welcome, {user.username}
              </span>
              <button 
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}