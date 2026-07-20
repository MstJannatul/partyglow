import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'

interface BookingAction {
  action: string
  label: string
  variant: 'default' | 'destructive' | 'outline' | 'secondary'
  priority?: 'high' | 'medium' | 'low'
}

export const useBookingActions = (bookingId: string) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['booking-actions', bookingId, user?.id],
    queryFn: async (): Promise<BookingAction[]> => {
      if (!user || !bookingId) return []

      try {
        // Get booking details first to determine available actions
        const { data: booking, error } = await supabase
          .from('bookings')
          .select(
            `
            *,
            listing:listings(listing_type, delivery_type)
          `
          )
          .eq('id', bookingId)
          .single()

        if (error || !booking) return []

        // Map actions based on current status and booking type
        const actions: BookingAction[] = []

        switch (booking.status) {
          case 'requested':
            actions.push(
              {
                action: 'confirmed',
                label: 'Accept Booking',
                variant: 'default',
                priority: 'high'
              },
              {
                action: 'cancelled',
                label: 'Decline',
                variant: 'destructive',
                priority: 'high'
              }
            )
            break

          case 'confirmed':
            if (booking.booking_type === 'equipment') {
              actions.push({
                action: 'awaiting_pickup',
                label: 'Ready for Pickup',
                variant: 'default'
              })
            } else if (booking.booking_type === 'service') {
              actions.push({
                action: 'in_progress',
                label: 'Start Service',
                variant: 'default'
              })
            }
            break

          case 'awaiting_pickup':
            actions.push({
              action: 'item_in_use',
              label: 'Mark Picked Up',
              variant: 'default'
            })
            break

          case 'out_for_delivery':
            actions.push({
              action: 'item_delivered',
              label: 'Mark Delivered',
              variant: 'default'
            })
            break

          case 'item_delivered':
          case 'item_in_use':
            if (booking.booking_type === 'equipment') {
              actions.push({
                action: 'awaiting_return',
                label: 'Schedule Return',
                variant: 'outline'
              })
            } else {
              actions.push({
                action: 'completed',
                label: 'Mark Complete',
                variant: 'default'
              })
            }
            break

          case 'in_progress':
            actions.push({
              action: 'completed',
              label: 'Complete Service',
              variant: 'default'
            })
            break

          case 'awaiting_return':
            actions.push({
              action: 'item_returned',
              label: 'Confirm Return',
              variant: 'default'
            })
            break

          case 'item_returned':
            actions.push({
              action: 'completed',
              label: 'Complete Booking',
              variant: 'default'
            })
            break
        }

        return actions
      } catch (error) {
        console.error('Error fetching booking actions:', error)
        return []
      }
    },
    enabled: !!user && !!bookingId,
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}

// Get status display information
export const getBookingStatusInfo = (status: string, bookingType?: string) => {
  const statusMap: Record<string, any> = {
    requested: {
      label: 'New Request',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      progress: 10,
      urgency: 'high'
    },
    confirmed: {
      label: 'Confirmed',
      color: 'bg-green-100 text-green-800 border-green-200',
      progress: 25,
      urgency: 'medium'
    },
    awaiting_pickup: {
      label: 'Ready for Pickup',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      progress: 40,
      urgency: 'medium'
    },
    out_for_delivery: {
      label: 'Out for Delivery',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      progress: 60,
      urgency: 'low'
    },
    item_delivered: {
      label: 'Delivered',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      progress: 75,
      urgency: 'low'
    },
    in_progress: {
      label: 'In Progress',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      progress: 50,
      urgency: 'medium'
    },
    item_in_use: {
      label: 'In Use',
      color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      progress: 80,
      urgency: 'low'
    },
    awaiting_return: {
      label: 'Awaiting Return',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      progress: 85,
      urgency: 'medium'
    },
    item_returned: {
      label: 'Returned',
      color: 'bg-lime-100 text-lime-800 border-lime-200',
      progress: 95,
      urgency: 'low'
    },
    completed: {
      label: 'Completed',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      progress: 100,
      urgency: 'none'
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-red-100 text-red-800 border-red-200',
      progress: 0,
      urgency: 'none'
    }
  }

  return statusMap[status] || statusMap.requested
}

// Helper to determine if a booking needs urgent attention
export const isBookingUrgent = (booking: any): boolean => {
  if (booking.status === 'requested') {
    const timeUntilStart = new Date(booking.start_date).getTime() - Date.now()
    return timeUntilStart < 24 * 60 * 60 * 1000 // Less than 24 hours
  }

  if (booking.status === 'awaiting_pickup') {
    const timeUntilStart = new Date(booking.start_date).getTime() - Date.now()
    return timeUntilStart < 4 * 60 * 60 * 1000 // Less than 4 hours
  }

  return false
}
