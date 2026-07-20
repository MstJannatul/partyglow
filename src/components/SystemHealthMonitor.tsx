import React, { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

interface SystemHealthState {
  authWorking: boolean
  queriesWorking: boolean
  networkOnline: boolean
  lastCheck: Date
}

export const SystemHealthMonitor: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { loading } = useAuth()
  const [health, setHealth] = useState<SystemHealthState>({
    authWorking: true,
    queriesWorking: true,
    networkOnline: navigator.onLine,
    lastCheck: new Date()
  })
  const [showHealthAlert, setShowHealthAlert] = useState(false)

  useEffect(() => {
    // Monitor network status
    const handleOnline = () =>
      setHealth((prev) => ({ ...prev, networkOnline: true }))
    const handleOffline = () => {
      setHealth((prev) => ({ ...prev, networkOnline: false }))
      setShowHealthAlert(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Monitor auth health - if loading for too long, something's wrong
    const authTimeout = setTimeout(() => {
      if (loading) {
        setHealth((prev) => ({ ...prev, authWorking: false }))
        setShowHealthAlert(true)
      }
    }, 8000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearTimeout(authTimeout)
    }
  }, [loading])

  // Lightweight query health check using a public table
  useEffect(() => {
    let cancelled = false

    const checkQueryHealth = async () => {
      // Categories is public-readable via RLS; small, fast probe
      const { error } = await supabase.from('categories').select('id').limit(1)
      if (cancelled) return

      setHealth((prev) => ({
        ...prev,
        queriesWorking: !error,
        lastCheck: new Date()
      }))

      if (error) {
        console.warn('Health check query failed:', error)
        setShowHealthAlert(true)
      }
    }

    // Initial check and interval
    checkQueryHealth()
    const interval = setInterval(checkQueryHealth, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const handleReload = () => {
    window.location.reload()
  }

  const isSystemHealthy =
    health.authWorking && health.queriesWorking && health.networkOnline

  return (
    <>
      {showHealthAlert && !isSystemHealthy && (
        <div className="fixed left-1/2 top-4 z-50 max-w-md -translate-x-1/2 transform">
          <Alert className="border-destructive bg-destructive/10">
            <AlertTriangle className="size-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                System loading issues detected.
                {!health.networkOnline && ' No internet connection.'}
                {!health.authWorking && ' Authentication timeout.'}
                {!health.queriesWorking && ' API query issues detected.'}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReload}
                className="ml-2"
              >
                <RefreshCw className="mr-1 size-3" />
                Reload
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      {children}
    </>
  )
}
