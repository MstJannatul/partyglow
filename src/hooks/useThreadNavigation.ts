import { useCallback, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { MessageThread, useCreateMessageThread } from './useMessageThreads'

export const useThreadNavigation = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const createThread = useCreateMessageThread()

  const currentThreadId = searchParams.get('thread')
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(
    null
  )

  const selectThread = useCallback(
    (thread: MessageThread) => {
      setSelectedThread(thread)
      setSearchParams({ thread: thread.id })
    },
    [setSearchParams]
  )

  const createAndSelectThread = useCallback(
    async ({
      vendorId,
      customerId,
      listingId,
      bookingId,
      type = 'inquiry'
    }: {
      vendorId: string
      customerId: string
      listingId?: string
      bookingId?: string
      type?: 'inquiry' | 'booking'
    }) => {
      try {
        const thread = await createThread.mutateAsync({
          vendorId,
          customerId,
          listingId,
          bookingId,
          type
        })

        setSelectedThread(thread as MessageThread)
        setSearchParams({ thread: thread.id })

        return thread
      } catch (error) {
        console.error('Failed to create thread:', error)
        throw error
      }
    },
    [createThread, setSearchParams]
  )

  const closeThread = useCallback(() => {
    setSelectedThread(null)
    setSearchParams({})
  }, [setSearchParams])

  const navigateToMessages = useCallback(
    (threadId?: string) => {
      const url = threadId ? `/messages?thread=${threadId}` : '/messages'
      navigate(url)
    },
    [navigate]
  )

  return {
    currentThreadId,
    selectedThread,
    selectThread,
    createAndSelectThread,
    closeThread,
    navigateToMessages,
    isCreatingThread: createThread.isPending
  }
}
