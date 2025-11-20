// Notification Settings Utilities

export type NotificationTimeframe = '1 day' | '3 days' | '1 week' | '2 weeks'

export interface NotificationSettings {
  emailEnabled: boolean
  timeframe: NotificationTimeframe
}

// Load notification settings from database
export const loadNotificationSettingsFromDB = async (userId: string): Promise<NotificationSettings | null> => {
  try {
    if (typeof window === 'undefined') return null
    
    // Lazy load Supabase only on client
    const supabaseModule = await import('./supabase-client').catch(() => null)
    if (!supabaseModule) return null
    const supabase = supabaseModule.getSupabaseClient()
    
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return defaults
        return null
      }
      console.error('Error loading notification settings:', error)
      return null
    }
    
    if (!data) return null
    
    return {
      emailEnabled: data.email_enabled || false,
      timeframe: (data.timeframe as NotificationTimeframe) || '3 days'
    }
  } catch (err) {
    console.error('Error loading notification settings from DB:', err)
    return null
  }
}

// Save notification settings to database
export const saveNotificationSettingsToDB = async (settings: NotificationSettings, userId: string): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') return false
    
    // Lazy load Supabase only on client
    const supabaseModule = await import('./supabase-client').catch(() => null)
    if (!supabaseModule) return false
    const supabase = supabaseModule.getSupabaseClient()
    
    // Check if settings exist
    const { data: existing } = await supabase
      .from('notification_settings')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('notification_settings')
        .update({
          email_enabled: settings.emailEnabled,
          timeframe: settings.timeframe
        })
        .eq('user_id', userId)
      
      if (error) {
        console.error('Error updating notification settings:', error)
        return false
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('notification_settings')
        .insert({
          user_id: userId,
          email_enabled: settings.emailEnabled,
          timeframe: settings.timeframe
        })
      
      if (error) {
        console.error('Error inserting notification settings:', error)
        return false
      }
    }
    
    return true
  } catch (err) {
    console.error('Error saving notification settings to DB:', err)
    return false
  }
}

// Load settings (tries DB first, falls back to localStorage)
export const loadNotificationSettings = async (userId?: string): Promise<NotificationSettings> => {
  const defaults: NotificationSettings = {
    emailEnabled: false,
    timeframe: '3 days'
  }
  
  if (typeof window === 'undefined') return defaults
  
  // Try database first if we have userId
  if (userId) {
    const dbSettings = await loadNotificationSettingsFromDB(userId)
    if (dbSettings) {
      return dbSettings
    }
  }
  
  // Fall back to localStorage
  const stored = localStorage.getItem('notification_settings')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return defaults
    }
  }
  
  return defaults
}

// Save settings (tries DB first, falls back to localStorage)
export const saveNotificationSettings = async (settings: NotificationSettings, userId?: string): Promise<void> => {
  if (typeof window === 'undefined') return
  
  // Try database first if we have userId
  if (userId) {
    const success = await saveNotificationSettingsToDB(settings, userId)
    if (success) {
      return
    }
  }
  
  // Fall back to localStorage
  localStorage.setItem('notification_settings', JSON.stringify(settings))
}

