import { format } from 'date-fns'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  User
} from 'lucide-react'

import { BookingTimeline } from '@/components/booking/BookingTimeline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useBooking } from '@/hooks/useBookings'

interface BookingContextWidgetProps {
  bookingId: string
  className?: string
}

export function BookingContextWidget({
  bookingId,
  className
}: BookingContextWidgetProps) {
  const { data: booking, isLoading, error } = useBooking(bookingId)

  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-3/4 rounded bg-muted"></div>
          <div className="h-3 w-1/2 rounded bg-muted"></div>
          <div className="h-3 w-2/3 rounded bg-muted"></div>
        </div>
      </Card>
    )
  }

  if (error || !booking) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="size-4" />
          <span className="text-sm">Failed to load booking details</span>
        </div>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'requested':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTimelineStep = (status: string) => {
    switch (status) {
      case 'requested':
        return 'payment_pending'
      case 'confirmed':
        return 'confirmed'
      case 'in_progress':
        return 'in_progress'
      case 'completed':
        return 'completed'
      case 'cancelled':
        return 'cancelled'
      default:
        return 'payment_pending'
    }
  }

  return (
    <Card className={`space-y-4 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Booking Details</h3>
        </div>
        <Badge className={getStatusColor(booking.status)}>
          {booking.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Booking Info */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="size-3 text-muted-foreground" />
            <span className="text-muted-foreground">Date:</span>
          </div>
          <span className="font-medium">
            {format(new Date(booking.start_date), 'MMM dd, yyyy')}
          </span>

          <div className="flex items-center gap-2">
            <Clock className="size-3 text-muted-foreground" />
            <span className="text-muted-foreground">Time:</span>
          </div>
          <span className="font-medium">
            {format(new Date(booking.start_date), 'h:mm a')}
          </span>

          <div className="flex items-center gap-2">
            <DollarSign className="size-3 text-muted-foreground" />
            <span className="text-muted-foreground">Total:</span>
          </div>
          <span className="font-medium">${booking.total_price}</span>

          {booking.listing && (
            <>
              <div className="flex items-center gap-2">
                <MapPin className="size-3 text-muted-foreground" />
                <span className="text-muted-foreground">Service:</span>
              </div>
              <span className="font-medium">{booking.listing.title}</span>
            </>
          )}
        </div>

        {/* Vendor/Customer Info */}
        <Separator />

        <div className="space-y-2">
          {booking.vendor && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="size-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Vendor:</span>
              </div>
              <span className="text-sm font-medium">
                {booking.vendor.full_name}
              </span>
            </div>
          )}

          {booking.customer && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="size-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Customer:</span>
              </div>
              <span className="text-sm font-medium">
                {booking.customer.full_name}
              </span>
            </div>
          )}
        </div>

        {/* Timeline */}
        <Separator />

        <div>
          <h4 className="mb-2 text-sm font-medium">Progress</h4>
          <BookingTimeline
            currentStep={getTimelineStep(booking.status) as any}
            bookingId={booking.id}
            compact={true}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1">
            <ExternalLink className="mr-1 size-3" />
            View Details
          </Button>

          {booking.status === 'requested' && (
            <Button size="sm" variant="gradient" className="flex-1">
              <CheckCircle className="mr-1 size-3" />
              Confirm Payment
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
