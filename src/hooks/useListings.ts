import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { logSupabaseError, safeRpc } from '@/integrations/supabase/supabaseSafe'
import { Database } from '@/integrations/supabase/types'
import { queryKeys } from '@/lib/queryKeys'
import { trackEvent } from '@/services/clientAnalytics'
import { ListingsFilters, ListingWithVendor } from '@/types/listings'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useListings = (filters: ListingsFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.listings(filters),
    queryFn: async () => {
      const limit = filters.limit ?? 10
      const offset = filters.offset ?? 0

      // Equipment category IDs - these are all the equipment-related categories
      const equipmentCategoryIds = [
        '44444444-4444-4444-4444-444444444444', // Party Rentals & Equipment
        '6b31f3aa-1966-4f36-939d-42d631632feb', // Tables & Chairs
        '56e9d10d-1e8d-4591-80bc-35371fc6e75f', // Tents & Canopies
        'e202fb45-b506-46fe-b3e6-73eaadb3548e', // Sound Equipment
        '91beec4c-9879-4145-ae0f-8bb487cd815b', // Lighting
        '5c7cb286-81fa-473a-9d22-812b2b3a23cd', // Generators
        'c47ecd4e-e963-46a8-9e45-b5cd61c847fd', // Heating & Cooling
        'f5a1b06f-c96f-490d-95a5-ea8156244b7e', // Kitchen & Serving
        'e8910a4e-a30d-4152-a526-64cffff39cd4', // Stages & Flooring
        'b1a71b6a-3bd8-4629-a584-f7a0bededaf8' // Trash & Cleaning
      ]

      // Service category IDs - these are all the service-related categories
      const serviceCategoryIds = [
        '77777777-7777-7777-7777-777777777777', // Event Services
        'ada54aaf-3c1f-4cd4-a402-7190e2da5882', // DJ Services
        'e593c860-82a9-42f2-a8d0-9e6fbdc87f32', // Catering
        'e00e37a1-7dcc-4141-8fa4-d6d4684b6c09', // Photography
        '33333333-3333-3333-3333-333333333333', // Photography & Videography
        '22222222-2222-2222-2222-222222222222', // Catering & Beverages
        '11111111-1111-1111-1111-111111111111', // Entertainment & Music
        '55555555-5555-5555-5555-555555555555' // Decor & Styling
      ]

      // Handle equipment-all filter specially
      if (filters.category === 'equipment-all') {
        // For equipment-all, search across multiple categories
        let query = supabase
          .from('listings')
          .select(
            `
            *,
            vendor:profiles!listings_user_id_fkey(user_id, full_name, business_name, bio, location, is_verified, avatar_url, vendor_type),
            category:categories(*)
          `
          )
          .eq('is_active', true)
          .in('category_id', equipmentCategoryIds)

        // Apply other filters
        if (filters.location)
          query = query.ilike('location', `%${filters.location}%`)
        if (typeof filters.minPrice === 'number')
          query = query.gte('price', filters.minPrice)
        if (typeof filters.maxPrice === 'number')
          query = query.lte('price', filters.maxPrice)
        if (filters.delivery_type)
          query = query.eq('delivery_type', filters.delivery_type)
        if (filters.search) {
          query = query.or(
            `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
          )
        }

        // Apply sorting
        switch (filters.sort) {
          case 'price_asc':
            query = query.order('price', { ascending: true })
            break
          case 'price_desc':
            query = query.order('price', { ascending: false })
            break
          case 'newest':
            query = query.order('created_at', { ascending: false })
            break
          default:
            query = query.order('created_at', { ascending: false })
        }

        if (typeof offset === 'number' && typeof limit === 'number') {
          query = query.range(offset, offset + limit - 1)
        }

        const { data, error } = await query
        if (error) {
          await logSupabaseError('Equipment listings query failed', error, {
            filters,
            timestamp: new Date().toISOString()
          })
          throw error
        }

        // Provide default review stats
        return (data || []).map((l: any) => ({
          ...l,
          reviews_count: 0,
          average_rating: 0
        }))
      }

      // Handle services-all filter specially
      if (filters.category === 'services-all') {
        // For services-all, search across multiple service categories
        let query = supabase
          .from('listings')
          .select(
            `
            *,
            vendor:profiles!listings_user_id_fkey(user_id, full_name, business_name, bio, location, is_verified, avatar_url, vendor_type),
            category:categories(*)
          `
          )
          .eq('is_active', true)
          .in('category_id', serviceCategoryIds)

        // Apply other filters
        if (filters.location)
          query = query.ilike('location', `%${filters.location}%`)
        if (typeof filters.minPrice === 'number')
          query = query.gte('price', filters.minPrice)
        if (typeof filters.maxPrice === 'number')
          query = query.lte('price', filters.maxPrice)
        if (filters.delivery_type)
          query = query.eq('delivery_type', filters.delivery_type)
        if (filters.search) {
          query = query.or(
            `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
          )
        }

        // Apply sorting
        switch (filters.sort) {
          case 'price_asc':
            query = query.order('price', { ascending: true })
            break
          case 'price_desc':
            query = query.order('price', { ascending: false })
            break
          case 'newest':
            query = query.order('created_at', { ascending: false })
            break
          default:
            query = query.order('created_at', { ascending: false })
        }

        if (typeof offset === 'number' && typeof limit === 'number') {
          query = query.range(offset, offset + limit - 1)
        }

        const { data, error } = await query
        if (error) {
          await logSupabaseError('Services listings query failed', error, {
            filters,
            timestamp: new Date().toISOString()
          })
          throw error
        }

        // Provide default review stats
        return (data || []).map((l: any) => ({
          ...l,
          reviews_count: 0,
          average_rating: 0
        }))
      }

      // Try optimized RPC first (for non-equipment/services categories)
      // Function signature: get_optimized_listings(p_category_id, p_location, p_min_price, p_max_price, p_search, p_limit, p_offset)
      const rpcData = await safeRpc<any[]>('get_optimized_listings', {
        p_category_id: filters.category || null,
        p_location: filters.location || null,
        p_min_price:
          typeof filters.minPrice === 'number' ? filters.minPrice : null,
        p_max_price:
          typeof filters.maxPrice === 'number' ? filters.maxPrice : null,
        p_search: filters.search || null,
        p_limit: limit,
        p_offset: offset
      }).catch(() => null)

      if (rpcData) {
        return rpcData || []
      }

      // Fallback: direct query if RPC fails
      let query = supabase
        .from('listings')
        .select(
          `
          *,
          vendor:profiles!listings_user_id_fkey(user_id, full_name, business_name, bio, location, is_verified, avatar_url, vendor_type),
          category:categories(*)
        `
        )
        .eq('is_active', true)

      // Fallback sorting - keep simple and predictable
      // If a sort is specified, emulate basic sorts we can on columns available
      switch (filters.sort) {
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        // rating_desc and best_match aren't directly supported here; use created_at desc as sensible default
        default:
          query = query.order('created_at', { ascending: false })
      }

      if (filters.category) query = query.eq('category_id', filters.category)
      if (filters.location)
        query = query.ilike('location', `%${filters.location}%`)
      if (typeof filters.minPrice === 'number')
        query = query.gte('price', filters.minPrice)
      if (typeof filters.maxPrice === 'number')
        query = query.lte('price', filters.maxPrice)
      if (filters.delivery_type)
        query = query.eq('delivery_type', filters.delivery_type)
      // Note: verified_only and rating require joins/aggregates; keep fallback simple and skip them
      if (filters.search) {
        // Prefer OR across title/description for fallback
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        )
      }

      if (typeof offset === 'number' && typeof limit === 'number') {
        query = query.range(offset, offset + limit - 1)
      }

      const { data: fbData, error: fbError } = await query
      if (fbError) {
        await logSupabaseError(
          'Listings RPC and fallback both failed',
          fbError,
          { filters, timestamp: new Date().toISOString() }
        )
        throw fbError
      }

      // Provide default review stats in fallback
      return (fbData || []).map((l: any) => ({
        ...l,
        reviews_count: 0,
        average_rating: 0
      }))
    }
  })
}

export const useListing = (id: string) => {
  return useQuery({
    queryKey: queryKeys.listing(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(
          `
          *,
          vendor:profiles!listings_user_id_fkey(user_id, full_name, business_name, bio, location, is_verified, avatar_url, vendor_type),
          category:categories(*),
          packages:listing_packages(*)
        `
        )
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) throw error

      const { data: reviewData } = await supabase
        .from('reviews')
        .select(
          `
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(user_id, full_name, avatar_url, business_name)
        `
        )
        .eq('reviewed_user_id', data.user_id)

      const reviews_count = reviewData?.length || 0
      const average_rating =
        reviews_count > 0
          ? reviewData.reduce(
              (acc: number, review: any) => acc + review.rating,
              0
            ) / reviews_count
          : 0

      return {
        ...data,
        reviews: reviewData || [],
        reviews_count,
        average_rating
      }
    },
    enabled: !!id
  })
}

export const useFeaturedListings = (limit: number = 6) => {
  return useQuery({
    queryKey: queryKeys.featuredListings(limit),
    queryFn: async () => {
      // Use optimized function for featured listings
      const data = await safeRpc<any[]>('get_optimized_listings', {
        p_category_id: null,
        p_location: null,
        p_min_price: null,
        p_max_price: null,
        p_search: null,
        p_limit: limit,
        p_offset: 0
      }).catch(() => null)

      if (data) {
        return (data || []).slice(0, limit)
      }

      // Fallback: direct select
      const { data: fbData, error: fbError } = await supabase
        .from('listings')
        .select(
          `
          *,
          vendor:profiles!listings_user_id_fkey(user_id, full_name, business_name, bio, location, is_verified, avatar_url, vendor_type),
          category:categories(*)
        `
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fbError) throw fbError

      return (fbData || []).map((l: any) => ({
        ...l,
        reviews_count: 0,
        average_rating: 0
      }))
    },
    staleTime: 1000 * 60 * 10 // 10 minutes
  })
}

export const useCreateListing = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (
      listingData: Database['public']['Tables']['listings']['Insert']
    ) => {
      const { data, error } = await supabase
        .from('listings')
        .insert(listingData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      queryClient.invalidateQueries({ queryKey: ['vendor-listings'] })
      toast({
        title: 'Listing created! 🎉',
        description: 'Your party listing is now live on PartyGo.'
      })

      // Track listing creation
      trackEvent('listing_created', {
        listingId: data.id,
        listingType: variables.listing_type,
        category: variables.category_id,
        price: variables.price
      })
    },
    onError: (error: any) => {
      let errorMessage =
        'There was an error creating your listing. Please try again.'

      // Check for specific constraint violations
      if (error?.message?.includes('listings_delivery_type_check')) {
        errorMessage =
          'Invalid delivery type selected. Please choose a valid option.'
      } else if (error?.message?.includes('violates check constraint')) {
        errorMessage =
          "Some information provided doesn't meet our requirements. Please check all fields."
      } else if (error?.message?.includes('duplicate key')) {
        errorMessage = 'A listing with similar details already exists.'
      }

      toast({
        title: 'Failed to create listing',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  })
}

export const useVendorListings = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['vendor-listings', user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from('listings')
        .select(
          `
          *,
          vendor:profiles!listings_user_id_fkey(user_id, full_name, business_name, bio, location, is_verified, avatar_url, vendor_type),
          category:categories(*)
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}

export const useUpdateListing = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string
      updates: Database['public']['Tables']['listings']['Update']
    }) => {
      const { data, error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      queryClient.invalidateQueries({ queryKey: ['vendor-listings'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.listing(data.id) })
      toast({
        title: 'Listing updated! ✨',
        description: 'Your changes have been saved successfully.'
      })
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description:
          'There was an error updating your listing. Please try again.',
        variant: 'destructive'
      })
    }
  })
}

export const useDeleteListing = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('listings').delete().eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      queryClient.invalidateQueries({ queryKey: ['vendor-listings'] })
      toast({
        title: 'Listing deleted! 🗑️',
        description: 'Your listing has been successfully removed.'
      })
    },
    onError: () => {
      toast({
        title: 'Delete failed',
        description:
          'There was an error deleting your listing. Please try again.',
        variant: 'destructive'
      })
    }
  })
}
