import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { logSupabaseError } from '@/integrations/supabase/supabaseSafe'
import { queryKeys } from '@/lib/queryKeys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface Favorite {
  id: string
  user_id: string
  listing_id: string
  created_at: string
}

interface FavoriteWithListing {
  id: string
  created_at: string
  listing_id: string
  listings: {
    id: string
    title: string
    description: string
    price: number
    media_urls: string[]
    location: string
    is_active: boolean
    user_id: string
    profiles: {
      full_name: string
      business_name: string
    }
  }
}

export const useFavorites = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.favorites(user?.id),
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })
}

export const useIsFavorited = (listingId: string) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.favorite(listingId, user?.id),
    queryFn: async () => {
      if (!user?.id || !listingId) return false

      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return !!data
    },
    enabled: !!user?.id && !!listingId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })
}

export const useToggleFavorite = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      listingId,
      isFavorited
    }: {
      listingId: string
      isFavorited: boolean
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId)

        if (error) throw error
        return false
      }
      // Add to favorites
      const { error } = await supabase.from('favorites').insert({
        user_id: user.id,
        listing_id: listingId
      })

      if (error) throw error
      return true
    },
    onSuccess: (newIsFavorited, { listingId }) => {
      // Update cache
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites(user?.id) })
      queryClient.setQueryData(
        queryKeys.favorite(listingId, user?.id),
        newIsFavorited
      )

      toast({
        title: newIsFavorited ? 'Added to favorites' : 'Removed from favorites',
        description: newIsFavorited
          ? 'Listing saved to your favorites.'
          : 'Listing removed from favorites.'
      })
    },
    onError: async (error) => {
      await logSupabaseError('Error toggling favorite', error)
      const msg = (error as any)?.message || ''
      toast({
        title: msg.includes('User not authenticated')
          ? 'Sign in required'
          : 'Error',
        description: msg.includes('User not authenticated')
          ? 'Please sign in to save favorites.'
          : 'Failed to update favorites. Please try again.',
        variant: msg.includes('User not authenticated')
          ? undefined
          : 'destructive'
      })
    }
  })
}

export const useFavoriteListings = () => {
  const { user } = useAuth()

  return useQuery<FavoriteWithListing[]>({
    queryKey: queryKeys.favoriteListings(user?.id),
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('favorites')
        .select(
          `
          id,
          created_at,
          listing_id,
          listings!inner (
            id,
            title,
            description,
            price,
            media_urls,
            location,
            is_active,
            user_id,
            profiles!listings_user_id_fkey (
              full_name,
              business_name
            )
          )
        `
        )
        .eq('user_id', user.id)
        .eq('listings.is_active', true)

      if (error) throw error
      return (data || []) as FavoriteWithListing[]
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })
}
