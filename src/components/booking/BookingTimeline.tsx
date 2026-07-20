import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Star,
  Users,
  XCircle
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface BookingTimelineProps {
  currentStep:
    | 'payment_pending'
    | 'payment_confirmed'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
  bookingId?: string | null
  compact?: boolean
  className?: string
}

const timelineSteps = [
  {
    id: 'payment_pending',
    title: 'Payment Required',
    description: 'Complete payment to confirm booking',
    icon: CreditCard,
    color: 'blue'
  },
  {
    id: 'payment_confirmed',
    title: 'Payment Confirmed',
    description: 'Payment received, waiting for vendor confirmation',
    icon: CheckCircle,
    color: 'green'
  },
  {
    id: 'confirmed',
    title: 'Booking Confirmed',
    description: 'Vendors confirmed, event details finalized',
    icon: Calendar,
    color: 'green'
  },
  {
    id: 'in_progress',
    title: 'Event Day',
    description: 'Your party is happening now!',
    icon: Users,
    color: 'purple'
  },
  {
    id: 'completed',
    title: 'Completed',
    description: 'Party finished, please leave a review',
    icon: Star,
    color: 'green'
  }
]

export function BookingTimeline({
  currentStep,
  bookingId,
  compact = false,
  className
}: BookingTimelineProps) {
  const getCurrentStepIndex = () => {
    return timelineSteps.findIndex((step) => step.id === currentStep)
  }

  const currentStepIndex = getCurrentStepIndex()

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed'
    if (stepIndex === currentStepIndex) return 'current'
    return 'pending'
  }

  const getStatusColor = (status: string, stepColor: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-200'
      case 'current':
        return `text-${stepColor}-600 bg-${stepColor}-100 border-${stepColor}-200`
      case 'pending':
        return 'text-gray-400 bg-gray-100 border-gray-200'
      default:
        return 'text-gray-400 bg-gray-100 border-gray-200'
    }
  }

  const getConnectorStatus = (stepIndex: number) => {
    return stepIndex < currentStepIndex ? 'bg-green-400' : 'bg-gray-200'
  }

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {timelineSteps.map((step, index) => {
          const Icon = step.icon
          const status = getStepStatus(index)

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                  getStatusColor(status, step.color)
                )}
              >
                <Icon className="size-3" />
              </div>
              <div className="flex-1">
                <div
                  className={cn(
                    'text-sm font-medium',
                    status === 'current'
                      ? 'text-primary'
                      : status === 'completed'
                        ? 'text-green-600'
                        : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </div>
                {status === 'current' && (
                  <div className="text-xs text-muted-foreground">
                    {step.description}
                  </div>
                )}
              </div>
              {status === 'current' && (
                <Badge variant="outline" className="text-xs">
                  Current
                </Badge>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-semibold">Booking Progress</h3>
          <p className="text-sm text-muted-foreground">
            Track your booking status from request to completion
          </p>
        </div>

        <div className="relative">
          {timelineSteps.map((step, index) => {
            const Icon = step.icon
            const status = getStepStatus(index)
            const isLast = index === timelineSteps.length - 1

            return (
              <div key={step.id} className="relative">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 bg-background',
                      getStatusColor(status, step.color)
                    )}
                  >
                    <Icon className="size-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <div className="mb-1 flex items-center gap-2">
                      <h4
                        className={cn(
                          'font-medium',
                          status === 'current'
                            ? 'text-primary'
                            : status === 'completed'
                              ? 'text-green-600'
                              : 'text-muted-foreground'
                        )}
                      >
                        {step.title}
                      </h4>
                      {status === 'current' && (
                        <Badge variant="outline" className="text-xs">
                          Current Step
                        </Badge>
                      )}
                      {status === 'completed' && (
                        <Badge
                          variant="outline"
                          className="border-green-200 bg-green-50 text-xs text-green-700"
                        >
                          Completed
                        </Badge>
                      )}
                    </div>

                    <p className="mb-2 text-sm text-muted-foreground">
                      {step.description}
                    </p>

                    {/* Additional status information */}
                    {status === 'current' && step.id === 'payment_pending' && (
                      <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <div className="flex items-center gap-2 text-sm text-blue-700">
                          <AlertCircle className="size-4" />
                          <span>
                            Payment required within 24 hours to secure your
                            booking
                          </span>
                        </div>
                      </div>
                    )}

                    {status === 'current' &&
                      step.id === 'payment_confirmed' && (
                        <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3">
                          <div className="flex items-center gap-2 text-sm text-green-700">
                            <Clock className="size-4" />
                            <span>
                              Vendors have been notified and will respond within
                              24 hours
                            </span>
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div
                    className={cn(
                      'absolute left-5 top-10 w-0.5 h-8 -ml-px',
                      getConnectorStatus(index)
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Additional Information */}
        <div className="border-t border-border pt-4">
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>• You'll receive notifications at each step</p>
            <p>• Message threads are available for direct communication</p>
            <p>• Cancellations may be possible before vendor confirmation</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
