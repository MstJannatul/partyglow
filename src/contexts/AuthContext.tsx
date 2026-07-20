import React, { createContext, useContext, useEffect, useState } from 'react'

import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'
import { trackEvent } from '@/services/clientAnalytics'
import { Session, User } from '@supabase/supabase-js'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: 'customer' | 'vendor',
    phone?: string
  ) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (newPassword: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  useEffect(() => {
    let isSubscribed = true

    // Set up auth state listener FIRST
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isSubscribed) return

      console.log('Auth state change:', event, !!session?.user)

      // Update auth state synchronously
      setSession(session)
      setUser(session?.user ?? null)

      // Handle profile fetching asynchronously
      if (session?.user) {
        setTimeout(() => {
          if (isSubscribed) {
            fetchProfile(session.user.id).then((profileData) => {
              if (isSubscribed) {
                setProfile(profileData)
                setAuthReady(true)
                setLoading(false)
              }
            })
          }
        }, 0)
      } else {
        setProfile(null)
        setAuthReady(true)
        setLoading(false)
      }
    })

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isSubscribed) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        fetchProfile(session.user.id).then((profileData) => {
          if (isSubscribed) {
            setProfile(profileData)
            setAuthReady(true)
            setLoading(false)
          }
        })
      } else {
        setAuthReady(true)
        setLoading(false)
      }
    })

    // Add timeout fallback to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isSubscribed && loading) {
        console.warn(
          '⚠️ Auth initialization timeout, proceeding without full auth state'
        )
        console.log('🔍 Auth Timeout Debug:', {
          isSubscribed,
          loading,
          authReady,
          user: !!user,
          session: !!session,
          localStorage: Object.keys(localStorage).filter(
            (k) => k.includes('supabase') || k.includes('sb-')
          )
        })
        setAuthReady(true)
        setLoading(false)
      }
    }, 3000) // Reduced from 5000ms to 3000ms

    return () => {
      isSubscribed = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'customer' | 'vendor' = 'customer',
    phone?: string
  ) => {
    try {
      const redirectUrl = `${window.location.origin}/`

      const signUpData: any = {
        full_name: fullName,
        role: role
      }

      // Only include phone for vendor accounts
      if (role === 'vendor' && phone?.trim()) {
        signUpData.phone = phone.trim()
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: signUpData
        }
      })

      // Track user signup if successful
      if (!error) {
        trackEvent('user_signup', {
          userType: role,
          source: 'direct_signup'
        })
      }

      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    // Debug: Log parameters received
    console.log('🔍 AuthContext signIn - Parameters received:', {
      email: email,
      password: password ? '***' : 'EMPTY',
      emailType: typeof email,
      passwordType: typeof password,
      emailLength: email?.length || 0,
      passwordLength: password?.length || 0,
      hasEmail: !!email,
      hasPassword: !!password
    })

    // Add validation at the AuthContext level
    if (!email || !password) {
      console.error('❌ AuthContext signIn - Missing email or password')
      return { error: { message: 'Email and password are required' } }
    }

    try {
      console.log('📞 AuthContext signIn - Calling Supabase with:', {
        email: email,
        password: '***'
      })

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      console.log('📋 AuthContext signIn - Supabase response:', {
        hasError: !!error,
        errorMessage: error?.message
      })

      return { error }
    } catch (error) {
      console.error('💥 AuthContext signIn - Exception:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) return { error }

      setProfile(data)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      })

      return { error }
    } catch (error) {
      return { error }
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      return { error }
    } catch (error) {
      return { error }
    }
  }

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading: loading || !authReady,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
