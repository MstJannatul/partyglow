import React from 'react'
import { RefreshCw, Wifi } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'

interface QueryGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
  loadingFallback?: React.ReactNode
}

export const QueryGuard: React.FC<QueryGuardProps> = ({
  children,
  fallback,
  requireAuth = false,
  loadingFallback
}) => {
  const { loading, user } = useAuth()
  const [networkOnline, setNetworkOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setNetworkOnline(true)
    const handleOffline = () => setNetworkOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Show loading state while auth is initializing but only if required
  if (requireAuth && loading) {
    return (
      loadingFallback || (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )
    )
  }

  // Show network error
  if (!networkOnline) {
    return (
      fallback || (
        <Alert>
          <Wifi className="size-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>No internet connection. Please check your network.</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-1 size-3" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )
    )
  }

  // Show auth required message
  if (requireAuth && !loading && !user) {
    return (
      fallback || (
        <Alert>
          <AlertDescription>
            Please sign in to view this content.
          </AlertDescription>
        </Alert>
      )
    )
  }

  // All checks passed, render children
  return <>{children}</>
}
