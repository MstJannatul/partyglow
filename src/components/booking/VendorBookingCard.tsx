import { useState } from 'react'
import { format } from 'date-fns'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  PauseCircle,
  Phone,
  PlayCircle,
  Receipt,
  StopCircle,
  Truck,
  User,
  XCircle
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useUpdateBookingStatus } from '@/hooks/useBookings'
import { useThreadNavigation } from '@/hooks/useThreadNavigation'
import { cn } from '@/lib/utils'
import { getVendorContactName } from '@/lib/vendorUtils'

interface VendorBookingCardProps {
  booking: any
  onStatusUpdate?: (bookingId: string, status: string) => void
}

const statusConfig = {
  requested: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: AlertCircle,
    label: 'New Request',
    progress: 10
  },
  confirmed: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    label: 'Confirmed',
    progress: 25
  },
  awaiting_pickup: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Package,
    label: 'Awaiting Pickup',
    progress: 40
  },
  out_for_delivery: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Truck,
    label: 'Out for Delivery',
    progress: 60
  },
  item_delivered: {
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: Package,
    label: 'Delivered',
    progress: 75
  },
  in_progress: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: PlayCircle,
    label: 'In Progress',
    progress: 50
  },
  item_in_use: {
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    icon: PlayCircle,
    label: 'In Use',
    progress: 80
  },
  awaiting_return: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Package,
    label: 'Awaiting Return',
    progress: 85
  },
  item_returned: {
    color: 'bg-lime-100 text-lime-800 border-lime-200',
    icon: CheckCircle,
    label: 'Returned',
    progress: 95
  },
  completed: {
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: CheckCircle,
    label: 'Completed',
    progress: 100
  },
  cancelled: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: 'Cancelled',
    progress: 0
  }
}

const getServicePhaseInfo = (phase: string) => {
  const phases = {
    setup_pending: { label: 'Setup Pending', icon: PauseCircle, progress: 30 },
    service_active: { label: 'Service Active', icon: PlayCircle, progress: 60 },
    cleanup_pending: {
      label: 'Cleanup Pending',
      icon: PauseCircle,
      progress: 90
    },
    service_completed: {
      label: 'Service Complete',
      icon: StopCircle,
      progress: 100
    }
  }
  return phases[phase] || phases.setup_pending
}

export function VendorBookingCard({
  booking,
  onStatusUpdate
}: VendorBookingCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const updateBookingStatus = useUpdateBookingStatus()
  const { createAndSelectThread, navigateToMessages, isCreatingThread } =
    useThreadNavigation()

  const status = statusConfig[booking.status] || statusConfig.requested
  const StatusIcon = status.icon
  const servicePhase = booking.service_phase
    ? getServicePhaseInfo(booking.service_phase)
    : null

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      await updateBookingStatus.mutateAsync({
        bookingId: booking.id,
        status: newStatus as any
      })
      onStatusUpdate?.(booking.id, newStatus)
    } catch (error) {
      console.error('Status update failed:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleMessage = async () => {
    try {
      const thread = await createAndSelectThread({
        vendorId: booking.vendor_id,
        customerId: booking.customer_id,
        bookingId: booking.id,
        type: 'booking'
      })
      navigateToMessages(thread.id)
    } catch (error) {
      console.error('Failed to create message thread:', error)
    }
  }

  // Enhanced action logic based on booking status and type
  const getAvailableActions = () => {
    const actions = []

    switch (booking.status) {
      case 'requested':
        actions.push(
          {
            label: 'Accept',
            status: 'confirmed',
            variant: 'default' as const,
            priority: 'high'
          },
          {
            label: 'Decline',
            status: 'cancelled',
            variant: 'destructive' as const,
            priority: 'high'
          }
        )
        break

      case 'confirmed':
        if (booking.booking_type === 'equipment') {
          actions.push({
            label: 'Mark Ready for Pickup',
            status: 'awaiting_pickup',
            variant: 'default' as const
          })
        } else {
          actions.push({
            label: 'Start Service',
            status: 'in_progress',
            variant: 'default' as const
          })
        }
        break

      case 'awaiting_pickup':
        actions.push({
          label: 'Mark Picked Up',
          status: 'item_in_use',
          variant: 'default' as const
        })
        break

      case 'out_for_delivery':
        actions.push({
          label: 'Mark Delivered',
          status: 'item_delivered',
          variant: 'default' as const
        })
        break

      case 'item_delivered':
      case 'item_in_use':
        if (booking.booking_type === 'equipment') {
          actions.push({
            label: 'Schedule Return',
            status: 'awaiting_return',
            variant: 'outline' as const
          })
        } else {
          actions.push({
            label: 'Mark Complete',
            status: 'completed',
            variant: 'default' as const
          })
        }
        break

      case 'in_progress':
        actions.push({
          label: 'Mark Complete',
          status: 'completed',
          variant: 'default' as const
        })
        break

      case 'awaiting_return':
        actions.push({
          label: 'Confirm Return',
          status: 'item_returned',
          variant: 'default' as const
        })
        break

      case 'item_returned':
        actions.push({
          label: 'Complete Booking',
          status: 'completed',
          variant: 'default' as const
        })
        break
    }

    return actions
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      date: format(date, 'MMM dd, yyyy'),
      time: format(date, 'h:mm a')
    }
  }

  const startDateTime = formatDateTime(booking.start_date)
  const endDateTime = formatDateTime(booking.end_date)
  const isUrgent =
    booking.status === 'requested' &&
    new Date(booking.start_date).getTime() - Date.now() < 24 * 60 * 60 * 1000 // Less than 24 hours

  const availableActions = getAvailableActions()

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-shadow border-l-4',
        isUrgent ? 'border-l-red-500 bg-red-50/30' : 'border-l-blue-500',
        booking.status === 'requested' && 'ring-2 ring-yellow-200'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">
                {booking.listing?.title || 'Service Booking'}
              </CardTitle>
              {isUrgent && (
                <Badge variant="destructive" className="text-xs">
                  URGENT
                </Badge>
              )}
            </div>

            {/* Customer Information */}
            <div className="mb-2 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="size-3" />
                <span className="font-medium">
                  {getVendorContactName(booking.customer)}
                </span>
              </div>
              {booking.listing?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {booking.listing.location}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{status.progress}%</span>
              </div>
              <Progress value={status.progress} className="h-2" />
              {servicePhase && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <servicePhase.icon className="size-3" />
                  {servicePhase.label}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge className={cn('border', status.color)}>
              <StatusIcon className="mr-1 size-3" />
              {status.label}
            </Badge>
            {booking.booking_type && (
              <Badge variant="outline" className="text-xs">
                {booking.booking_type}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Booking Details */}
        <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="size-4 text-muted-foreground" />
              <span className="font-medium">{startDateTime.date}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-muted-foreground" />
              <span>
                {startDateTime.time} - {endDateTime.time}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="size-4 text-muted-foreground" />
              <span className="font-medium">${booking.total_price}</span>
            </div>
            {booking.payment_reference_number && (
              <div className="flex items-center gap-2 text-sm">
                <Receipt className="size-4 text-muted-foreground" />
                <span className="font-mono text-xs">
                  {booking.payment_reference_number}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Customer Contact Info */}
        {booking.customer && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Customer: {getVendorContactName(booking.customer)}
                </p>
                <div className="mt-1 flex gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-blue-700 dark:text-blue-300"
                  >
                    <Phone className="mr-1 size-3" />
                    Call
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-blue-700 dark:text-blue-300"
                  >
                    <Mail className="mr-1 size-3" />
                    Email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {booking.notes && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Customer Notes:</strong> {booking.notes}
            </p>
          </div>
        )}

        {/* Payment Status */}
        {booking.payment_status && booking.payment_status !== 'paid' && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Payment:</strong>{' '}
              {booking.payment_status === 'pending_instructions'
                ? 'Awaiting payment instructions'
                : booking.payment_status}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {availableActions.map((action) => (
            <Button
              key={action.status}
              variant={action.variant}
              size="sm"
              onClick={() => handleStatusUpdate(action.status)}
              disabled={isUpdating}
              className={cn(
                'flex-1 min-w-[120px]',
                action.priority === 'high' &&
                  'ring-2 ring-offset-2 ring-blue-500'
              )}
            >
              {isUpdating ? (
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : null}
              {action.label}
            </Button>
          ))}

          {/* Message Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleMessage}
            className="min-w-[120px] flex-1"
            disabled={isUpdating || isCreatingThread}
          >
            {isCreatingThread ? (
              <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            <MessageSquare className="mr-1 size-4" />
            Message Customer
          </Button>
        </div>

        {/* Next Steps Hint */}
        {availableActions.length > 0 &&
          booking.status !== 'completed' &&
          booking.status !== 'cancelled' && (
            <div className="border-t py-1 text-center text-xs text-muted-foreground">
              💡 Next: {availableActions[0]?.label || 'Take action above'}
            </div>
          )}
      </CardContent>
    </Card>
  )
}
