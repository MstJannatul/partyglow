import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'

interface ArchivedBookingWithDetails {
  id: string
  status: string
  start_date: string
  end_date: string
  total_price: number
  created_at: string
  updated_at: string
  listing: {
    id: string
    title: string
    price: number
    media_urls: string[] | null
    location: string
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
}

export const useArchivedBookings = (role?: 'customer' | 'vendor') => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['archived-bookings', user?.id, role],
    queryFn: async () => {
      if (!user) return []

      // Get archived bookings (completed, cancelled)
      let bookingsQuery = supabase
        .from('bookings')
        .select(
          `
          *,
          listing:listings(*)
        `
        )
        .in('status', ['completed', 'cancelled'])

      if (role === 'customer') {
        bookingsQuery = bookingsQuery.eq('customer_id', user.id)
      } else if (role === 'vendor') {
        bookingsQuery = bookingsQuery.eq('vendor_id', user.id)
      } else {
        bookingsQuery = bookingsQuery.or(
          `customer_id.eq.${user.id},vendor_id.eq.${user.id}`
        )
      }

      const { data: bookings, error: bookingsError } =
        await bookingsQuery.order('updated_at', { ascending: false })

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
      const enrichedBookings: ArchivedBookingWithDetails[] = bookings.map(
        (booking) => ({
          ...booking,
          vendor: profileMap.get(booking.vendor_id) || null,
          customer: profileMap.get(booking.customer_id) || null
        })
      )

      return enrichedBookings
    },
    enabled: !!user
  })
}
