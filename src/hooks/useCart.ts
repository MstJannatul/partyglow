import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { logSupabaseError, safeRpc } from '@/integrations/supabase/supabaseSafe'
import { Database } from '@/integrations/supabase/types'
import { queryKeys } from '@/lib/queryKeys'
import { CartItemWithListingSchema } from '@/schemas'
import { trackEvent } from '@/services/clientAnalytics'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useRateLimit } from './useRateLimit'

type CartItem = Database['public']['Tables']['cart_items']['Row']

interface CartItemWithListing {
  id: string
  customer_id: string
  listing_id: string
  vendor_id: string
  duration_hours: number
  quantity: number
  item_type: string
  inventory_item_id?: string
  reserved_until?: string
  added_at: string
  listing: {
    id: string
    title: string
    price: number
    location: string
    media_urls: string[] | null
    min_booking_hours: number | null
    max_booking_hours: number | null
    listing_type: string | null
  }
  vendor: {
    id: string
    user_id: string
    full_name: string
    avatar_url: string | null
    is_verified: boolean | null
  }
}

export const useCart = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.cart(user?.id),
    queryFn: async () => {
      if (!user) return []

      const data = await safeRpc<CartItemWithListing[]>('get_cart_items', {
        p_customer_id: user.id
      })

      try {
        return CartItemWithListingSchema.array().parse(data || [])
      } catch (e) {
        await logSupabaseError('Cart data validation failed', e, {
          userId: user.id
        })
        return []
      }
    },
    enabled: !!user,
    staleTime: 0 // Always fetch fresh data for cart
  })
}

export const useAddToCart = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuth()
  const { withRateLimit } = useRateLimit('api')

  return useMutation({
    mutationFn: async ({
      listingId,
      vendorId,
      durationHours = 1,
      quantity = 1,
      itemType = 'service',
      inventoryItemId
    }: {
      listingId: string
      vendorId: string
      durationHours?: number
      quantity?: number
      itemType?: string
      inventoryItemId?: string
    }) => {
      if (!user) throw new Error('Must be logged in to add to cart')

      await withRateLimit(async () => {
        await safeRpc('insert_cart_item', {
          p_customer_id: user.id,
          p_listing_id: listingId,
          p_vendor_id: vendorId,
          p_duration_hours: durationHours,
          p_quantity: quantity
        })
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart(user?.id) })
      toast({
        title: 'Added to cart! 🛒',
        description: 'Item has been added to your party cart.'
      })

      // Track add to cart event
      trackEvent('add_to_cart', {
        listingId: variables.listingId,
        vendorId: variables.vendorId,
        itemType: variables.itemType,
        quantity: variables.quantity,
        durationHours: variables.durationHours
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add to cart',
        description: error.message || 'Please try again.',
        variant: 'destructive'
      })
    }
  })
}

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      itemId,
      durationHours,
      quantity
    }: {
      itemId: string
      durationHours?: number
      quantity?: number
    }) => {
      if (!user) throw new Error('Must be logged in')

      await safeRpc('update_cart_item', {
        p_item_id: itemId,
        p_customer_id: user.id,
        p_duration_hours: durationHours || 1
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart(user?.id) })
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update cart item.',
        variant: 'destructive'
      })
    }
  })
}

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) throw new Error('Must be logged in')

      await safeRpc('remove_cart_item', {
        p_item_id: itemId,
        p_customer_id: user.id
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart(user?.id) })
      toast({
        title: 'Item removed',
        description: 'Item has been removed from your cart.'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Remove failed',
        description: error.message || 'Failed to remove item from cart.',
        variant: 'destructive'
      })
    }
  })
}

export const useClearCart = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in')

      await safeRpc('clear_cart', {
        p_customer_id: user.id
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart(user?.id) })
      toast({
        title: 'Cart cleared',
        description: 'All items have been removed from your cart.'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Clear failed',
        description: error.message || 'Failed to clear cart.',
        variant: 'destructive'
      })
    }
  })
}

export const useCartTotal = () => {
  const { data: cartItems } = useCart()

  const itemCount = cartItems?.length || 0

  const signature = `${itemCount}:${cartItems?.map((i) => [i.listing.id, i.duration_hours, i.quantity, i.item_type]).join('|') || ''}`
  const { data: totals } = useQuery({
    queryKey: queryKeys.cartTotals(signature),
    queryFn: async () => {
      if (!cartItems || cartItems.length === 0) return { totalPrice: 0 }
      try {
        const { data, error } = await supabase.functions.invoke(
          'pricing-engine',
          {
            body: { items: cartItems }
          }
        )
        if (error) throw error as any
        return { totalPrice: (data as any)?.total ?? 0 }
      } catch (e) {
        // Fallback to local calculation
        const totalPrice = cartItems.reduce((total, item) => {
          const itemTotal =
            item.item_type === 'equipment'
              ? item.listing.price * (item.quantity || 1)
              : item.listing.price * item.duration_hours
          return total + itemTotal
        }, 0)
        return { totalPrice }
      }
    },
    enabled: itemCount > 0,
    staleTime: 0
  })

  const totalPrice = totals?.totalPrice ?? 0

  return {
    itemCount,
    totalPrice,
    hasItems: itemCount > 0
  }
}
