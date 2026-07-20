import { format } from 'date-fns'
import {
  Calendar,
  Clock,
  CreditCard,
  FileText,
  MapPin,
  Users
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getVendorDisplayName, getVendorInitials } from '@/lib/vendorUtils'

interface BookingReviewProps {
  bookingData: any
  cartItems: any[]
  vendorGroups: any[]
}

export function BookingReview({
  bookingData,
  cartItems,
  vendorGroups
}: BookingReviewProps) {
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.listing.price * item.duration_hours,
    0
  )
  const platformFee = totalPrice * 0.05
  const estimatedTax = totalPrice * 0.08
  const grandTotal = totalPrice + platformFee + estimatedTax

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold">Review and send request</h3>
        <p className="text-muted-foreground">You won't be charged yet.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Event Details */}
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="mb-3 flex items-center gap-2 font-medium">
              <Calendar className="size-4" />
              Event Schedule
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="text-sm font-medium">
                  {bookingData.selectedDate
                    ? format(bookingData.selectedDate, 'EEEE, MMMM d, yyyy')
                    : 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Time</span>
                <span className="text-sm font-medium">
                  {bookingData.selectedTimeSlot
                    ? `${bookingData.selectedTimeSlot.start} - ${bookingData.selectedTimeSlot.end}`
                    : 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="text-sm font-medium">
                  {Math.max(...cartItems.map((item) => item.duration_hours))}{' '}
                  hours
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="mb-3 flex items-center gap-2 font-medium">
              <MapPin className="size-4" />
              Event Location
            </h4>
            <div className="text-sm text-muted-foreground">
              <p>Event address will be confirmed</p>
              <p>Access instructions and contact details provided</p>
            </div>
          </Card>

          {bookingData.notes && (
            <Card className="p-4">
              <h4 className="mb-3 flex items-center gap-2 font-medium">
                <FileText className="size-4" />
                Special Requirements
              </h4>
              <p className="text-sm text-muted-foreground">
                {bookingData.notes}
              </p>
            </Card>
          )}
        </div>

        {/* Vendor & Services */}
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="mb-3 flex items-center gap-2 font-medium">
              <Users className="size-4" />
              Your Vendors ({vendorGroups.length})
            </h4>
            <div className="space-y-3">
              {vendorGroups.map((group) => (
                <div
                  key={group.vendor.user_id}
                  className="flex items-center gap-3 rounded-lg bg-muted/30 p-3"
                >
                  <Avatar className="size-8">
                    <AvatarImage src={group.vendor.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                      {getVendorInitials(group.vendor)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">
                      {getVendorDisplayName(group.vendor)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {group.items.length} service
                      {group.items.length !== 1 ? 's' : ''} • $
                      {group.totalPrice.toFixed(2)}
                    </div>
                  </div>
                  {group.vendor.is_verified && (
                    <Badge variant="secondary" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="mb-3 flex items-center gap-2 font-medium">
              <CreditCard className="size-4" />
              Payment Summary
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Services subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Platform fee (5%)</span>
                <span>${platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Estimated tax</span>
                <span>${estimatedTax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Terms and conditions */}
      <Card className="bg-muted/30 p-4">
        <h4 className="mb-2 font-medium">Booking Terms</h4>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            • All bookings are subject to vendor availability and confirmation
          </p>
          <p>
            • Cancellation policies vary by vendor (typically 48-72 hours
            notice)
          </p>
          <p>
            • Payments are arranged directly with vendors; coordinate in
            Messages and include your payment reference
          </p>
          <p>
            • Platform fees support customer support and product development
          </p>
        </div>
      </Card>
    </div>
  )
}
