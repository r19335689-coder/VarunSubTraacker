// This file should only be imported from client components
// It provides a safe way to get the Supabase client

// Use a lazy initialization pattern to avoid SSR issues
let getSupabaseClientFn: (() => any) | null = null

export async function getSupabaseClient() {
  // Only initialize on client-side
  if (typeof window === 'undefined') {
    // Return a placeholder that won't be used
    const { createClient } = await import('@supabase/supabase-js')
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    )
  }

  // Lazy load the actual implementation
  if (!getSupabaseClientFn) {
    const supabaseModule = await import('./supabase')
    getSupabaseClientFn = supabaseModule.getSupabaseClient
  }

  return getSupabaseClientFn()
}

