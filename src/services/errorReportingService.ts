import { supabase } from '@/integrations/supabase/client'

interface ErrorReport {
  message: string
  error?: string
  stack?: string
  severity: 'error' | 'warning' | 'info'
  metadata?: Record<string, any>
  userInfo?: {
    userId?: string
    userAgent?: string
    url?: string
  }
}

class ErrorReportingService {
  private static instance: ErrorReportingService
  private isEnabled = true
  private reportQueue: ErrorReport[] = []
  private isProcessing = false

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService()
    }
    return ErrorReportingService.instance
  }

  async reportError(error: Error | string, context?: Record<string, any>) {
    if (!this.isEnabled) return

    const report: ErrorReport = {
      message: error instanceof Error ? error.message : error,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      severity: 'error',
      metadata: {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      },
      userInfo: {
        userId: (await supabase.auth.getUser()).data.user?.id,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    }

    this.reportQueue.push(report)
    this.processQueue()
  }

  async reportWarning(message: string, context?: Record<string, any>) {
    if (!this.isEnabled) return

    const report: ErrorReport = {
      message,
      error: message,
      severity: 'warning',
      metadata: {
        ...context,
        timestamp: new Date().toISOString(),
        url: window.location.href
      }
    }

    this.reportQueue.push(report)
    this.processQueue()
  }

  private async processQueue() {
    if (this.isProcessing || this.reportQueue.length === 0) return

    this.isProcessing = true

    try {
      while (this.reportQueue.length > 0) {
        const report = this.reportQueue.shift()
        if (report) {
          await this.sendReport(report)
        }
      }
    } catch (error) {
      console.error('Failed to process error queue:', error)
      // Re-enable processing after a delay
      setTimeout(() => {
        this.isProcessing = false
        this.processQueue()
      }, 5000)
    } finally {
      this.isProcessing = false
    }
  }

  private async sendReport(report: ErrorReport) {
    try {
      await supabase.functions.invoke('error-monitor', {
        body: report
      })
    } catch (error) {
      // Fallback: store locally if reporting fails
      this.storeLocallyIfNeeded(report)
      console.warn('Failed to send error report:', error)
    }
  }

  private storeLocallyIfNeeded(report: ErrorReport) {
    try {
      const stored = localStorage.getItem('error_reports')
      const reports = stored ? JSON.parse(stored) : []
      reports.push(report)

      // Keep only last 50 reports
      if (reports.length > 50) {
        reports.splice(0, reports.length - 50)
      }

      localStorage.setItem('error_reports', JSON.stringify(reports))
    } catch (error) {
      console.warn('Failed to store error report locally:', error)
    }
  }

  disable() {
    this.isEnabled = false
  }

  enable() {
    this.isEnabled = true
  }
}

export const errorReporter = ErrorReportingService.getInstance()

// Global error handler
window.addEventListener('error', (event) => {
  errorReporter.reportError(event.error || event.message, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  })
})

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  errorReporter.reportError(event.reason, {
    type: 'unhandled_promise_rejection'
  })
})
