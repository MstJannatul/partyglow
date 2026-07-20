import { useCallback, useEffect, useState } from 'react'

import { supabase } from '@/integrations/supabase/client'

interface RateLimitState {
  isBlocked: boolean
  remainingRequests: number
  resetTime: number
  lastCheck: number
}

export const useRateLimit = (type: 'api' | 'strict' = 'api') => {
  const [state, setState] = useState<RateLimitState>({
    isBlocked: false,
    remainingRequests: 100,
    resetTime: 0,
    lastCheck: 0
  })

  const checkRateLimit = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        `rate-limiter?type=${type}`,
        {
          body: {}
        }
      )

      if (error) {
        console.warn('Rate limit check failed:', error)
        return { allowed: true } // Fail open
      }

      setState({
        isBlocked: !data.allowed,
        remainingRequests: data.remainingRequests,
        resetTime: data.resetTime,
        lastCheck: Date.now()
      })

      return { allowed: data.allowed }
    } catch (error) {
      console.warn('Rate limit service unavailable:', error)
      return { allowed: true } // Fail open
    }
  }, [type])

  const withRateLimit = useCallback(
    // TODO: will use proper type other than unknown later
    async (fn: () => Promise<unknown>) => {
      const now = Date.now()

      // Check if we need to refresh rate limit status
      if (state.isBlocked && now >= state.resetTime) {
        setState((prev) => ({ ...prev, isBlocked: false }))
      }

      // If we're still blocked, throw an error
      if (state.isBlocked) {
        throw new Error(
          `Rate limit exceeded. Try again in ${Math.ceil((state.resetTime - now) / 1000)} seconds.`
        )
      }

      // Check rate limit before executing
      const rateLimitResult = await checkRateLimit()

      if (!rateLimitResult.allowed) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }

      return fn()
    },
    [state, checkRateLimit]
  )

  // TODO: will update it while testing
  const [resetIn, setResetIn] = useState(0)

  useEffect(() => {
    const updateResetIn = () => {
      setResetIn(Math.max(0, state.resetTime - Date.now()))
    }
    updateResetIn()
    const interval = setInterval(updateResetIn, 1000)
    return () => clearInterval(interval)
  }, [state.resetTime])

  return {
    isBlocked: state.isBlocked,
    remainingRequests: state.remainingRequests,
    resetIn,
    withRateLimit,
    checkRateLimit
  }
}
