import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

import { errorReporter } from '@/services/errorReportingService'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Chrome-specific error logging
    if (navigator.userAgent.includes('Chrome')) {
      console.warn('Chrome-specific error detected:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent
      })
    }

    try {
      errorReporter.reportError(error, {
        source: 'error-boundary',
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent
      })
    } catch {
      // Ignore error reporting failures
    }

    this.setState({
      error,
      errorInfo
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })

    // Force a page refresh for Chrome compatibility
    if (navigator.userAgent.includes('Chrome')) {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="max-w-md text-center">
            <AlertTriangle className="mx-auto mb-4 size-12 text-destructive" />
            <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
            <p className="mb-4 text-muted-foreground">
              We're sorry, but something unexpected happened. This might be a
              browser compatibility issue.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 rounded-lg bg-muted/50 p-4 text-left text-sm">
                <summary className="mb-2 cursor-pointer font-medium">
                  Error Details
                </summary>
                <pre className="overflow-auto whitespace-pre-wrap">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RefreshCw className="size-4" />
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for easier use
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`
  return WrappedComponent
}
