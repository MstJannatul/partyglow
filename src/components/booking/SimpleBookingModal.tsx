import { useState } from 'react'
import { format } from 'date-fns'
import {
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  MapPin,
  Package,
  User
} from 'lucide-react'

import { QuantityPicker } from '@/components/listings/QuantityPicker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useCreateBooking } from '@/hooks/useBookings'
import { useInventoryAvailability } from '@/hooks/useInventory'
import { cn } from '@/lib/utils'
import { getVendorDisplayName } from '@/lib/vendorUtils'

interface SimpleBookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listing: any
}

const timeSlots = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00'
]

const durations = [
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 4, label: '4 hours' },
  { value: 6, label: '6 hours' },
  { value: 8, label: '8 hours' }
]

export function SimpleBookingModal({
  open,
  onOpenChange,
  listing
}: SimpleBookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [duration, setDuration] = useState<number>(2)
  const [quantity, setQuantity] = useState<number>(1)
  const [notes, setNotes] = useState('')

  const { user } = useAuth()
  const { toast } = useToast()
  const createBooking = useCreateBooking()
  const { availableStock, isOutOfStock } = useInventoryAvailability(listing.id)

  const isEquipment = listing.type === 'equipment'
  const totalPrice = isEquipment
    ? (listing.price || 0) * quantity
    : (listing.price || 0) * duration

  const [paymentReference] = useState(
    () => `PAY-${Date.now().toString(36).toUpperCase()}`
  )

  const handleBookNow = async () => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to make a booking.',
        variant: 'destructive'
      })
      return
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: 'Missing information',
        description: 'Please select a date and time for your booking.',
        variant: 'destructive'
      })
      return
    }

    if (isEquipment && isOutOfStock) {
      toast({
        title: 'Out of stock',
        description: 'This equipment is currently out of stock.',
        variant: 'destructive'
      })
      return
    }

    if (isEquipment && quantity > availableStock) {
      toast({
        title: 'Insufficient stock',
        description: `Only ${availableStock} items available.`,
        variant: 'destructive'
      })
      return
    }

    const startDate = new Date(selectedDate)
    const [hours, minutes] = selectedTime.split(':').map(Number)
    startDate.setHours(hours, minutes, 0, 0)

    const endDate = new Date(startDate)
    if (isEquipment) {
      // For equipment, default to 1 day rental
      endDate.setDate(startDate.getDate() + 1)
    } else {
      endDate.setHours(hours + duration, minutes, 0, 0)
    }

    try {
      const bookingNotes = isEquipment
        ? `Quantity: ${quantity}${notes ? `\n\nAdditional notes: ${notes}` : ''}`
        : notes || null

      await createBooking.mutateAsync({
        listing_id: listing.id,
        vendor_id: listing.user_id,
        customer_id: user.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        total_price: totalPrice,
        notes: bookingNotes,
        payment_reference_number: paymentReference,
        payment_status: 'pending_instructions'
      })

      handleClose()
    } catch (error) {
      console.error('Booking error:', error)
    }
  }

  const handleClose = () => {
    setSelectedDate(undefined)
    setSelectedTime('')
    setDuration(2)
    setQuantity(1)
    setNotes('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Book {listing.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Listing Preview */}
          <div className="flex gap-4 rounded-lg bg-muted/50 p-4">
            <img
              src={listing.media_urls?.[0] || '/placeholder.svg'}
              alt={listing.title}
              className="size-20 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{listing.title}</h3>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3" />
                {listing.location}
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <User className="size-3" />
                {getVendorDisplayName(listing.vendor)}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline">{listing.listing_type}</Badge>
                <Badge variant="outline">
                  {listing.delivery_type === 'both'
                    ? 'Pick-up/Delivery'
                    : listing.delivery_type === 'pickup'
                      ? 'Pick-up'
                      : listing.delivery_type === 'delivery'
                        ? 'Delivery'
                        : listing.delivery_type}
                </Badge>
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="size-4" />
              Select Date
            </Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              className={cn('p-3 pointer-events-auto border rounded-lg')}
            />
          </div>

          {/* Time and Duration/Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="size-4" />
                {isEquipment ? 'Pickup Time' : 'Start Time'}
              </Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {isEquipment ? (
                <>
                  <Label className="flex items-center gap-2">
                    <Package className="size-4" />
                    Quantity
                  </Label>
                  <QuantityPicker
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    maxQuantity={availableStock || 1}
                    className="w-full"
                  />
                  {availableStock > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {availableStock} available
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Label>Duration</Label>
                  <Select
                    value={duration.toString()}
                    onValueChange={(value) => setDuration(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durations.map((dur) => (
                        <SelectItem
                          key={dur.value}
                          value={dur.value.toString()}
                        >
                          {dur.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label>Special Requests (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requirements or notes for the vendor..."
              rows={3}
              className="mobile-input-stable"
              autoComplete="off"
              inputMode="text"
            />
          </div>

          {/* Booking Summary */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <h4 className="mb-3 font-semibold">Booking Summary</h4>
            <div className="space-y-2 text-sm">
              {selectedDate && (
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{format(selectedDate, 'PPP')}</span>
                </div>
              )}
              {selectedTime && (
                <div className="flex justify-between">
                  <span>{isEquipment ? 'Pickup Time:' : 'Time:'}</span>
                  <span>
                    {selectedTime}
                    {isEquipment
                      ? ` (${quantity} item${quantity > 1 ? 's' : ''})`
                      : ` (${duration} hour${duration > 1 ? 's' : ''})`}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total Price:</span>
                <span className="flex items-center gap-1 text-primary">
                  <DollarSign className="size-4" />
                  {totalPrice}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Instructions Preview */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <h4 className="mb-2 font-semibold text-yellow-800 dark:text-yellow-200">
              Payment Instructions
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              After booking, you'll receive payment instructions with reference:
              <Badge variant="outline" className="ml-2">
                {paymentReference}
              </Badge>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleBookNow}
              disabled={
                !selectedDate || !selectedTime || createBooking.isPending
              }
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {createBooking.isPending ? (
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : null}
              Book Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
