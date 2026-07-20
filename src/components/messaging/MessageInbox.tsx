import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { useMessageThreads } from '@/hooks/useMessageThreads'
import { useThreadNavigation } from '@/hooks/useThreadNavigation'

import { InboxHelpCard } from './InboxHelpCard'
import { MessageView } from './MessageView'
import { ThreadList } from './ThreadList'

export const MessageInbox = () => {
  const { user } = useAuth()
  const { data: threads = [], isLoading } = useMessageThreads()
  const { currentThreadId, selectedThread, selectThread, closeThread } =
    useThreadNavigation()
  const isMobile = useIsMobile()

  // Find current thread from URL params
  useEffect(() => {
    if (currentThreadId && threads.length > 0) {
      const thread = threads.find((t) => t.id === currentThreadId)
      if (thread) {
        selectThread(thread)
      }
    }
  }, [currentThreadId, threads, selectThread])

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view messages</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  // Mobile view - show either thread list or message view
  if (isMobile) {
    if (selectedThread) {
      return (
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b p-4">
            <Button variant="ghost" size="sm" onClick={closeThread}>
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="font-semibold">Messages</h1>
          </div>
          <div className="flex-1">
            <MessageView thread={selectedThread} />
          </div>
        </div>
      )
    }

    return (
      <div className="h-full">
        <div className="border-b p-4">
          <h1 className="text-xl font-semibold">Messages</h1>
        </div>
        <div className="p-4">
          <InboxHelpCard storageKey="inbox_help_dismissed" />
        </div>
        <ThreadList
          threads={threads}
          onThreadSelect={selectThread}
          selectedThreadId={selectedThread?.id}
        />
      </div>
    )
  }

  // Desktop view - dual pane layout
  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r">
        <div className="border-b p-4">
          <h1 className="text-xl font-semibold">Messages</h1>
        </div>
        <div className="p-4">
          <InboxHelpCard storageKey="inbox_help_dismissed" />
        </div>
        <ThreadList
          threads={threads}
          onThreadSelect={selectThread}
          selectedThreadId={selectedThread?.id}
        />
      </div>
      <div className="flex-1">
        {selectedThread ? (
          <MessageView thread={selectedThread} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h3 className="mb-2 text-lg font-medium">
                Select a conversation
              </h3>
              <p className="text-muted-foreground">
                Select a conversation to read and reply.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
