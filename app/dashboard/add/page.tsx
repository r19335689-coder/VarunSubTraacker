'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, isAuthenticated, getCurrentUserAsync, checkAuthentication } from '../../lib/auth'
import { saveSubscriptions, loadSubscriptions, Subscription, Category, Cycle, Status } from '../../lib/subscriptions'
import { CategoryIcon } from '../../components/CategoryIcon'

export default function AddSubscriptionPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<{ username: string; fullName?: string } | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    renewalDate: '',
    cycle: 'Monthly' as Cycle,
    status: 'Active' as Status,
    category: 'Software' as Category
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadData = async () => {
      if (typeof window === 'undefined') return
      
      const isAuth = await checkAuthentication()
      if (!isAuth) {
        router.push('/')
        return
      }

      const user = await getCurrentUserAsync()
      if (user) {
        setCurrentUser(user)
        const userKey = user.id || user.username
        const loaded = loadSubscriptions(userKey)
        setSubscriptions(loaded)
      }
    }
    loadData()
  }, [router])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !currentUser) return

    const newSubscription: Subscription = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      cost: parseFloat(formData.cost),
      renewalDate: new Date(formData.renewalDate),
      cycle: formData.cycle,
      status: formData.status,
      category: formData.category
    }

    const updatedSubscriptions = [...subscriptions, newSubscription]
    setSubscriptions(updatedSubscriptions)
    const userKey = currentUser.id || currentUser.username
    saveSubscriptions(updatedSubscriptions, userKey)
    
    router.back()
  }

  const handleCancel = () => {
    router.back()
  }

  if (!currentUser) {
    return null
  }

  const categories: Category[] = ['Software', 'Shopping', 'Design', 'Storage', 'Entertainment']

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto px-4 pt-8 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Add Subscription</h1>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors touch-target"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pastel-blue focus:border-transparent transition-colors ${
                formErrors.name ? 'border-red-500' : 'border-gray-800'
              }`}
              placeholder="e.g., Netflix"
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-400">{formErrors.name}</p>
            )}
          </div>

          {/* Cost */}
          <div>
            <label htmlFor="cost" className="block text-sm font-medium text-gray-300 mb-2">
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
              className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pastel-blue focus:border-transparent transition-colors ${
                formErrors.cost ? 'border-red-500' : 'border-gray-800'
              }`}
              placeholder="0.00"
            />
            {formErrors.cost && (
              <p className="mt-1 text-sm text-red-400">{formErrors.cost}</p>
            )}
          </div>

          {/* Renewal Date */}
          <div>
            <label htmlFor="renewalDate" className="block text-sm font-medium text-gray-300 mb-2">
              Renewal Date *
            </label>
            <input
              type="date"
              id="renewalDate"
              name="renewalDate"
              value={formData.renewalDate}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pastel-blue focus:border-transparent transition-colors ${
                formErrors.renewalDate ? 'border-red-500' : 'border-gray-800'
              }`}
            />
            {formErrors.renewalDate && (
              <p className="mt-1 text-sm text-red-400">{formErrors.renewalDate}</p>
            )}
          </div>

          {/* Cycle */}
          <div>
            <label htmlFor="cycle" className="block text-sm font-medium text-gray-300 mb-2">
              Cycle *
            </label>
            <select
              id="cycle"
              name="cycle"
              value={formData.cycle}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pastel-blue focus:border-transparent transition-colors"
            >
              <option value="Monthly">Monthly</option>
              <option value="Annually">Annually</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pastel-blue focus:border-transparent transition-colors"
            >
              <option value="Active">Active</option>
              <option value="Trial">Trial</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Category *
            </label>
            <div className="grid grid-cols-5 gap-2">
              {categories.map((cat) => (
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
                  className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all touch-target ${
                    formData.category === cat
                      ? 'border-pastel-blue bg-pastel-blue/20'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                  }`}
                >
                  <CategoryIcon category={cat} className="w-5 h-5" />
                  <span className="text-xs font-medium text-white">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 border border-gray-800 text-gray-300 rounded-lg hover:bg-gray-900 font-medium transition-colors touch-target"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-pastel-blue text-black rounded-lg hover:bg-pastel-blue-dark font-semibold transition-colors touch-target"
            >
              Add Subscription
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

