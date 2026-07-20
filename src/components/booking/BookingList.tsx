import { useState } from 'react'
import { Archive, Calendar, Filter, Search, SortAsc } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useArchivedBookings } from '@/hooks/useArchivedBookings'
import { isBookingUrgent } from '@/hooks/useBookingActions'
import { useBookings } from '@/hooks/useBookings'
import { getVendorContactName, getVendorDisplayName } from '@/lib/vendorUtils'

import { ArchivedBookingsModal } from './ArchivedBookingsModal'
import { BookingCard } from './BookingCard'
import { VendorBookingCard } from './VendorBookingCard'

interface BookingListProps {
  userType: 'customer' | 'vendor'
  filters?: {
    status?: string
    search?: string
    sortBy?: string
  }
  showArchiveButton?: boolean
}

const statusOptions = [
  { value: 'all', label: 'All Bookings' },
  { value: 'requested', label: 'New Requests' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'awaiting_pickup', label: 'Ready for Pickup' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'item_delivered', label: 'Delivered' },
  { value: 'item_in_use', label: 'In Use' },
  { value: 'awaiting_return', label: 'Awaiting Return' },
  { value: 'item_returned', label: 'Returned' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

const vendorSortOptions = [
  { value: 'urgency_desc', label: 'Most Urgent First' },
  { value: 'date_desc', label: 'Newest First' },
  { value: 'date_asc', label: 'Oldest First' },
  { value: 'price_desc', label: 'Highest Price' },
  { value: 'price_asc', label: 'Lowest Price' },
  { value: 'status_priority', label: 'By Status Priority' }
]

const customerSortOptions = [
  { value: 'date_desc', label: 'Newest First' },
  { value: 'date_asc', label: 'Oldest First' },
  { value: 'price_desc', label: 'Highest Price' },
  { value: 'price_asc', label: 'Lowest Price' }
]

export function BookingList({
  userType,
  filters: initialFilters,
  showArchiveButton = true
}: BookingListProps) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState(initialFilters?.search || '')
  const [statusFilter, setStatusFilter] = useState(
    initialFilters?.status || 'all'
  )
  const [sortBy, setSortBy] = useState(
    initialFilters?.sortBy ||
      (userType === 'vendor' ? 'urgency_desc' : 'date_desc')
  )
  const [showArchiveModal, setShowArchiveModal] = useState(false)

  const { data: allBookings = [], isLoading, error } = useBookings(userType)
  const { data: archivedBookings = [] } = useArchivedBookings(userType)

  // Filter bookings based on context
  const bookings = allBookings.filter((booking) => {
    // Filter out completed/cancelled bookings from main list
    if (['completed', 'cancelled'].includes(booking.status)) {
      return false
    }

    // If this is for requests tab, only show requested bookings
    if (initialFilters?.status === 'requested') {
      return booking.status === 'requested'
    }

    // For bookings tab, exclude requested bookings
    if (userType === 'vendor' && !initialFilters?.status) {
      return booking.status !== 'requested'
    }

    return true
  })

  // Filter and sort bookings
  const filteredBookings = bookings
    .filter((booking) => {
      // Status filter
      if (statusFilter !== 'all' && booking.status !== statusFilter) {
        return false
      }

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
    .sort((a, b) => {
      switch (sortBy) {
        case 'urgency_desc': {
          // Sort by urgency first, then by date
          const aUrgent = isBookingUrgent(a)
          const bUrgent = isBookingUrgent(b)
          if (aUrgent && !bUrgent) return -1
          if (!aUrgent && bUrgent) return 1
          return (
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          )
        }
        case 'status_priority': {
          // Priority order: requested > confirmed > in_progress > others
          const statusPriority = {
            requested: 1,
            confirmed: 2,
            in_progress: 3,
            awaiting_pickup: 4,
            out_for_delivery: 5,
            item_delivered: 6,
            item_in_use: 7,
            awaiting_return: 8,
            item_returned: 9,
            completed: 10,
            cancelled: 11
          }
          return (
            (statusPriority[a.status] || 999) -
            (statusPriority[b.status] || 999)
          )
        }
        case 'date_asc':
          return (
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          )
        case 'date_desc':
          return (
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
          )
        case 'price_asc':
          return (a.total_price || 0) - (b.total_price || 0)
        case 'price_desc':
          return (b.total_price || 0) - (a.total_price || 0)
        default:
          return 0
      }
    })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">
          Failed to load bookings. Please try again.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              {userType === 'customer'
                ? 'My Bookings'
                : statusFilter === 'requested'
                  ? 'New Booking Requests'
                  : 'My Vendor Bookings'}
            </h2>
            <p className="text-muted-foreground">
              {filteredBookings.length} of {bookings.length} active bookings
              {userType === 'vendor' && (
                <span className="ml-2">
                  • {filteredBookings.filter((b) => isBookingUrgent(b)).length}{' '}
                  urgent
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Archive Button - only show if enabled */}
            {showArchiveButton && (
              <Button
                variant="gradient"
                size="sm"
                className="flex items-center gap-2 bg-gradient-primary text-white"
                onClick={() => setShowArchiveModal(true)}
              >
                <Archive className="size-4" />
                Archive
                {archivedBookings.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-white/20 text-white"
                  >
                    {archivedBookings.length}
                  </Badge>
                )}
              </Button>
            )}

            {userType === 'vendor' &&
              statusFilter === 'requested' &&
              filteredBookings.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {filteredBookings.length} pending action
                  {filteredBookings.length > 1 ? 's' : ''}
                </Badge>
              )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4 sm:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="mr-2 size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SortAsc className="mr-2 size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(userType === 'vendor'
                ? vendorSortOptions
                : customerSortOptions
              ).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="py-12 text-center">
          <Calendar className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">No bookings found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : userType === 'customer'
                ? 'Start booking services to see them here'
                : 'No booking requests yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) =>
            userType === 'vendor' ? (
              <VendorBookingCard
                key={booking.id}
                booking={booking}
                onStatusUpdate={(bookingId, status) => {
                  // Optional callback for real-time updates
                  // console.log(`Booking ${bookingId} updated to ${status}`)
                }}
              />
            ) : (
              <BookingCard
                key={booking.id}
                booking={booking}
                userType={userType}
                onStatusUpdate={(bookingId, status) => {
                  // Optional callback for real-time updates
                  // console.log(`Booking ${bookingId} updated to ${status}`)
                }}
              />
            )
          )}
        </div>
      )}

      {/* Archived Bookings Modal */}
      <ArchivedBookingsModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        userType={userType}
      />
    </div>
  )
}
