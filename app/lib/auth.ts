// Authentication Utilities

export interface User {
  username: string
  password: string // In production, this should be hashed
  fullName?: string
}

export interface CurrentUser {
  username: string
  fullName?: string
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

// Placeholder for Google OAuth sign-in (to be implemented with Supabase)
export const signInWithGoogle = async (): Promise<{ success: boolean; error?: string; user?: CurrentUser }> => {
  // TODO: Implement Google OAuth with Supabase
  // This is a placeholder that will be replaced when Supabase is set up
  return { success: false, error: 'Google sign-in not yet implemented' }
}

export const logoutUser = (): void => {
  if (typeof window === 'undefined') return
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

