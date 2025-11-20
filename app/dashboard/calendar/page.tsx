'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { getCurrentUser, isAuthenticated, getCurrentUserAsync, checkAuthentication, CurrentUser } from '../../lib/auth'
import { loadSubscriptions, Subscription } from '../../lib/subscriptions'
import TabNavigation from '../../components/TabNavigation'

type ValuePiece = Date | null
type Value = ValuePiece | [ValuePiece, ValuePiece]

export default function CalendarTab() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewDate, setViewDate] = useState<Date>(new Date())

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
      const userId = user.id
      const loaded = await loadSubscriptions(userKey, userId)
      setSubscriptions(loaded)
    }
  }

  useEffect(() => {
    loadData()
  }, [router])

  // Reload data when page comes into focus
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

  if (!currentUser) {
    return null
  }

  // Calculate monthly renewal amount for selected month
  const calculateMonthlyRenewal = (date: Date): number => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    const activeSubs = subscriptions.filter(sub => sub.status === 'Active')
    const renewalsInMonth = activeSubs.filter(sub => {
      const renewalDate = new Date(sub.renewalDate)
      return renewalDate.getFullYear() === year && renewalDate.getMonth() === month
    })

    return renewalsInMonth.reduce((total, sub) => {
      if (sub.cycle === 'Monthly') {
        return total + sub.cost
      } else {
        // For annual subscriptions, only count if renewal is in this month
        return total + (sub.cost / 12)
      }
    }, 0)
  }

  // Get renewal dates for marking on calendar
  const getRenewalDates = (): Date[] => {
    const activeSubs = subscriptions.filter(sub => sub.status === 'Active')
    return activeSubs.map(sub => {
      const date = new Date(sub.renewalDate)
      date.setHours(0, 0, 0, 0)
      return date
    })
  }

  const renewalDates = getRenewalDates()
  const monthlyAmount = calculateMonthlyRenewal(viewDate)

  // Custom tile content to mark renewal dates
  const tileContent = ({ date }: { date: Date }) => {
    const dateStr = date.toDateString()
    const hasRenewal = renewalDates.some(rd => rd.toDateString() === dateStr)
    
    if (hasRenewal) {
      return (
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-pastel-blue rounded-full" />
      )
    }
    return null
  }

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setViewDate(newDate)
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <div className="max-w-md mx-auto px-4 pt-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h1 className="text-2xl font-bold text-white">Renewal calendar</h1>
          </div>
          <p className="text-gray-400 text-sm">Track upcoming subscription renewals</p>
        </div>

        {/* Monthly Renewal Amount Card */}
        <div className="bg-pastel-orange rounded-2xl p-6 mb-6">
          <div className="text-black">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} renewals</span>
            </div>
            <div className="text-3xl font-bold">₹{monthlyAmount.toFixed(2)}</div>
          </div>
        </div>

        {/* Calendar */}
        <div className="mb-20">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 text-pastel-blue hover:bg-gray-900 rounded-lg transition-colors touch-target"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-white font-semibold">
              {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 text-pastel-blue hover:bg-gray-900 rounded-lg transition-colors touch-target"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Component */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <style jsx global>{`
              .react-calendar {
                width: 100%;
                background: transparent;
                border: none;
                font-family: inherit;
              }
              .react-calendar__navigation {
                display: none;
              }
              .react-calendar__month-view__weekdays {
                text-align: center;
                text-transform: uppercase;
                font-weight: 600;
                font-size: 0.75rem;
                color: #9ca3af;
                margin-bottom: 0.5rem;
              }
              .react-calendar__month-view__weekdays__weekday {
                padding: 0.5rem;
              }
              .react-calendar__month-view__days {
                display: grid !important;
                grid-template-columns: repeat(7, 1fr);
                gap: 0.25rem;
              }
              .react-calendar__tile {
                background: transparent;
                border: none;
                padding: 0.75rem 0;
                color: white;
                font-size: 0.875rem;
                position: relative;
                border-radius: 0.5rem;
                transition: all 0.2s;
              }
              .react-calendar__tile:hover {
                background: #1f2937;
              }
              .react-calendar__tile--active {
                background: #7DD3FC;
                color: black;
                font-weight: 600;
              }
              .react-calendar__tile--now {
                background: #374151;
                color: white;
              }
              .react-calendar__tile--neighboringMonth {
                color: #4b5563;
              }
            `}</style>
            <Calendar
              value={viewDate}
              onChange={(value) => {
                if (value instanceof Date) {
                  setViewDate(value)
                }
              }}
              onActiveStartDateChange={({ activeStartDate }) => {
                if (activeStartDate) {
                  setViewDate(activeStartDate)
                }
              }}
              tileContent={tileContent}
              showNeighboringMonth={false}
              key={viewDate.getFullYear() + '-' + viewDate.getMonth()}
            />
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

