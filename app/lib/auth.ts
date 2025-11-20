// Authentication Utilities

export interface User {
  username: string
  password: string // In production, this should be hashed
  fullName?: string
}

export interface CurrentUser {
  username: string
  fullName?: string
  email?: string
  id?: string
}

const USERS_KEY = 'users'
const CURRENT_USER_KEY = 'currentUser'

export const registerUser = (username: string, password: string, fullName?: string): { success: boolean; error?: string } => {
  if (typeof window === 'undefined') return { success: false, error: 'Not available' }
  
  if (!username.trim()) {
    return { success: false, error: 'Username is required' }
  }
  
  if (password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters' }
  }
  
  const users = getUsers()
  
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, error: 'Username already exists' }
  }
  
  users.push({ username, password, fullName })
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  
  return { success: true }
}

export const loginUser = (username: string, password: string): { success: boolean; error?: string } => {
  if (typeof window === 'undefined') return { success: false, error: 'Not available' }
  
  const users = getUsers()
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password)
  
  if (!user) {
    return { success: false, error: 'Invalid username or password' }
  }
  
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ username: user.username, fullName: user.fullName }))
  
  // Migrate old subscriptions if they exist
  migrateOldSubscriptions(user.username)
  
  return { success: true }
}

// Google OAuth sign-in with Supabase
export const signInWithGoogle = async (): Promise<{ success: boolean; error?: string; user?: CurrentUser }> => {
  try {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return { success: false, error: 'Not available on server' }
    }

    // Use client-only import
    const { getSupabaseClient } = await import('./supabase-client')
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // The redirect will happen automatically, so we return success
    // The actual user will be set in the callback handler
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to sign in with Google' }
  }
}

// Get current Supabase user
export const getSupabaseUser = async (): Promise<CurrentUser | null> => {
  try {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return null
    }

    // Use client-only import
    const { getSupabaseClient } = await import('./supabase-client')
    const supabase = getSupabaseClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // Get user metadata (full name from Google profile)
    const fullName = user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
                     user.email?.split('@')[0] || 
                     'User'

    return {
      id: user.id,
      username: user.email?.split('@')[0] || user.id,
      email: user.email,
      fullName: fullName || undefined,
    }
  } catch {
    return null
  }
}

// Check if user is authenticated with Supabase
export const isSupabaseAuthenticated = async (): Promise<boolean> => {
  const user = await getSupabaseUser()
  return user !== null
}

export const logoutUser = async (): Promise<void> => {
  if (typeof window === 'undefined') return
  
  // Logout from Supabase
  try {
    const { getSupabaseClient } = await import('./supabase-client')
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.error('Error signing out from Supabase:', err)
  }
  
  // Clear local storage
  localStorage.removeItem(CURRENT_USER_KEY)
}

export const getCurrentUser = (): CurrentUser | null => {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem(CURRENT_USER_KEY)
  if (!stored) return null
  
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null
}

// Combined auth check - checks both Supabase and local auth
export const checkAuthentication = async (): Promise<boolean> => {
  const supabaseAuth = await isSupabaseAuthenticated()
  const localAuth = isAuthenticated()
  return supabaseAuth || localAuth
}

// Get current user (checks Supabase first, then local)
export const getCurrentUserAsync = async (): Promise<CurrentUser | null> => {
  // Try Supabase first
  const supabaseUser = await getSupabaseUser()
  if (supabaseUser) {
    return supabaseUser
  }
  
  // Fall back to local auth
  return getCurrentUser()
}

const getUsers = (): User[] => {
  if (typeof window === 'undefined') return []
  
  const stored = localStorage.getItem(USERS_KEY)
  if (!stored) return []
  
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

const migrateOldSubscriptions = (username: string): void => {
  const oldKey = 'subscriptions'
  const newKey = `subscriptions_${username}`
  
  const oldData = localStorage.getItem(oldKey)
  if (oldData) {
    // Check if user already has subscriptions
    const existingData = localStorage.getItem(newKey)
    if (!existingData) {
      // Migrate old subscriptions to new user
      localStorage.setItem(newKey, oldData)
    }
    // Clear old key
    localStorage.removeItem(oldKey)
  }
}

