import { useEffect } from 'react'

import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { logSupabaseError } from '@/integrations/supabase/supabaseSafe'
import { queryKeys } from '@/lib/queryKeys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface MessageThread {
  id: string
  booking_id: string | null
  vendor_id: string
  customer_id: string
  listing_id: string | null
  type: 'inquiry' | 'booking'
  status: string
  last_message: string | null
  last_updated: string
  unread_count_vendor: number
  unread_count_customer: number
  created_at: string
  // Joined data
  listing?: {
    id: string
    title: string
    media_urls: string[] | null
  }
  customer_profile?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
  vendor_profile?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export const useMessageThreads = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.messageThreads(user?.id),
    queryFn: async () => {
      if (!user) return []

      try {
        const { data, error } = await supabase
          .from('message_threads')
          .select('*')
          .or(`vendor_id.eq.${user.id},customer_id.eq.${user.id}`)
          .order('last_updated', { ascending: false })

        if (error) throw error
        const threads = (data || []) as MessageThread[]
        if (threads.length === 0) return []

        // Enrich with profiles and listing titles for clearer UI
        const vendorIds = [...new Set(threads.map((t) => t.vendor_id))]
        const customerIds = [...new Set(threads.map((t) => t.customer_id))]
        const listingIds = [
          ...new Set(
            threads.map((t) => t.listing_id).filter(Boolean) as string[]
          )
        ]
        const allUserIds = [...new Set([...vendorIds, ...customerIds])]

        const [
          { data: profiles, error: profilesError },
          { data: listings, error: listingsError }
        ] = await Promise.all([
          allUserIds.length
            ? supabase
                .from('profiles')
                .select('user_id, full_name, avatar_url, business_name')
                .in('user_id', allUserIds)
            : Promise.resolve({ data: [], error: null } as any),
          listingIds.length
            ? supabase
                .from('listings')
                .select('id, title, media_urls')
                .in('id', listingIds)
            : Promise.resolve({ data: [], error: null } as any)
        ])

        if (profilesError) throw profilesError
        if (listingsError) throw listingsError

        const profileMap = new Map<string, any>()
        profiles?.forEach((p: any) => profileMap.set(p.user_id, p))
        const listingMap = new Map<string, any>()
        listings?.forEach((l: any) => listingMap.set(l.id, l))

        return threads.map((t) => ({
          ...t,
          vendor_profile: profileMap.get(t.vendor_id) || null,
          customer_profile: profileMap.get(t.customer_id) || null,
          listing: t.listing_id ? listingMap.get(t.listing_id) || null : null
        })) as MessageThread[]
      } catch (error: any) {
        await logSupabaseError('Fetch message threads failed', error, {
          userId: user?.id
        })
        throw error
      }
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes (real-time handled by subscription)
  })

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('message-threads-subscription')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_threads',
          filter: `vendor_id=eq.${user.id}`
        },
        () =>
          queryClient.invalidateQueries({
            queryKey: queryKeys.messageThreads(user.id)
          })
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_threads',
          filter: `customer_id=eq.${user.id}`
        },
        () =>
          queryClient.invalidateQueries({
            queryKey: queryKeys.messageThreads(user.id)
          })
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, queryClient])

  return query
}

export const useCreateMessageThread = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      bookingId,
      vendorId,
      customerId,
      listingId,
      type = 'inquiry'
    }: {
      bookingId?: string
      vendorId: string
      customerId: string
      listingId?: string
      type?: 'inquiry' | 'booking'
    }) => {
      // Helper to fetch the most recent existing thread
      const fetchExistingThread = async () => {
        const { data, error } = await supabase
          .from('message_threads')
          .select('*')
          .eq('vendor_id', vendorId)
          .eq('customer_id', customerId)
          .order('last_updated', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (error) {
          await logSupabaseError('Existing thread lookup failed', error, {
            vendorId,
            customerId
          })
          return null
        }
        return (data || null) as MessageThread | null
      }

      // Always reuse existing thread for this customer/vendor pair
      const existingThread = await fetchExistingThread()
      if (existingThread) {
        return existingThread as MessageThread
      }

      // Create or reuse thread using upsert on (vendor_id, customer_id)
      const { data, error } = await supabase
        .from('message_threads')
        .upsert(
          {
            booking_id: bookingId || null,
            vendor_id: vendorId,
            customer_id: customerId,
            listing_id: listingId || null,
            type,
            status: 'active'
          },
          { onConflict: 'vendor_id,customer_id' }
        )
        .select()
        .maybeSingle()

      if (error) {
        const isDuplicate =
          error?.code === '23505' ||
          error?.message?.toLowerCase?.().includes('duplicate key value')
        if (isDuplicate) {
          const threadAfterConflict = await fetchExistingThread()
          if (threadAfterConflict) return threadAfterConflict as MessageThread
        }
        await logSupabaseError('Create message thread failed', error, {
          vendorId,
          customerId,
          bookingId,
          listingId,
          type
        })
        throw error
      }

      if (!data) {
        // Fallback safety: fetch again just in case
        const fallbackThread = await fetchExistingThread()
        if (fallbackThread) return fallbackThread as MessageThread
        throw new Error('Failed to create or find message thread')
      }

      return data as MessageThread
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-threads'] })
    },
    onError: (error: any) => {
      const isDuplicate =
        error?.code === '23505' ||
        error?.message?.toLowerCase?.().includes('duplicate key value')
      if (isDuplicate) return
      logSupabaseError('Create conversation failed', error)
      toast({
        title: 'Failed to create conversation',
        description:
          error.message || 'Unable to start conversation. Please try again.',
        variant: 'destructive'
      })
    }
  })
}
export const useMarkThreadAsRead = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (threadId: string) => {
      if (!user) throw new Error('User not authenticated')

      // Determine if user is vendor or customer
      const { data: thread } = await supabase
        .from('message_threads')
        .select('vendor_id, customer_id')
        .eq('id', threadId)
        .single()

      if (!thread) throw new Error('Thread not found')

      const isVendor = thread.vendor_id === user.id
      const updateField = isVendor
        ? 'unread_count_vendor'
        : 'unread_count_customer'

      const { error } = await supabase
        .from('message_threads')
        .update({ [updateField]: 0 })
        .eq('id', threadId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-threads'] })
    },
    onError: (error: any, threadId) => {
      logSupabaseError('Mark thread as read failed', error, { threadId })
    }
  })
}

export const useArchiveThread = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (threadId: string) => {
      const { error } = await supabase
        .from('message_threads')
        .update({ status: 'archived' })
        .eq('id', threadId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-threads'] })
      toast({
        title: 'Conversation archived',
        description: 'You can find it later in your inbox.'
      })
    },
    onError: (error: any, threadId) => {
      logSupabaseError('Archive thread failed', error, { threadId })
      toast({
        title: 'Failed to archive',
        description: error.message || 'Please try again.',
        variant: 'destructive'
      })
    }
  })
}
