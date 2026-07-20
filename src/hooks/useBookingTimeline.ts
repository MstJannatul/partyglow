import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'

export interface TimelineEvent {
  id: string
  booking_id: string
  event_type:
    | 'booking_created'
    | 'payment_pending'
    | 'payment_confirmed'
    | 'vendor_confirmed'
    | 'event_started'
    | 'event_completed'
    | 'review_requested'
    | 'cancelled'
  event_data: any
  created_at: string
}

export const useBookingTimeline = (bookingId: string | null) => {
  return useQuery({
    queryKey: ['booking-timeline', bookingId],
    queryFn: async () => {
      if (!bookingId) return []

      // TODO: Create booking_timeline table in database
      console.log(
        'Booking timeline not yet implemented - requires database table'
      )
      return []
    },
    enabled: !!bookingId
  })
}

export const useBookingTimelineStats = () => {
  return useQuery({
    queryKey: ['booking-timeline-stats'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      // Get booking stats for the current user
      const { data, error } = await supabase.rpc('get_booking_timeline_stats', {
        user_id: user.user.id
      })

      if (error) {
        console.error('Error fetching booking timeline stats:', error)
        throw error
      }

      return data
    }
  })
}
