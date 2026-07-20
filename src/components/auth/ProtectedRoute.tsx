import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'customer' | 'vendor'
}

export function ProtectedRoute({
  children,
  requiredRole
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    // Redirect to home page with a flag to open the auth modal
    return (
      <Navigate to="/" state={{ openAuth: true, from: location }} replace />
    )
  }

  if (requiredRole && profile?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath =
      profile?.role === 'vendor' ? '/dashboard/vendor' : '/dashboard/customer'
    return <Navigate to={redirectPath} replace />
  }

  return <>{children}</>
}
