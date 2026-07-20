import { useEffect } from 'react'

import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { logSupabaseError } from '@/integrations/supabase/supabaseSafe'
import { queryKeys } from '@/lib/queryKeys'
import { trackEvent } from '@/services/clientAnalytics'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useRateLimit } from './useRateLimit'

export interface Message {
  id: string
  thread_id: string
  booking_id: string | null
  sender_id: string
  receiver_id: string
  content: string
  sent_at: string
  seen_at: string | null
  is_read: boolean
  // Joined data
  sender_profile?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export const useMessages = (threadId?: string) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.messages(threadId),
    queryFn: async () => {
      if (!threadId) return []
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('thread_id', threadId)
          .order('sent_at', { ascending: true })
        if (error) throw error
        return data || []
      } catch (error: any) {
        await logSupabaseError('Fetch messages failed', error, { threadId })
        throw error
      }
    },
    enabled: !!threadId,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    refetchInterval: 60000 // Refetch every 60 seconds (real-time handled by subscription)
  })

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!threadId) return

    const channel = supabase
      .channel(`messages-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: queryKeys.messages(threadId)
          })
          queryClient.invalidateQueries({ queryKey: ['message-threads'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [threadId, queryClient])

  return query
}

export const useSendMessage = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { withRateLimit } = useRateLimit('strict')

  return useMutation({
    mutationFn: async ({
      threadId,
      receiverId,
      content,
      bookingId
    }: {
      threadId: string
      receiverId: string
      content: string
      bookingId?: string
    }) => {
      if (!user) throw new Error('User not authenticated')

      return withRateLimit(async () => {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            thread_id: threadId,
            booking_id: bookingId || null,
            sender_id: user.id,
            receiver_id: receiverId,
            content
          })
          .select()
          .single()

        if (error) throw error
        return data
      })
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages(variables.threadId)
      })
      queryClient.invalidateQueries({ queryKey: ['message-threads'] })

      // Track message sent
      trackEvent('message_sent', {
        messageId: data.id,
        threadId: variables.threadId,
        hasBookingContext: !!variables.bookingId,
        messageLength: variables.content.length
      })
    },
    onError: (error: any, variables: any) => {
      logSupabaseError('Send message failed', error, {
        threadId: variables?.threadId,
        receiverId: variables?.receiverId
      })
      toast({
        title: 'Failed to send message',
        description:
          error.message || 'Unable to send message. Please try again.',
        variant: 'destructive'
      })
    }
  })
}

export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({
          is_read: true,
          seen_at: new Date().toISOString()
        })
        .eq('id', messageId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.invalidateQueries({ queryKey: ['message-threads'] })
    },
    onError: (error: any, messageId) => {
      logSupabaseError('Mark message as read failed', error, { messageId })
    }
  })
}

export const useMarkThreadMessagesAsRead = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      threadId,
      receiverId
    }: {
      threadId: string
      receiverId: string
    }) => {
      const { error } = await supabase
        .from('messages')
        .update({
          is_read: true,
          seen_at: new Date().toISOString()
        })
        .eq('thread_id', threadId)
        .eq('receiver_id', receiverId)
        .eq('is_read', false)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages(variables.threadId)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.messageThreads(user?.id)
      })
    },
    onError: (error: any, variables: any) => {
      logSupabaseError('Mark thread messages as read failed', error, {
        threadId: variables?.threadId,
        receiverId: variables?.receiverId
      })
    }
  })
}
