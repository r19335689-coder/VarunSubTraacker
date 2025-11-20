// Subscription Data Model & Utilities

export type Cycle = 'Monthly' | 'Annually'
export type Status = 'Active' | 'Trial'
export type Category = 'Software' | 'Shopping' | 'Design' | 'Storage' | 'Entertainment'

export interface Subscription {
  id: string
  name: string
  cost: number
  renewalDate: Date
  cycle: Cycle
  status: Status
  category: Category
}

// LocalStorage Utilities (user-specific)
const getStorageKey = (username: string): string => {
  return `subscriptions_${username}`
}

export const saveSubscriptions = (subscriptions: Subscription[], username: string): void => {
  const serialized = subscriptions.map(sub => ({
    ...sub,
    renewalDate: sub.renewalDate.toISOString()
  }))
  localStorage.setItem(getStorageKey(username), JSON.stringify(serialized))
}

export const loadSubscriptions = (username: string): Subscription[] => {
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

// Calculate Total Monthly Cost
export const calculateTotalMonthlyCost = (subscriptions: Subscription[]): number => {
  const activeSubs = subscriptions.filter(sub => sub.status === 'Active')
  return activeSubs.reduce((total, sub) => {
    if (sub.cycle === 'Monthly') {
      return total + sub.cost
    } else {
      return total + (sub.cost / 12)
    }
  }, 0)
}

// Find Upcoming Renewals (within 7 days)
export const findUpcomingRenewals = (subscriptions: Subscription[]): Subscription[] => {
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

// Count renewals this week
export const countRenewalsThisWeek = (subscriptions: Subscription[]): number => {
  return findUpcomingRenewals(subscriptions).length
}

// Format date for display
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

