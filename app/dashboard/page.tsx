'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logoutUser, isAuthenticated } from '../lib/auth'

// Data Model & Types
type Cycle = 'Monthly' | 'Annually'
type Status = 'Active' | 'Trial'
type Category = 'Software' | 'Shopping' | 'Design' | 'Storage' | 'Entertainment'

interface Subscription {
  id: string
  name: string
  cost: number
  renewalDate: Date
  cycle: Cycle
  status: Status
  category: Category
}

// Category Icons with colors
const CategoryIcon = ({ category, className = "w-5 h-5" }: { category: Category; className?: string }) => {
  const iconConfig = {
    Software: {
      icon: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      color: 'text-blue-600'
    },
    Shopping: {
      icon: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      color: 'text-purple-600'
    },
    Design: {
      icon: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      color: 'text-pink-600'
    },
    Storage: {
      icon: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      color: 'text-green-600'
    },
    Entertainment: {
      icon: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-orange-600'
    },
  }
  const config = iconConfig[category]
  return <span className={config.color}>{config.icon}</span>
}

// LocalStorage Utilities (user-specific)
const getStorageKey = (username: string): string => {
  return `subscriptions_${username}`
}

const saveSubscriptions = (subscriptions: Subscription[], username: string): void => {
  const serialized = subscriptions.map(sub => ({
    ...sub,
    renewalDate: sub.renewalDate.toISOString()
  }))
  localStorage.setItem(getStorageKey(username), JSON.stringify(serialized))
}

const loadSubscriptions = (username: string): Subscription[] => {
  if (typeof window === 'undefined') return []
  
  const stored = localStorage.getItem(getStorageKey(username))
  if (!stored) return []
  
  try {
    const parsed = JSON.parse(stored)
    return parsed.map((sub: any) => ({
      ...sub,
      renewalDate: new Date(sub.renewalDate),
      category: sub.category || 'Software'
    }))
  } catch {
    return []
  }
}

export default function Dashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    renewalDate: '',
    cycle: 'Monthly' as Cycle,
    status: 'Active' as Status,
    category: 'Software' as Category
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Check authentication and load data
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (!isAuthenticated()) {
      router.push('/')
      return
    }

    const user = getCurrentUser()
    if (user) {
      setCurrentUser(user)
      const loaded = loadSubscriptions(user.username)
      setSubscriptions(loaded)
    }
  }, [router])

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileMenu && !(event.target as Element).closest('.profile-menu-container')) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showProfileMenu])

  // Save subscriptions whenever they change
  useEffect(() => {
    if (currentUser && (subscriptions.length > 0 || localStorage.getItem(getStorageKey(currentUser.username)))) {
      saveSubscriptions(subscriptions, currentUser.username)
    }
  }, [subscriptions, currentUser])

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

  // Count subscriptions by cycle
  const getSubscriptionCounts = () => {
    const activeSubs = subscriptions.filter(sub => sub.status === 'Active')
    const monthly = activeSubs.filter(sub => sub.cycle === 'Monthly').length
    const annual = activeSubs.filter(sub => sub.cycle === 'Annually').length
    return { monthly, annual }
  }

  // Calculate spending per category
  const getSpendingByCategory = (): Record<Category, number> => {
    const activeSubs = subscriptions.filter(sub => sub.status === 'Active')
    const categorySpending: Record<Category, number> = {
      Software: 0,
      Shopping: 0,
      Design: 0,
      Storage: 0,
      Entertainment: 0
    }

    activeSubs.forEach(sub => {
      const monthlyCost = sub.cycle === 'Monthly' ? sub.cost : sub.cost / 12
      categorySpending[sub.category] += monthlyCost
    })

    return categorySpending
  }

  // Find Upcoming Renewals (within 7 days)
  const findUpcomingRenewals = (): Subscription[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(today.getDate() + 7)

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
        return sub.renewalDateNormalized >= today && sub.renewalDateNormalized <= sevenDaysFromNow
      })
      .sort((a, b) => a.renewalDateNormalized.getTime() - b.renewalDateNormalized.getTime())
      .map(sub => {
        const { renewalDateNormalized, ...rest } = sub
        return rest
      })

    return upcomingRenewals
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

  // Handle form submission (add or edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    if (editingId) {
      // Update existing subscription
      setSubscriptions(prev => prev.map(sub => 
        sub.id === editingId 
          ? {
              ...sub,
              name: formData.name.trim(),
              cost: parseFloat(formData.cost),
              renewalDate: new Date(formData.renewalDate),
              cycle: formData.cycle,
              status: formData.status,
              category: formData.category
            }
          : sub
      ))
    } else {
      // Add new subscription
      const newSubscription: Subscription = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        cost: parseFloat(formData.cost),
        renewalDate: new Date(formData.renewalDate),
        cycle: formData.cycle,
        status: formData.status,
        category: formData.category
      }
      setSubscriptions(prev => [...prev, newSubscription])
    }
    
    // Reset form
    setFormData({
      name: '',
      cost: '',
      renewalDate: '',
      cycle: 'Monthly',
      status: 'Active',
      category: 'Software'
    })
    setFormErrors({})
    setEditingId(null)
    setIsModalOpen(false)
  }

  // Handle edit
  const handleEdit = (sub: Subscription) => {
    setEditingId(sub.id)
    setFormData({
      name: sub.name,
      cost: sub.cost.toString(),
      renewalDate: sub.renewalDate.toISOString().split('T')[0],
      cycle: sub.cycle,
      status: sub.status,
      category: sub.category
    })
    setIsModalOpen(true)
  }

  // Handle delete
  const handleDelete = (id: string) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id))
    setDeleteConfirmId(null)
  }

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({
      name: '',
      cost: '',
      renewalDate: '',
      cycle: 'Monthly',
      status: 'Active',
      category: 'Software'
    })
    setFormErrors({})
  }

  // Handle sign out
  const handleSignOut = () => {
    logoutUser()
    router.push('/')
  }

  if (!currentUser) {
    return null // Will redirect
  }

  const totalMonthlyCost = calculateTotalMonthlyCost()
  const subscriptionCounts = getSubscriptionCounts()
  const categorySpending = getSpendingByCategory()
  const upcomingRenewals = findUpcomingRenewals()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Subscription Tracker
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              + Add New
            </button>
            <div className="relative profile-menu-container">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{currentUser.username}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Total Monthly Spend Section */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-6 text-white">
          <div className="text-center">
            <div className="mb-2">
              <span className="text-blue-100 text-lg">Total Monthly Spend</span>
            </div>
            <div className="mb-6">
              <span className="text-6xl font-bold">
                ₹{totalMonthlyCost.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-center gap-6 text-sm text-blue-100">
              <div>
                <span className="font-semibold text-white">{subscriptionCounts.monthly}</span> Monthly
              </div>
              <div>
                <span className="font-semibold text-white">{subscriptionCounts.annual}</span> Annual
              </div>
            </div>
          </div>
        </div>

        {/* Subscription List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
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
                      Category
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sub.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <CategoryIcon category={sub.category} className="w-4 h-4" />
                          <span>{sub.category}</span>
                        </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(sub)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(sub.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Monthly Spending by Category */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-6 border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Spending by Category</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {(Object.keys(categorySpending) as Category[]).map((category) => {
                const spending = categorySpending[category]
                if (spending === 0) return null
                return (
                  <div key={category} className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <CategoryIcon category={category} className="w-6 h-6" />
                    <div>
                      <div className="text-xs text-gray-600">{category}</div>
                      <div className="text-sm font-semibold text-gray-900">₹{spending.toFixed(2)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            {Object.values(categorySpending).every(v => v === 0) && (
              <div className="text-center text-gray-500 py-8">
                No spending by category yet
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-6 border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Renewals</h2>
          </div>
          {upcomingRenewals.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No renewals in the next 7 days
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-3">
                {upcomingRenewals.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={sub.category} className="w-5 h-5" />
                      <div>
                        <div className="font-medium text-gray-900">{sub.name}</div>
                        <div className="text-sm text-gray-600">{sub.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">₹{sub.cost.toFixed(2)}</div>
                      <div className="text-sm text-orange-600 font-medium">{formatDate(sub.renewalDate)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this subscription? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Edit Subscription' : 'Add New Subscription'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors"
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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="Active">Active</option>
                  <option value="Trial">Trial</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(['Software', 'Shopping', 'Design', 'Storage', 'Entertainment'] as Category[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, category: cat }))
                        if (formErrors.category) {
                          setFormErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.category
                            return newErrors
                          })
                        }
                      }}
                      className={`flex flex-col items-center gap-1 p-3 border-2 rounded-lg transition-all ${
                        formData.category === cat
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                      }`}
                    >
                      <CategoryIcon category={cat} className="w-5 h-5" />
                      <span className="text-xs font-medium">{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-all shadow-md hover:shadow-lg"
                >
                  {editingId ? 'Update Subscription' : 'Add Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

