import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  MapPin,
  MessageCircle,
  Sparkles,
  Star
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useBookingFlow } from '@/contexts/BookingFlowContext'
import { useToast } from '@/hooks/use-toast'
import { useThreadNavigation } from '@/hooks/useThreadNavigation'
import { getVendorDisplayName } from '@/lib/vendorUtils'

import { BookingTimeline } from './BookingTimeline'

export function BookingSuccess() {
  const { state, resetFlow } = useBookingFlow()
  const { navigateToMessages } = useThreadNavigation()
  const { toast } = useToast()
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    if (showConfetti) {
      // Trigger confetti animation
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          setShowConfetti(false)
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [showConfetti])

  const { totalAmount } = state.bookingData
  const { paymentReference } = state.bookingData
  const { selectedDate } = state.bookingData

  const copyReference = () => {
    if (paymentReference) {
      navigator.clipboard.writeText(paymentReference)
      toast({
        title: 'Copied!',
        description: 'Payment reference copied to clipboard'
      })
    }
  }

  const handleViewMessages = () => {
    navigateToMessages(state.messageThreadId || undefined)
    resetFlow()
  }

  const handleBookAnother = () => {
    resetFlow()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Success Header */}
      <div className="space-y-4 text-center">
        <div className="relative">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="size-10 text-green-600" />
          </div>
          {showConfetti && (
            <div className="absolute -right-2 -top-2">
              <Sparkles className="size-8 animate-pulse text-yellow-500" />
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-2xl font-bold text-primary">
            Request sent! 🎉
          </h2>
          <p className="mx-auto max-w-md text-muted-foreground">
            We'll notify you when the vendor responds.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Booking Details */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              <h3 className="font-semibold">Booking Details</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Date & Time
                </span>
                <span className="text-sm font-medium">
                  {selectedDate ? selectedDate.toLocaleDateString() : 'TBD'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Amount
                </span>
                <span className="text-sm font-medium">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Payment Reference
                </span>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                    {paymentReference}
                  </code>
                  <Button variant="ghost" size="sm" onClick={copyReference}>
                    <Copy className="size-3" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Vendors</h4>
                {state.vendorGroups.map((group) => (
                  <div key={group.vendor.user_id} className="text-sm">
                    <span className="font-medium">
                      {getVendorDisplayName(group.vendor)}
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      (${group.totalPrice.toFixed(2)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Payment Instructions */}
          <Card className="border-blue-200 bg-blue-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="size-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Next Steps</h3>
            </div>

            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  1
                </span>
                <span>
                  Vendors will send their payment details in your Messages
                  thread
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  2
                </span>
                <span>
                  Pay vendors directly and include your reference:{' '}
                  <code className="font-mono">{paymentReference}</code>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  3
                </span>
                <span>
                  Share proof of payment if requested and confirm details
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  4
                </span>
                <span>Vendors confirm and you’re all set 🎉</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Timeline & Actions */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              <h3 className="font-semibold">Progress Timeline</h3>
            </div>

            <BookingTimeline
              currentStep="payment_pending"
              bookingId={state.bookingId}
              compact={true}
            />
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleViewMessages}
              className="w-full"
              variant="gradient"
              size="lg"
            >
              <MessageCircle className="mr-2 size-4" />
              View Messages & Updates
              <ArrowRight className="ml-2 size-4" />
            </Button>

            <Button
              onClick={handleBookAnother}
              variant="outline"
              className="w-full"
            >
              Book Another Party
            </Button>
          </div>

          {/* Communication Notice */}
          <Card className="border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-2">
              <MessageCircle className="mt-0.5 size-4 text-green-600" />
              <div className="text-sm text-green-700">
                <p className="mb-1 font-medium">Stay Connected</p>
                <p>
                  A message thread has been created with your vendors. You'll
                  receive notifications for all updates, and can ask questions
                  anytime.
                </p>
              </div>
            </div>
          </Card>

          {/* Review Reminder */}
          <Card className="border-purple-200 bg-purple-50 p-4">
            <div className="flex items-start gap-2">
              <Star className="mt-0.5 size-4 text-purple-600" />
              <div className="text-sm text-purple-700">
                <p className="mb-1 font-medium">Don't Forget!</p>
                <p>
                  We'll remind you to leave a review after your party. Your
                  feedback helps other customers find great vendors.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
