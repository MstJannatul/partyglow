import { useEffect, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Info, MoreVertical, Send } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import {
  useMarkThreadMessagesAsRead,
  useMessages,
  useSendMessage
} from '@/hooks/useMessages'
import {
  MessageThread,
  useArchiveThread,
  useMarkThreadAsRead
} from '@/hooks/useMessageThreads'
import { cn } from '@/lib/utils'

import { MessageActionsDialog } from './MessageActionsDialog'

interface MessageViewProps {
  thread: MessageThread
}

export const MessageView = ({ thread }: MessageViewProps) => {
  const { user } = useAuth()
  const { data: messages = [], isLoading } = useMessages(thread.id)
  const sendMessage = useSendMessage()
  const markThreadAsRead = useMarkThreadAsRead()
  const markThreadMessagesAsRead = useMarkThreadMessagesAsRead()
  const archiveThread = useArchiveThread()
  const [newMessage, setNewMessage] = useState('')
  const [showActions, setShowActions] = useState(false)
  const [showFirstHint, setShowFirstHint] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isVendor = thread.vendor_id === user?.id
  const displayName = isVendor
    ? thread.customer_profile?.full_name || 'Customer'
    : thread.vendor_profile?.full_name || 'Vendor'
  const avatarUrl = isVendor
    ? thread.customer_profile?.avatar_url
    : thread.vendor_profile?.avatar_url
  const initials =
    (displayName || '')
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || (isVendor ? 'C' : 'V')

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark thread as read on open/change
  useEffect(() => {
    if (!thread?.id || !user) return
    markThreadAsRead.mutate(thread.id)
  }, [thread?.id, user, markThreadAsRead])

  // Mark unread messages as read when viewing thread or new messages arrive
  useEffect(() => {
    if (!user || !messages?.length) return
    const hasUnread = messages.some(
      (m) => m.receiver_id === user.id && !m.is_read
    )
    if (hasUnread) {
      markThreadMessagesAsRead.mutate({
        threadId: thread.id,
        receiverId: user.id
      })
    }
  }, [messages, thread.id, user, markThreadMessagesAsRead])

  const firstHintKey = 'msg_first_hint_dismissed'
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const dismissed = localStorage.getItem(firstHintKey) === '1'
        // TODO: will use better approach later other than setTimeout
        if (!dismissed) {
          setTimeout(() => {
            setShowFirstHint(true)
          }, 0)
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  const hasSent = !!user && messages.some((m) => m.sender_id === user.id)
  const shouldShow = showFirstHint && !hasSent

  const handleDismissHint = () => {
    try {
      localStorage.setItem(firstHintKey, '1')
    } catch {
      // Ignore storage errors
    }
    setShowFirstHint(false)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !user) return

    const receiverId = isVendor ? thread.customer_id : thread.vendor_id

    try {
      await sendMessage.mutateAsync({
        threadId: thread.id,
        receiverId,
        content: newMessage.trim(),
        bookingId: thread.booking_id || undefined
      })

      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Thread Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={avatarUrl || ''} alt={`${displayName} avatar`} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div>
            <h2 className="font-semibold">{displayName}</h2>
            {thread.listing?.title && (
              <p className="text-sm text-muted-foreground">
                Listing: {thread.listing.title}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Badge
              variant={thread.type === 'booking' ? 'default' : 'outline'}
              className="text-xs"
            >
              {thread.type === 'booking' ? 'Booking' : 'Inquiry'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => archiveThread.mutate(thread.id)}
            disabled={archiveThread.isPending}
          >
            {archiveThread.isPending ? 'Archiving...' : 'Archive'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowActions(true)}>
                Report conversation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => archiveThread.mutate(thread.id)}>
                Archive thread
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
        {messages.map((message) => {
          const isCurrentUser = message.sender_id === user?.id

          return (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                isCurrentUser ? 'justify-end' : 'justify-start'
              )}
            >
              {!isCurrentUser && (
                <Avatar className="size-8">
                  <AvatarFallback>{isVendor ? 'C' : 'V'}</AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  'max-w-[70%] rounded-lg p-3',
                  isCurrentUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={cn(
                    'text-xs mt-1',
                    isCurrentUser
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  )}
                >
                  {formatDistanceToNow(new Date(message.sent_at), {
                    addSuffix: true
                  })}
                </p>
              </div>

              {isCurrentUser && (
                <Avatar className="size-8">
                  <AvatarFallback>{isVendor ? 'V' : 'C'}</AvatarFallback>
                </Avatar>
              )}
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        className="border-t p-4 pb-[env(safe-area-inset-bottom)] md:pb-4"
      >
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message, then press Send"
            className="min-h-0 flex-1 resize-none"
            rows={1}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sendMessage.isPending}
            size="sm"
          >
            <Send className="size-4" />
          </Button>
        </div>
        {shouldShow && (
          <div className="mt-2 flex items-center justify-between rounded bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="size-3.5 text-muted-foreground" />
              <span>
                Be clear and include dates or details. Vendors usually reply
                within a day.
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismissHint}>
              Got it
            </Button>
          </div>
        )}
      </form>

      <MessageActionsDialog
        open={showActions}
        onOpenChange={setShowActions}
        threadId={thread.id}
      />
    </div>
  )
}
