import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useRateLimit } from '@/hooks/useRateLimit'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'
import { queryKeys } from '@/lib/queryKeys'
import { trackEvent } from '@/services/clientAnalytics'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

type Booking = Database['public']['Tables']['bookings']['Row']
type BookingStatus = Database['public']['Enums']['booking_status']

interface BookingWithDetails extends Booking {
  listing: {
    id: string
    title: string
    price: number
    media_urls: string[] | null
  }
  vendor: {
    id: string
    user_id: string
    full_name: string
    avatar_url: string | null
    is_verified: boolean | null
  }
  customer: {
    id: string
    user_id: string
    full_name: string
    avatar_url: string | null
  }
  timeline_events?: Array<{
    id: string
    event_type: string
    notes: string | null
    created_at: string
    created_by: string
    event_data: any
  }>
}

export const useBookings = (role?: 'customer' | 'vendor') => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['bookings', user?.id, role],
    queryFn: async () => {
      if (!user) return []

      // First, get bookings with basic data
      let bookingsQuery = supabase.from('bookings').select(`
          *,
          listing:listings(*),
          timeline_events:booking_timeline_events(
            id,
            event_type,
            notes,
            created_at,
            created_by,
            event_data
          )
        `)

      if (role === 'customer') {
        bookingsQuery = bookingsQuery.eq('customer_id', user.id)
      } else if (role === 'vendor') {
        bookingsQuery = bookingsQuery.eq('vendor_id', user.id)
      } else {
        // Show all bookings for user (both as customer and vendor)
        bookingsQuery = bookingsQuery.or(
          `customer_id.eq.${user.id},vendor_id.eq.${user.id}`
        )
      }

      const { data: bookings, error: bookingsError } =
        await bookingsQuery.order('created_at', { ascending: false })

      if (bookingsError) throw bookingsError
      if (!bookings || bookings.length === 0) return []

      // Get unique vendor and customer IDs
      const vendorIds = [...new Set(bookings.map((b) => b.vendor_id))]
      const customerIds = [...new Set(bookings.map((b) => b.customer_id))]
      const allUserIds = [...new Set([...vendorIds, ...customerIds])]

      // Fetch all profiles in one query
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', allUserIds)

      if (profilesError) throw profilesError

      // Create a map for quick profile lookups
      const profileMap = new Map()
      profiles?.forEach((profile) => {
        profileMap.set(profile.user_id, profile)
      })

      // Combine the data
      const enrichedBookings = bookings.map((booking) => ({
        ...booking,
        vendor: profileMap.get(booking.vendor_id) || null,
        customer: profileMap.get(booking.customer_id) || null
      }))

      return enrichedBookings
    },
    enabled: !!user
  })
}

export const useBooking = (id: string) => {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      // Get booking with basic data
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(
          `
          *,
          listing:listings(*),
          timeline_events:booking_timeline_events(
            id,
            event_type,
            notes,
            created_at,
            created_by,
            event_data
          ),
          items:booking_items(*),
          delivery_details:booking_delivery_details(*)
        `
        )
        .eq('id', id)
        .single()

      if (bookingError) throw bookingError
      if (!booking) return null

      // Fetch vendor and customer profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', [booking.vendor_id, booking.customer_id])

      if (profilesError) throw profilesError

      // Map profiles
      const vendor =
        profiles?.find((p) => p.user_id === booking.vendor_id) || null
      const customer =
        profiles?.find((p) => p.user_id === booking.customer_id) || null

      return {
        ...booking,
        vendor,
        customer
      }
    },
    enabled: !!id
  })
}

export const useCreateBooking = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { withRateLimit } = useRateLimit('strict')

  return useMutation({
    mutationFn: async (
      bookingData: Database['public']['Tables']['bookings']['Insert']
    ) => {
      return withRateLimit(async () => {
        console.log('Creating booking with data:', bookingData)

        const { data, error } = await supabase
          .from('bookings')
          .insert(bookingData)
          .select()
          .single()

        if (error) {
          console.error('Booking creation error:', error)
          throw error
        }

        console.log('Booking created successfully:', data)

        // Send email notification to vendor about new booking
        try {
          await supabase.functions.invoke('send-notifications', {
            body: {
              type: 'booking_request',
              booking_id: data.id,
              recipient_id: bookingData.vendor_id
            }
          })
          console.log('Email notification sent to vendor')
        } catch (emailError) {
          console.warn('Failed to send email notification:', emailError)
          // Don't fail the booking if email fails
        }

        return data
      })
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast({
        title: 'Booking created! 🎉',
        description: 'Your party booking has been submitted for approval.'
      })

      // Track booking creation
      trackEvent('booking_created', {
        bookingId: data.id,
        listingId: variables.listing_id,
        vendorId: variables.vendor_id,
        customerId: variables.customer_id,
        totalPrice: variables.total_price,
        bookingType: variables.booking_type || 'service'
      })
    },
    onError: (error: any) => {
      console.error('Error creating booking:', error)
      // Error handling is now done in BookingFlowContext
    }
  })
}

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      bookingId,
      status,
      notes
    }: {
      bookingId: string
      status: BookingStatus
      notes?: string
    }) => {
      console.log('Updating booking status:', { bookingId, status, notes })

      // Use the database function for status updates with timeline
      const { error } = await supabase.rpc(
        'update_booking_status_with_timeline',
        {
          p_booking_id: bookingId,
          p_new_status: status,
          p_event_type: `status_${status}`,
          p_notes: notes || null
        }
      )

      if (error) {
        console.error('Status update error:', error)
        throw error
      }

      // Send appropriate email notifications
      try {
        const { data: booking } = await supabase
          .from('bookings')
          .select('customer_id, vendor_id')
          .eq('id', bookingId)
          .single()

        if (booking) {
          let notificationType = ''
          let recipientId = ''

          switch (status) {
            case 'confirmed':
              notificationType = 'booking_confirmed'
              recipientId = booking.customer_id
              break
            case 'cancelled':
              notificationType = 'booking_cancelled'
              recipientId = booking.customer_id
              break
            case 'completed':
              notificationType = 'booking_completed'
              recipientId = booking.customer_id
              break
          }

          if (notificationType && recipientId) {
            await supabase.functions.invoke('send-notifications', {
              body: {
                type: notificationType,
                booking_id: bookingId,
                recipient_id: recipientId
              }
            })
            console.log(
              'Email notification sent for status change:',
              notificationType
            )
          }
        }
      } catch (emailError) {
        console.warn('Failed to send status change email:', emailError)
        // Don't fail the status update if email fails
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({
        queryKey: ['booking', variables.bookingId]
      })

      const statusMessages = {
        confirmed: 'Booking confirmed! 🎉',
        cancelled: 'Booking cancelled',
        completed: 'Booking completed! ✨',
        in_progress: 'Booking is now in progress'
      }

      toast({
        title: statusMessages[variables.status] || 'Booking updated',
        description: 'The booking status has been updated successfully.'
      })
    },
    onError: (error: any) => {
      console.error('Error updating booking status:', error)
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update booking status.',
        variant: 'destructive'
      })
    }
  })
}

export const useUpcomingBookings = (limit: number = 5) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['upcoming-bookings', user?.id, limit],
    queryFn: async () => {
      if (!user) return []

      // Get bookings first
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(
          `
          *,
          listing:listings(title, media_urls)
        `
        )
        .or(`customer_id.eq.${user.id},vendor_id.eq.${user.id}`)
        .in('status', [
          'confirmed',
          'in_progress',
          'awaiting_pickup',
          'out_for_delivery',
          'item_delivered',
          'item_in_use',
          'awaiting_return'
        ])
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(limit)

      if (bookingsError) throw bookingsError
      if (!bookings || bookings.length === 0) return []

      // Get vendor profiles
      const vendorIds = [...new Set(bookings.map((b) => b.vendor_id))]
      const { data: vendors, error: vendorsError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', vendorIds)

      if (vendorsError) throw vendorsError

      // Map vendors
      const vendorMap = new Map()
      vendors?.forEach((vendor) => {
        vendorMap.set(vendor.user_id, vendor)
      })

      // Combine data
      const enrichedBookings = bookings.map((booking) => ({
        ...booking,
        vendor: vendorMap.get(booking.vendor_id) || null
      }))

      return enrichedBookings
    },
    enabled: !!user
  })
}

export const useBookingStats = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['booking-stats', user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, confirmed: 0, completed: 0, revenue: 0 }

      // Get booking counts
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('status, total_price, vendor_id')
        .or(`customer_id.eq.${user.id},vendor_id.eq.${user.id}`)

      if (error) throw error

      const stats = {
        total: bookings.length,
        confirmed: bookings.filter((b) => b.status === 'confirmed').length,
        completed: bookings.filter((b) => b.status === 'completed').length,
        revenue: bookings
          .filter((b) => b.vendor_id === user.id && b.status === 'completed')
          .reduce((sum, b) => sum + (b.total_price || 0), 0)
      }

      return stats
    },
    enabled: !!user
  })
}
