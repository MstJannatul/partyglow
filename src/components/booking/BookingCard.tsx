import { useState } from 'react'
import { format } from 'date-fns'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  MessageSquare,
  Package,
  PlayCircle,
  Receipt,
  Truck,
  User,
  XCircle
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getBookingStatusInfo } from '@/hooks/useBookingActions'
import { useUpdateBookingStatus } from '@/hooks/useBookings'
import { useThreadNavigation } from '@/hooks/useThreadNavigation'
import { cn } from '@/lib/utils'
import { getVendorContactName, getVendorDisplayName } from '@/lib/vendorUtils'

interface BookingCardProps {
  booking: any
  userType: 'customer' | 'vendor'
  onStatusUpdate?: (bookingId: string, status: string) => void
}

const statusIconMap = {
  requested: AlertCircle,
  confirmed: CheckCircle,
  in_progress: Clock,
  completed: CheckCircle,
  cancelled: XCircle,
  awaiting_pickup: Package,
  out_for_delivery: Truck,
  item_delivered: Package,
  item_in_use: PlayCircle,
  awaiting_return: Package,
  item_returned: CheckCircle
}

export function BookingCard({
  booking,
  userType,
  onStatusUpdate
}: BookingCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const updateBookingStatus = useUpdateBookingStatus()
  const { createAndSelectThread, navigateToMessages, isCreatingThread } =
    useThreadNavigation()

  const statusInfo = getBookingStatusInfo(booking.status, booking.booking_type)
  const StatusIcon =
    statusIconMap[booking.status as keyof typeof statusIconMap] || AlertCircle
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

  const getAvailableActions = () => {
    if (userType === 'vendor' && booking.status === 'requested') {
      return [
        { label: 'Accept', status: 'confirmed', variant: 'default' as const },
        {
          label: 'Decline',
          status: 'cancelled',
          variant: 'destructive' as const
        }
      ]
    }

    if (userType === 'vendor' && booking.status === 'confirmed') {
      return [
        {
          label: 'Start Service',
          status: 'in_progress',
          variant: 'default' as const
        }
      ]
    }

    if (userType === 'vendor' && booking.status === 'in_progress') {
      return [
        {
          label: 'Mark Complete',
          status: 'completed',
          variant: 'default' as const
        }
      ]
    }

    return []
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

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">
              {booking.listing?.title || 'Service Booking'}
            </CardTitle>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="size-3" />
                {userType === 'customer'
                  ? getVendorDisplayName(booking.vendor)
                  : getVendorContactName(booking.customer)}
              </div>
              {booking.listing?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {booking.listing.location}
                </div>
              )}
            </div>
          </div>
          <Badge className={cn('border', statusInfo.color)}>
            <StatusIcon className="mr-1 size-3" />
            {statusInfo.label}
          </Badge>
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

        {/* Notes */}
        {booking.notes && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Notes:</strong> {booking.notes}
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

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {getAvailableActions().map((action) => (
            <Button
              key={action.status}
              variant={action.variant}
              size="sm"
              onClick={() => handleStatusUpdate(action.status)}
              disabled={isUpdating}
              className="flex-1"
            >
              {isUpdating ? (
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : null}
              {action.label}
            </Button>
          ))}

          {/* Message Button (always available) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleMessage}
            disabled={isUpdating || isCreatingThread}
          >
            {isCreatingThread ? (
              <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            <MessageSquare className="mr-1 size-4" />
            Message
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
