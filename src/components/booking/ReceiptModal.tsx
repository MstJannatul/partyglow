import { CalendarIcon, MapPin, Receipt, X } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  getVendorContactName,
  getVendorDisplayName,
  getVendorInitials
} from '@/lib/vendorUtils'

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  booking: any
  userType: 'customer' | 'vendor'
}

export function ReceiptModal({
  isOpen,
  onClose,
  booking,
  userType
}: ReceiptModalProps) {
  if (!booking) return null

  const otherParty = userType === 'customer' ? booking.vendor : booking.customer
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader className="space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Receipt className="size-5" />
            <DialogTitle>Booking Receipt</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold">{booking.listing?.title}</h2>
            <Badge
              variant={booking.status === 'completed' ? 'default' : 'secondary'}
            >
              {booking.status}
            </Badge>
          </div>

          <Separator />

          {/* Booking Details */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-4 text-muted-foreground" />
                <span className="font-medium">Date & Time</span>
              </div>
              <div className="space-y-1 text-sm">
                <p>{formatDate(booking.start_date)}</p>
                <p>
                  {formatTime(booking.start_date)} -{' '}
                  {formatTime(booking.end_date)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                <span className="font-medium">Location</span>
              </div>
              <div className="text-sm">
                <p>{booking.listing?.location || 'Location not specified'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Party Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">
              {userType === 'customer' ? 'Service Provider' : 'Customer'}
            </h3>
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarImage src={otherParty?.avatar_url} />
                <AvatarFallback>{getVendorInitials(otherParty)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {userType === 'customer'
                    ? getVendorDisplayName(otherParty)
                    : getVendorContactName(otherParty)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {userType === 'customer' ? 'Vendor' : 'Customer'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-3">
            <h3 className="font-semibold">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{booking.listing?.title}</span>
                <span>${booking.total_price}</span>
              </div>
              {booking.payment_reference_number && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Payment Reference</span>
                  <span>#{booking.payment_reference_number}</span>
                </div>
              )}
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>${booking.total_price}</span>
            </div>
          </div>

          {/* Receipt URL if available */}
          {booking.customer_payment_receipt_url && (
            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  window.open(booking.customer_payment_receipt_url, '_blank')
                }
              >
                View Detailed Receipt
              </Button>
            </div>
          )}

          {/* Booking ID */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Booking ID: {booking.id}</p>
            <p>Completed on: {formatDate(booking.updated_at)}</p>
          </div>

          {/* Close Button */}
          <div className="border-t pt-6">
            <Button
              onClick={onClose}
              variant="gradient"
              className="w-full"
              size="lg"
            >
              Close Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
