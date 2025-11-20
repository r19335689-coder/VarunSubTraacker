'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, isAuthenticated, getCurrentUserAsync, checkAuthentication } from '../../lib/auth'
import TabNavigation from '../../components/TabNavigation'

type NotificationTimeframe = '1 day' | '3 days' | '1 week' | '2 weeks'

interface NotificationSettings {
  emailEnabled: boolean
  timeframe: NotificationTimeframe
}

const NOTIFICATION_SETTINGS_KEY = 'notification_settings'

export default function SettingsTab() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<{ username: string; fullName?: string } | null>(null)
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: false,
    timeframe: '3 days'
  })

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
        // Load settings from localStorage
        const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY)
        if (stored) {
          try {
            setSettings(JSON.parse(stored))
          } catch {
            // Use defaults
          }
        }
      }
    }
    loadData()
  }, [router])

  useEffect(() => {
    // Save settings to localStorage whenever they change
    if (currentUser) {
      localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings))
    }
  }, [settings, currentUser])

  const handleToggleEmail = () => {
    setSettings(prev => ({ ...prev, emailEnabled: !prev.emailEnabled }))
  }

  const handleTimeframeChange = (timeframe: NotificationTimeframe) => {
    setSettings(prev => ({ ...prev, timeframe }))
  }

  if (!currentUser) {
    return null
  }

  const timeframes: NotificationTimeframe[] = ['1 day', '3 days', '1 week', '2 weeks']

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="max-w-md mx-auto px-4 pt-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h1 className="text-2xl font-bold text-white">Notification settings</h1>
          </div>
          <p className="text-gray-400 text-sm">Manage your renewal alerts</p>
        </div>

        {/* Info Card */}
        <div className="bg-pastel-red rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-black/70 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <div>
              <h2 className="text-black font-bold text-lg mb-2">Stay on top of renewals</h2>
              <p className="text-black/80 text-sm">
                Enable notifications to receive timely reminders before your subscriptions renew. Never be surprised by a renewal again!
              </p>
            </div>
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          {/* Email Notification Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="text-white font-semibold mb-1">Email notification alerts</div>
                <div className="text-gray-400 text-sm">Get notified before renewals</div>
              </div>
            </div>
            <button
              onClick={handleToggleEmail}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors touch-target ${
                settings.emailEnabled ? 'bg-pastel-blue' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Timeframe Options (shown when email is enabled) */}
          {settings.emailEnabled && (
            <div className="pt-6 border-t border-gray-800">
              <label htmlFor="timeframe" className="block text-white font-semibold mb-3">
                Notification timeframe
              </label>
              <select
                id="timeframe"
                value={settings.timeframe}
                onChange={(e) => handleTimeframeChange(e.target.value as NotificationTimeframe)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pastel-blue focus:border-transparent transition-colors"
              >
                {timeframes.map((timeframe) => (
                  <option key={timeframe} value={timeframe}>
                    {timeframe} before
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <TabNavigation />
    </div>
  )
}

