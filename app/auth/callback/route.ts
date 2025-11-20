import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url))
  }

  if (code) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables')
        return NextResponse.redirect(new URL('/?error=configuration', request.url))
      }

      // Create Supabase client with cookie support
      const cookieStore = await cookies()
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError)
        return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(exchangeError.message)}`, request.url))
      }

      // Set session in cookies for client-side access
      if (data?.session) {
        const response = NextResponse.redirect(new URL(next, request.url))
        // The session will be available via localStorage on the client
        // We just need to ensure the redirect happens
        return response
      }
    } catch (err: any) {
      console.error('Error in OAuth callback:', err)
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(err.message || 'Unknown error')}`, request.url))
    }
  }

  // Redirect to the dashboard
  return NextResponse.redirect(new URL(next, request.url))
}

