'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, isAuthenticated, getCurrentUserAsync, checkAuthentication, CurrentUser } from '../lib/auth'
import { loadSubscriptions, calculateTotalMonthlyCost, countRenewalsThisWeek, Subscription } from '../lib/subscriptions'
import TabNavigation from '../components/TabNavigation'

export default function HomeTab() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const loadData = async () => {
    if (typeof window === 'undefined') return
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Handle OAuth callback - check for tokens in URL hash first
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const errorParam = hashParams.get('error')
      
      if (errorParam) {
        console.error('OAuth error in URL hash:', errorParam)
        setError(`OAuth error: ${errorParam}`)
        setIsLoading(false)
        return
      }
      
      if (accessToken && refreshToken) {
        console.log('Found OAuth tokens in URL hash, setting session...')
        try {
          const { getSupabaseClient } = await import('../lib/supabase-client')
          const supabase = await getSupabaseClient()
          const { data, error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          
          if (setError) {
            console.error('Error setting session from URL hash:', setError)
            setError('Failed to set session. Please try logging in again.')
            setIsLoading(false)
            return
          } else if (data?.session) {
            console.log('Session set successfully from URL hash')
            // Clean up URL hash
            window.history.replaceState(null, '', window.location.pathname + window.location.search)
          }
        } catch (err) {
          console.error('Error handling OAuth tokens:', err)
          setError('Failed to process OAuth tokens. Please try logging in again.')
          setIsLoading(false)
          return
        }
      }
      
      // Give a small delay after OAuth redirect to ensure session is available
      if (window.location.search.includes('code=') || accessToken) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      const isAuth = await checkAuthentication()
      console.log('Auth check result:', isAuth)
      
      if (!isAuth) {
        console.log('Not authenticated, redirecting to home')
        router.push('/')
        return
      }

      const user = await getCurrentUserAsync()
      console.log('Current user:', user)
      
      if (user) {
        setCurrentUser(user)
        // Use user ID for Supabase users, username for local users
        const userKey = user.id || user.username
        const userId = user.id
        const loaded = await loadSubscriptions(userKey, userId)
        setSubscriptions(loaded)
      } else {
        console.error('Failed to load user - user is null')
        setError('Failed to load user data. Please try logging in again.')
      }
    } catch (err: any) {
      console.error('Error loading dashboard data:', err)
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Only load data on client side
    if (typeof window !== 'undefined') {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reload data when page comes into focus (e.g., returning from add page)
  useEffect(() => {
    const handleFocus = async () => {
      if (currentUser) {
        const userKey = currentUser.id || currentUser.username
        const userId = currentUser.id
        const loaded = await loadSubscriptions(userKey, userId)
        setSubscriptions(loaded)
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [currentUser])

  // Don't render until mounted (prevents hydration issues)
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-blue mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setIsLoading(true)
              loadData()
            }}
            className="px-4 py-2 bg-pastel-blue text-black rounded-lg font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    // Still loading or no user - show loading state
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-blue mx-auto mb-4"></div>
          <p className="text-gray-400">Loading user data...</p>
        </div>
      </div>
    )
  }

  const totalMonthlyCost = calculateTotalMonthlyCost(subscriptions)
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'Active')
  const renewalsThisWeek = countRenewalsThisWeek(subscriptions)

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="max-w-md mx-auto px-4 pt-8">
      {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-6 h-6 text-pastel-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {currentUser.fullName || currentUser.username}
          </h1>
                  </div>
          <p className="text-gray-400 text-sm">Here's your subscription overview</p>
                </div>

        {/* Total Monthly Spend Card */}
        <div className="bg-pastel-blue rounded-2xl p-6 mb-4">
          <div className="flex items-baseline gap-2">
            <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-black text-4xl font-bold">
              {totalMonthlyCost.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Split Stats Card */}
        <div className="bg-gray-900 rounded-2xl p-4 mb-4 border border-gray-800">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {activeSubscriptions.length}
              </div>
              <div className="text-gray-400 text-sm">Subscriptions</div>
            </div>
            <div className="text-center border-l border-gray-800">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {renewalsThisWeek}
              </div>
              <div className="text-gray-400 text-sm">Upcoming Renewals</div>
            </div>
          </div>
        </div>

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
