import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  MessageSquare,
  Receipt,
  RotateCcw,
  Search,
  Star,
  X
} from 'lucide-react'

import { ReviewCard } from '@/components/reviews/ReviewCard'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useArchivedBookings } from '@/hooks/useArchivedBookings'
import { useCanReview, useReviews } from '@/hooks/useReviews'
import {
  getVendorContactName,
  getVendorDisplayName,
  getVendorInitials
} from '@/lib/vendorUtils'

import { ReceiptModal } from './ReceiptModal'

// Hook to get booking-specific review count
function useBookingReviewCount(bookingId: string) {
  const { data: reviews } = useReviews(undefined, bookingId)
  return reviews?.length || 0
}

// Component to display booking-specific review info
function BookingReviewInfo({ booking }: { booking: any }) {
  const reviewCount = useBookingReviewCount(booking.id)

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <MessageSquare className="size-3" />
      <span>
        {reviewCount} review{reviewCount !== 1 ? 's' : ''}
      </span>
    </div>
  )
}

// Component to display review content for vendors
function ReadReviewContent({ booking }: { booking: any }) {
  const { data: reviews, isLoading } = useReviews(undefined, booking.id)

  // Get the review for this specific booking
  const bookingReview = reviews?.[0]

  if (isLoading) {
    return <div className="py-8 text-center">Loading review...</div>
  }

  if (!bookingReview) {
    return (
      <div className="py-8 text-center">
        <Star className="mx-auto mb-4 size-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          No review has been left for this booking yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ReviewCard
        review={bookingReview}
        reviewer={booking.customer}
        showVendorActions={true}
      />
    </div>
  )
}

interface ArchivedBookingsModalProps {
  isOpen: boolean
  onClose: () => void
  userType: 'customer' | 'vendor'
}

export function ArchivedBookingsModal({
  isOpen,
  onClose,
  userType
}: ArchivedBookingsModalProps) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const [selectedBookingForReview, setSelectedBookingForReview] =
    useState<any>(null)
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] =
    useState<any>(null)
  const [selectedBookingForReadReview, setSelectedBookingForReadReview] =
    useState<any>(null)

  const { data: archivedBookings = [], isLoading } =
    useArchivedBookings(userType)

  const handleLeaveReview = (booking: any) => {
    if (userType === 'customer' && booking.status === 'completed') {
      setSelectedBookingForReview(booking)
    }
  }

  const handleViewReceipt = (booking: any) => {
    setSelectedBookingForReceipt(booking)
  }

  const handleBookAgain = (booking: any) => {
    if (booking.listing?.id) {
      navigate(`/browse?listing=${booking.listing.id}`)
      onClose()
    }
  }

  const handleReadReview = (booking: any) => {
    setSelectedBookingForReadReview(booking)
  }

  const handleReviewSuccess = () => {
    setSelectedBookingForReview(null)
  }

  // Filter archived bookings
  const filteredBookings = archivedBookings.filter((booking) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const title = booking.listing?.title?.toLowerCase() || ''
      const vendorName =
        getVendorDisplayName(booking.vendor)?.toLowerCase() || ''
      const customerName =
        getVendorContactName(booking.customer)?.toLowerCase() || ''
      const location = booking.listing?.location?.toLowerCase() || ''

      return (
        title.includes(searchLower) ||
        vendorName.includes(searchLower) ||
        customerName.includes(searchLower) ||
        location.includes(searchLower)
      )
    }

    return true
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto p-3 sm:max-h-[80vh] sm:p-6">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4">
          <div>
            <DialogTitle className="text-lg font-semibold sm:text-xl">
              Archived Bookings
            </DialogTitle>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {filteredBookings.length} of {archivedBookings.length} archived
              bookings
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </DialogHeader>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-4 rounded-lg bg-muted/50 p-4 sm:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search archived bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Archived Bookings List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">
              No archived bookings found
            </h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? 'Try adjusting your search term'
                : 'Completed and cancelled bookings will appear here'}
            </p>
          </div>
        ) : (
          <div className="max-h-96 space-y-4 overflow-y-auto">
            {filteredBookings.map((booking) => (
              <Card
                key={booking.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {booking.listing?.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{booking.listing?.location}</span>
                            <span>•</span>
                            <span>
                              {new Date(
                                booking.start_date
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-8">
                            <AvatarImage
                              src={
                                userType === 'customer'
                                  ? booking.vendor?.avatar_url
                                  : booking.customer?.avatar_url
                              }
                            />
                            <AvatarFallback>
                              {userType === 'customer'
                                ? getVendorInitials(booking.vendor)
                                : getVendorInitials(booking.customer)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {userType === 'customer'
                                ? getVendorDisplayName(booking.vendor)
                                : getVendorContactName(booking.customer)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {userType === 'customer' ? 'Vendor' : 'Customer'}
                            </p>
                          </div>
                        </div>

                        {/* Booking-specific review count */}
                        <BookingReviewInfo booking={booking} />
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold">
                        ${booking.total_price}
                      </p>
                      <Badge
                        variant={
                          booking.status === 'completed'
                            ? 'default'
                            : 'secondary'
                        }
                        className="mt-1"
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-wrap gap-2 border-t pt-3 sm:flex-nowrap">
                    {booking.status === 'completed' &&
                      userType === 'customer' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex min-h-[44px] flex-1 items-center gap-2 px-3 text-xs sm:flex-none sm:text-sm"
                            onClick={() => handleLeaveReview(booking)}
                          >
                            <Star className="size-3 sm:size-4" />
                            <span className="xs:inline hidden">Leave</span>{' '}
                            Review
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex min-h-[44px] flex-1 items-center gap-2 px-3 text-xs sm:flex-none sm:text-sm"
                            onClick={() => handleViewReceipt(booking)}
                          >
                            <Receipt className="size-3 sm:size-4" />
                            <span className="xs:inline hidden">View</span>{' '}
                            Receipt
                          </Button>
                        </>
                      )}
                    {booking.status === 'completed' &&
                      userType === 'vendor' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex min-h-[44px] flex-1 items-center gap-2 px-3 text-xs sm:flex-none sm:text-sm"
                            onClick={() => handleReadReview(booking)}
                          >
                            <Star className="size-3 sm:size-4" />
                            <span className="xs:inline hidden">Read</span>{' '}
                            Review
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex min-h-[44px] flex-1 items-center gap-2 px-3 text-xs sm:flex-none sm:text-sm"
                            onClick={() => handleViewReceipt(booking)}
                          >
                            <Receipt className="size-3 sm:size-4" />
                            <span className="xs:inline hidden">View</span>{' '}
                            Receipt
                          </Button>
                        </>
                      )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex min-h-[44px] flex-1 items-center gap-2 px-3 text-xs sm:flex-none sm:text-sm"
                      onClick={() => handleBookAgain(booking)}
                    >
                      <RotateCcw className="size-3 sm:size-4" />
                      <span className="xs:inline hidden">Book</span> Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {selectedBookingForReview && (
          <Dialog
            open={!!selectedBookingForReview}
            onOpenChange={() => setSelectedBookingForReview(null)}
          >
            <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
              <ReviewForm
                bookingId={selectedBookingForReview.id}
                vendorId={selectedBookingForReview.vendor?.user_id}
                listingId={selectedBookingForReview.listing?.id}
                onSuccess={handleReviewSuccess}
                onCancel={() => setSelectedBookingForReview(null)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Receipt Modal */}
        <ReceiptModal
          isOpen={!!selectedBookingForReceipt}
          onClose={() => setSelectedBookingForReceipt(null)}
          booking={selectedBookingForReceipt}
          userType={userType}
        />

        {/* Read Review Modal */}
        {selectedBookingForReadReview && (
          <Dialog
            open={!!selectedBookingForReadReview}
            onOpenChange={() => setSelectedBookingForReadReview(null)}
          >
            <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto p-3 sm:max-h-[80vh] sm:p-6">
              <DialogHeader className="space-y-2 pb-3">
                <DialogTitle className="text-lg sm:text-xl">
                  Review for {selectedBookingForReadReview.listing?.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <ReadReviewContent booking={selectedBookingForReadReview} />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
