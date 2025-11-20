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

// Database subscription type (matches Supabase schema)
interface DatabaseSubscription {
  id: string
  user_id: string
  name: string
  cost: number
  renewal_date: string
  cycle: Cycle
  status: Status
  category: Category
  created_at?: string
  updated_at?: string
}

// LocalStorage Utilities (for local auth fallback)
const getStorageKey = (username: string): string => {
  return `subscriptions_${username}`
}

// Load subscriptions from Supabase database
export const loadSubscriptionsFromDB = async (userId: string): Promise<Subscription[]> => {
  try {
    if (typeof window === 'undefined') return []
    
    // Lazy load Supabase only on client
    const supabaseModule = await import('./supabase-client').catch(() => null)
    if (!supabaseModule) return []
    const supabase = supabaseModule.getSupabaseClient()
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('renewal_date', { ascending: true })
    
    if (error) {
      console.error('Error loading subscriptions:', error)
      return []
    }
    
    if (!data) return []
    
    return data.map((sub: DatabaseSubscription) => ({
      id: sub.id,
      name: sub.name,
      cost: Number(sub.cost),
      renewalDate: new Date(sub.renewal_date),
      cycle: sub.cycle,
      status: sub.status,
      category: sub.category
    }))
  } catch (err) {
    console.error('Error loading subscriptions from DB:', err)
    return []
  }
}

// Save subscriptions to Supabase database
export const saveSubscriptionsToDB = async (subscriptions: Subscription[], userId: string): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') return false
    
    // Lazy load Supabase only on client
    const supabaseModule = await import('./supabase-client').catch(() => null)
    if (!supabaseModule) return false
    const supabase = supabaseModule.getSupabaseClient()
    
    // Delete all existing subscriptions for this user
    const { error: deleteError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)
    
    if (deleteError) {
      console.error('Error deleting old subscriptions:', deleteError)
      return false
    }
    
    // Insert new subscriptions
    if (subscriptions.length > 0) {
      const dbSubscriptions: Omit<DatabaseSubscription, 'id' | 'created_at' | 'updated_at'>[] = subscriptions.map(sub => ({
        user_id: userId,
        name: sub.name,
        cost: sub.cost,
        renewal_date: sub.renewalDate.toISOString().split('T')[0],
        cycle: sub.cycle,
        status: sub.status,
        category: sub.category
      }))
      
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert(dbSubscriptions)
      
      if (insertError) {
        console.error('Error saving subscriptions:', insertError)
        return false
      }
    }
    
    return true
  } catch (err) {
    console.error('Error saving subscriptions to DB:', err)
    return false
  }
}

// Save a single subscription (for add/update operations)
export const saveSubscriptionToDB = async (subscription: Subscription, userId: string): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') return false
    
    // Lazy load Supabase only on client
    const supabaseModule = await import('./supabase-client').catch(() => null)
    if (!supabaseModule) return false
    const supabase = supabaseModule.getSupabaseClient()
    
    const dbSubscription: Omit<DatabaseSubscription, 'created_at' | 'updated_at'> = {
      id: subscription.id,
      user_id: userId,
      name: subscription.name,
      cost: subscription.cost,
      renewal_date: subscription.renewalDate.toISOString().split('T')[0],
      cycle: subscription.cycle,
      status: subscription.status,
      category: subscription.category
    }
    
    // Check if subscription exists
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('id', subscription.id)
      .eq('user_id', userId)
      .single()
    
    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('subscriptions')
        .update({
          name: dbSubscription.name,
          cost: dbSubscription.cost,
          renewal_date: dbSubscription.renewal_date,
          cycle: dbSubscription.cycle,
          status: dbSubscription.status,
          category: dbSubscription.category
        })
        .eq('id', subscription.id)
        .eq('user_id', userId)
      
      if (error) {
        console.error('Error updating subscription:', error)
        return false
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('subscriptions')
        .insert(dbSubscription)
      
      if (error) {
        console.error('Error inserting subscription:', error)
        return false
      }
    }
    
    return true
  } catch (err) {
    console.error('Error saving subscription to DB:', err)
    return false
  }
}

// Delete subscription from database
export const deleteSubscriptionFromDB = async (subscriptionId: string, userId: string): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') return false
    
    // Lazy load Supabase only on client
    const supabaseModule = await import('./supabase-client').catch(() => null)
    if (!supabaseModule) return false
    const supabase = supabaseModule.getSupabaseClient()
    
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId)
      .eq('user_id', userId)
    
    if (error) {
      console.error('Error deleting subscription:', error)
      return false
    }
    
    return true
  } catch (err) {
    console.error('Error deleting subscription from DB:', err)
    return false
  }
}

// Migrate subscriptions from localStorage to Supabase
export const migrateSubscriptionsToDB = async (userId: string, username: string): Promise<void> => {
  try {
    if (typeof window === 'undefined') return
    
    // Check if migration already done
    const migrationKey = `migrated_to_db_${userId}`
    if (localStorage.getItem(migrationKey)) {
      return // Already migrated
    }
    
    // Load from localStorage (use local function directly)
    const localSubs = loadSubscriptionsLocal(username)
    
    if (localSubs.length > 0) {
      // Save to database
      const success = await saveSubscriptionsToDB(localSubs, userId)
      if (success) {
        // Mark as migrated
        localStorage.setItem(migrationKey, 'true')
        console.log(`Migrated ${localSubs.length} subscriptions to database`)
      }
    } else {
      // No local data, just mark as migrated
      localStorage.setItem(migrationKey, 'true')
    }
  } catch (err) {
    console.error('Error migrating subscriptions:', err)
  }
}

// Main load function - tries DB first, falls back to localStorage
export const loadSubscriptions = async (userKey: string, userId?: string): Promise<Subscription[]> => {
  if (typeof window === 'undefined') return []
  
  // If we have a userId, try loading from database
  if (userId) {
    try {
      const dbSubs = await loadSubscriptionsFromDB(userId)
      if (dbSubs.length > 0 || localStorage.getItem(`migrated_to_db_${userId}`)) {
        return dbSubs
      }
      // If no DB data but we have local data, migrate it
      const localSubs = loadSubscriptionsLocal(userKey)
      if (localSubs.length > 0) {
        await migrateSubscriptionsToDB(userId, userKey)
        return await loadSubscriptionsFromDB(userId)
      }
      return dbSubs
    } catch (err) {
      console.error('Error loading from DB, falling back to localStorage:', err)
    }
  }
  
  // Fall back to localStorage (for local auth users)
  return loadSubscriptionsLocal(userKey)
}

// Load from localStorage (for local auth)
const loadSubscriptionsLocal = (username: string): Subscription[] => {
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

// Main save function - tries DB first, falls back to localStorage
export const saveSubscriptions = async (subscriptions: Subscription[], userKey: string, userId?: string): Promise<void> => {
  if (typeof window === 'undefined') return
  
  // If we have a userId, save to database
  if (userId) {
    const success = await saveSubscriptionsToDB(subscriptions, userId)
    if (success) {
      return
    }
    // If DB save fails, fall back to localStorage
    console.warn('Failed to save to DB, falling back to localStorage')
  }
  
  // Fall back to localStorage (for local auth users)
  saveSubscriptionsLocal(subscriptions, userKey)
}

// Save to localStorage (for local auth)
const saveSubscriptionsLocal = (subscriptions: Subscription[], username: string): void => {
  const serialized = subscriptions.map(sub => ({
    ...sub,
    renewalDate: sub.renewalDate.toISOString()
  }))
  localStorage.setItem(getStorageKey(username), JSON.stringify(serialized))
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

