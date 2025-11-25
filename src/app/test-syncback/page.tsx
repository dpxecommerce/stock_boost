'use client'

import { useSyncbackInfo, getSyncbackName } from '@/lib/hooks/use-syncback-info'

export default function TestSyncbackPage() {
  const { data: syncbackInfo, isLoading, error } = useSyncbackInfo()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading syncback information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Syncback Information Test
          </h1>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Raw Data (JSON)
              </h2>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                {JSON.stringify(syncbackInfo, null, 2)}
              </pre>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Formatted List
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Syncback Job ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Syncback Name
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {syncbackInfo && Object.entries(syncbackInfo).map(([id, name]) => (
                      <tr key={id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Helper Function Test
              </h2>
              <div className="space-y-2">
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-sm">
                    getSyncbackName(syncbackInfo, 101) = "{getSyncbackName(syncbackInfo, 101)}"
                  </code>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-sm">
                    getSyncbackName(syncbackInfo, "102") = "{getSyncbackName(syncbackInfo, "102")}"
                  </code>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <code className="text-sm">
                    getSyncbackName(syncbackInfo, 999) = "{getSyncbackName(syncbackInfo, 999)}" (non-existent)
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
