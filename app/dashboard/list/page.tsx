'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, isAuthenticated, getCurrentUserAsync, checkAuthentication } from '../../lib/auth'
import { loadSubscriptions, formatDate, Subscription, Category } from '../../lib/subscriptions'
import TabNavigation from '../../components/TabNavigation'
import { CategoryIcon } from '../../components/CategoryIcon'

export default function ListTab() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<{ username: string; fullName?: string } | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All')
  const [timeFilter, setTimeFilter] = useState<'All' | 'This Week' | 'This Month' | 'Next Month'>('All')

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

  useEffect(() => {
    loadData()
  }, [router])

  // Reload data when page comes into focus
  useEffect(() => {
    const handleFocus = () => {
      if (currentUser) {
        const userKey = currentUser.id || currentUser.username
        const loaded = loadSubscriptions(userKey)
        setSubscriptions(loaded)
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [currentUser])

  if (!currentUser) {
    return null
  }

  const filterSubscriptions = () => {
    let filtered = subscriptions

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(sub =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(sub => sub.category === selectedCategory)
    }

    // Time filter
    if (timeFilter !== 'All') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      filtered = filtered.filter(sub => {
        const renewalDate = new Date(sub.renewalDate)
        renewalDate.setHours(0, 0, 0, 0)

        if (timeFilter === 'This Week') {
          const weekFromNow = new Date(today)
          weekFromNow.setDate(today.getDate() + 7)
          return renewalDate >= today && renewalDate <= weekFromNow
        } else if (timeFilter === 'This Month') {
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
          return renewalDate >= today && renewalDate <= endOfMonth
        } else if (timeFilter === 'Next Month') {
          const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
          const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0)
          return renewalDate >= startOfNextMonth && renewalDate <= endOfNextMonth
        }
        return true
      })
    }

    return filtered
  }

  const filteredSubscriptions = filterSubscriptions()
  const categories: Category[] = ['Software', 'Shopping', 'Design', 'Storage', 'Entertainment']

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="max-w-md mx-auto px-4 pt-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <h1 className="text-2xl font-bold text-white">My subscriptions</h1>
          </div>
          <p className="text-gray-400 text-sm">Manage and track all your subscriptions</p>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pastel-blue focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 space-y-3">
          {/* Category Filter */}
          <div>
            <label className="text-gray-400 text-xs mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {['All', ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat as Category | 'All')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-target ${
                    selectedCategory === cat
                      ? 'bg-pastel-blue text-black'
                      : 'bg-gray-900 text-gray-300 border border-gray-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Time Filter */}
          <div>
            <label className="text-gray-400 text-xs mb-2 block">Time</label>
            <div className="flex flex-wrap gap-2">
              {['All', 'This Week', 'This Month', 'Next Month'].map((time) => (
                <button
                  key={time}
                  onClick={() => setTimeFilter(time as typeof timeFilter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-target ${
                    timeFilter === time
                      ? 'bg-pastel-blue text-black'
                      : 'bg-gray-900 text-gray-300 border border-gray-800'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subscription List */}
        {filteredSubscriptions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-2">No subs found</p>
            <p className="text-gray-500 text-sm">Get started by adding your first subscription</p>
          </div>
        ) : (
          <div className="space-y-3 mb-20">
            {filteredSubscriptions.map((sub) => (
              <div
                key={sub.id}
                className="bg-gray-900 rounded-xl p-4 border border-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <CategoryIcon category={sub.category} className="w-6 h-6 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-1">{sub.name}</div>
                      <div className="text-gray-400 text-sm mb-2">{sub.category}</div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">₹{sub.cost.toFixed(2)}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-500">{sub.cycle}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-pastel-blue">{formatDate(sub.renewalDate)}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      sub.status === 'Active'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-yellow-900/30 text-yellow-400'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Plus Button */}
        <Link
          href="/dashboard/add"
          className="fixed bottom-24 right-1/2 translate-x-1/2 w-14 h-14 bg-pastel-blue rounded-full flex items-center justify-center shadow-lg hover:bg-pastel-blue-dark transition-colors touch-target z-40"
        >
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </div>

      <TabNavigation />
    </div>
  )
}

