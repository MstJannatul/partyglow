import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { trackEvent } from '@/services/clientAnalytics'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Use database types directly to avoid type conflicts
type Review = {
  id: string
  reviewer_id: string
  reviewed_user_id: string
  booking_id: string
  rating: number
  comment: string
  media_urls: string[] | null
  created_at: string
  is_seeded: boolean | null
  response_text: string | null
  response_date: string | null
  is_featured: boolean | null
  helpfulness_score: number | null
}

export const useReviews = (vendorId?: string, bookingId?: string) => {
  return useQuery({
    queryKey: ['reviews', { vendorId, bookingId }],
    queryFn: async (): Promise<Review[]> => {
      if (!vendorId && !bookingId) return []

      let query = supabase.from('reviews').select('*')

      if (bookingId) {
        query = query.eq('booking_id', bookingId)
      } else if (vendorId) {
        query = query.eq('reviewed_user_id', vendorId)
      }

      const { data, error } = await query.order('created_at', {
        ascending: false
      })

      if (error) {
        console.error('Error fetching reviews:', error)
        throw error
      }

      return (data as Review[]) || []
    },
    enabled: !!(vendorId || bookingId)
  })
}

export const useReview = (id: string) => {
  return useQuery({
    queryKey: ['review', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!id
  })
}

export const useCreateReview = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (reviewData: any) => {
      const { data, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single()

      if (error) {
        // Handle specific database constraint errors
        if (
          error.code === '23505' &&
          error.message.includes('unique_review_per_booking')
        ) {
          throw new Error(
            'You have already submitted a review for this booking. You can edit your existing review instead.'
          )
        }
        throw error
      }
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['listings'] })

      // Track review submission
      trackEvent('review_submitted', {
        reviewId: data.id,
        bookingId: variables.booking_id,
        rating: variables.rating,
        hasComment: !!variables.comment,
        hasPhotos: !!(variables.media_urls && variables.media_urls.length > 0)
      })
    },
    onError: (error: any) => {
      console.error('Review submission error:', error)
      // Error will be handled by the form component
    }
  })
}

export const useUpdateReview = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string
      updates: Partial<Review>
    }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['review', data.id] })
      queryClient.invalidateQueries({ queryKey: ['listings'] })

      toast({
        title: 'Review updated! ✨',
        description: 'Your review has been updated successfully.'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description:
          error.message || 'Failed to update review. Please try again.',
        variant: 'destructive'
      })
    }
  })
}

export const useDeleteReview = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['listings'] })

      toast({
        title: 'Review deleted',
        description: 'Your review has been removed.'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Delete failed',
        description:
          error.message || 'Failed to delete review. Please try again.',
        variant: 'destructive'
      })
    }
  })
}

export const useReviewStats = (vendorId: string) => {
  return useQuery({
    queryKey: ['review-stats', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating, created_at')
        .eq('reviewed_user_id', vendorId)

      if (error) throw error

      if (!data?.length) {
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          recentReviews: 0
        }
      }

      const totalReviews = data.length
      const averageRating =
        data.reduce((sum, review) => sum + review.rating, 0) / totalReviews

      const ratingDistribution = data.reduce(
        (acc, review) => {
          acc[review.rating as keyof typeof acc] =
            (acc[review.rating as keyof typeof acc] || 0) + 1
          return acc
        },
        { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      )

      // Count reviews in the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentReviews = data.filter(
        (review) => new Date(review.created_at) >= thirtyDaysAgo
      ).length

      return {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        recentReviews
      }
    },
    enabled: !!vendorId
  })
}

export const useCanReview = (bookingId: string) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['can-review', bookingId, user?.id],
    queryFn: async () => {
      if (!user) return false

      // Check if booking exists and is completed
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, status, customer_id')
        .eq('id', bookingId)
        .eq('customer_id', user.id)
        .eq('status', 'completed')
        .single()

      if (bookingError || !booking) return false

      // Check if user already reviewed this booking
      const { data: existingReview, error: reviewError } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('reviewer_id', user.id)
        .single()

      if (reviewError && reviewError.code !== 'PGRST116') return false

      return !existingReview // Can review if no existing review found
    },
    enabled: !!(bookingId && user)
  })
}

export const useVendorResponse = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      reviewId,
      responseText
    }: {
      reviewId: string
      responseText: string
    }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          response_text: responseText,
          response_date: new Date().toISOString()
        })
        .eq('id', reviewId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })

      toast({
        title: 'Response posted! 💬',
        description: 'Your response has been posted successfully.'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Response failed',
        description:
          error.message || 'Failed to post response. Please try again.',
        variant: 'destructive'
      })
    }
  })
}

export const useReviewVote = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      reviewId,
      isHelpful
    }: {
      reviewId: string
      isHelpful: boolean
    }) => {
      const { data, error } = await supabase
        .from('review_votes')
        .upsert({
          review_id: reviewId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          is_helpful: isHelpful
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Vote failed',
        description: error.message || 'Failed to vote. Please try again.',
        variant: 'destructive'
      })
    }
  })
}
