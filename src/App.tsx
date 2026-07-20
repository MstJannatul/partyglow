import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { FocusMainOnRouteChange } from '@/components/a11y/FocusMainOnRouteChange'
import { RouteAnnouncer } from '@/components/a11y/RouteAnnouncer'
import { SkipLink } from '@/components/a11y/SkipLink'
import { PageViewTracker } from '@/components/analytics/PageViewTracker'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SystemHealthMonitor } from '@/components/SystemHealthMonitor'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { DashboardProvider } from '@/contexts/DashboardContext'
import { errorReporter } from '@/services/errorReportingService'
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query'

const Index = lazy(() => import('./pages/Index'))
const Browse = lazy(() => import('./pages/Browse'))
const Messages = lazy(() => import('./pages/Messages'))
const NotFound = lazy(() => import('./pages/NotFound'))
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'))
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Safety = lazy(() => import('./pages/Safety'))
const Contact = lazy(() => import('./pages/Contact'))
const HowItWorks = lazy(() => import('./pages/HowItWorks'))
const BecomeVendor = lazy(() => import('./pages/BecomeVendor'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Settings = lazy(() => import('./pages/Settings'))

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      errorReporter.reportError(error as any, {
        source: 'react-query',
        queryKey: query.queryKey
      })
    }
  }),
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      errorReporter.reportError(error as any, {
        source: 'react-mutation',
        mutationKey: mutation.options.mutationKey
      })
    }
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        console.error('Query failed:', error)
        if (error?.code === 'PGRST116') return false // No data found, don't retry
        if (error?.message?.includes('Network')) return failureCount < 2 // Network errors
        return failureCount < 3
      },
      networkMode: 'online' // Only run queries when online
    }
  }
})

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SystemHealthMonitor>
            <DashboardProvider>
              <TooltipProvider>
                <div className="min-h-screen bg-background">
                  <SkipLink />
                  <RouteAnnouncer />
                  <FocusMainOnRouteChange />
                  <PageViewTracker />
                  <Suspense
                    fallback={
                      <LoadingSpinner
                        size="lg"
                        text="Loading..."
                        className="py-20"
                      />
                    }
                  >
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/browse" element={<Browse />} />
                      <Route
                        path="/messages"
                        element={
                          <ProtectedRoute>
                            <Messages />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/messages"
                        element={<Navigate to="/messages" replace />}
                      />
                      <Route
                        path="/dashboard/customer"
                        element={
                          <ProtectedRoute requiredRole="customer">
                            <CustomerDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dashboard/vendor"
                        element={
                          <ProtectedRoute requiredRole="vendor">
                            <VendorDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <Settings />
                          </ProtectedRoute>
                        }
                      />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/safety" element={<Safety />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/how-it-works" element={<HowItWorks />} />
                      <Route path="/become-vendor" element={<BecomeVendor />} />
                      <Route
                        path="/reset-password"
                        element={<ResetPassword />}
                      />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </div>
                <Toaster />
                <Sonner />
              </TooltipProvider>
            </DashboardProvider>
          </SystemHealthMonitor>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </QueryClientProvider>
)

export default App
