'use client'

import { useState, useEffect } from 'react'

// Data Model & Types
type Cycle = 'Monthly' | 'Annually'
type Status = 'Active' | 'Trial'

interface Subscription {
  id: string
  name: string
  cost: number
  renewalDate: Date
  cycle: Cycle
  status: Status
}

// LocalStorage Utilities
const STORAGE_KEY = 'subscriptions'

const saveSubscriptions = (subscriptions: Subscription[]): void => {
  const serialized = subscriptions.map(sub => ({
    ...sub,
    renewalDate: sub.renewalDate.toISOString()
  }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized))
}

const loadSubscriptions = (): Subscription[] => {
  if (typeof window === 'undefined') return []
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  
  try {
    const parsed = JSON.parse(stored)
    return parsed.map((sub: any) => ({
      ...sub,
      renewalDate: new Date(sub.renewalDate)
    }))
  } catch {
    return []
  }
}

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    renewalDate: '',
    cycle: 'Monthly' as Cycle,
    status: 'Active' as Status
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Load subscriptions on mount
  useEffect(() => {
    const loaded = loadSubscriptions()
    setSubscriptions(loaded)
  }, [])

  // Save subscriptions whenever they change
  useEffect(() => {
    if (subscriptions.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      saveSubscriptions(subscriptions)
    }
  }, [subscriptions])

  // Calculate Total Monthly Cost
  const calculateTotalMonthlyCost = (): number => {
    const activeSubs = subscriptions.filter(sub => sub.status === 'Active')
    return activeSubs.reduce((total, sub) => {
      if (sub.cycle === 'Monthly') {
        return total + sub.cost
      } else {
        return total + (sub.cost / 12)
      }
    }, 0)
  }

  // Find Upcoming Renewal (within 5 days)
  const findUpcomingRenewal = (): { name: string; date: Date } | null => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const fiveDaysFromNow = new Date(today)
    fiveDaysFromNow.setDate(today.getDate() + 5)

    const activeSubs = subscriptions.filter(sub => sub.status === 'Active')
    const upcomingRenewals = activeSubs
      .map(sub => {
        const renewalDate = new Date(sub.renewalDate)
        renewalDate.setHours(0, 0, 0, 0)
        return {
          ...sub,
          renewalDateNormalized: renewalDate
        }
      })
      .filter(sub => {
        return sub.renewalDateNormalized >= today && sub.renewalDateNormalized <= fiveDaysFromNow
      })
      .sort((a, b) => a.renewalDateNormalized.getTime() - b.renewalDateNormalized.getTime())

    if (upcomingRenewals.length === 0) return null

    const nearest = upcomingRenewals[0]
    return {
      name: nearest.name,
      date: new Date(nearest.renewalDate)
    }
  }

  // Format date for display
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }

    const cost = parseFloat(formData.cost)
    if (!formData.cost || isNaN(cost) || cost <= 0) {
      errors.cost = 'Cost must be a positive number'
    }

    if (!formData.renewalDate) {
      errors.renewalDate = 'Renewal date is required'
    } else {
      const selectedDate = new Date(formData.renewalDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      selectedDate.setHours(0, 0, 0, 0)
      
      if (selectedDate <= today) {
        errors.renewalDate = 'Renewal date must be in the future'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const newSubscription: Subscription = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      cost: parseFloat(formData.cost),
      renewalDate: new Date(formData.renewalDate),
      cycle: formData.cycle,
      status: formData.status
    }

    setSubscriptions(prev => [...prev, newSubscription])
    
    // Reset form
    setFormData({
      name: '',
      cost: '',
      renewalDate: '',
      cycle: 'Monthly',
      status: 'Active'
    })
    setFormErrors({})
    setIsModalOpen(false)
  }

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      name: '',
      cost: '',
      renewalDate: '',
      cycle: 'Monthly',
      status: 'Active'
    })
    setFormErrors({})
  }

  const totalMonthlyCost = calculateTotalMonthlyCost()
  const upcomingRenewal = findUpcomingRenewal()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Subscription Tracker (MVP)</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add New
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Summary Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600">Total Monthly Cost: </span>
              <span className="text-xl font-bold text-gray-900">
                ₹{totalMonthlyCost.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Upcoming Renewal Alert: </span>
              {upcomingRenewal ? (
                <span className="text-lg font-semibold text-orange-600">
                  {upcomingRenewal.name} - {formatDate(upcomingRenewal.date)}
                </span>
              ) : (
                <span className="text-gray-500">No upcoming renewals</span>
              )}
            </div>
          </div>
        </div>

        {/* Subscription List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Subscriptions</h2>
          </div>
          
          {subscriptions.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No subscriptions yet. Click &quot;+ Add New&quot; to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost (₹)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Renewal Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cycle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sub.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{sub.cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(sub.renewalDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sub.cycle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          sub.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Add New Subscription</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Netflix"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              {/* Cost */}
              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                  Cost (₹) *
                </label>
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.cost ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {formErrors.cost && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.cost}</p>
                )}
              </div>

              {/* Renewal Date */}
              <div>
                <label htmlFor="renewalDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Renewal Date *
                </label>
                <input
                  type="date"
                  id="renewalDate"
                  name="renewalDate"
                  value={formData.renewalDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.renewalDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.renewalDate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.renewalDate}</p>
                )}
              </div>

              {/* Cycle */}
              <div>
                <label htmlFor="cycle" className="block text-sm font-medium text-gray-700 mb-1">
                  Cycle *
                </label>
                <select
                  id="cycle"
                  name="cycle"
                  value={formData.cycle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Annually">Annually</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Trial">Trial</option>
                </select>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

