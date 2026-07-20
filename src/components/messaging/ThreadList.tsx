import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { MessageThread } from '@/hooks/useMessageThreads'
import { cn } from '@/lib/utils'

interface ThreadListProps {
  threads: MessageThread[]
  onThreadSelect: (thread: MessageThread) => void
  selectedThreadId?: string
}

export const ThreadList = ({
  threads,
  onThreadSelect,
  selectedThreadId
}: ThreadListProps) => {
  const { user } = useAuth()

  if (threads.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          When someone messages you, the conversation will appear here.
        </p>
        <div className="mt-4">
          <Button asChild size="sm">
            <Link to="/browse">Find vendors</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto">
      {threads.map((thread) => {
        const isVendor = thread.vendor_id === user?.id
        const unreadCount = isVendor
          ? thread.unread_count_vendor
          : thread.unread_count_customer
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

        return (
          <div
            key={thread.id}
            className={cn(
              'p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors',
              selectedThreadId === thread.id && 'bg-muted'
            )}
            onClick={() => onThreadSelect(thread)}
          >
            <div className="flex items-start gap-3">
              <Avatar className="size-10">
                <AvatarImage
                  src={avatarUrl || ''}
                  alt={`${displayName} avatar`}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <h4 className="truncate font-medium">{displayName}</h4>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="h-5 min-w-5 text-xs"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(thread.last_updated), {
                        addSuffix: true
                      })}
                    </span>
                  </div>
                </div>

                {thread.listing?.title && (
                  <p className="mb-1 text-sm text-muted-foreground">
                    Listing: {thread.listing.title}
                  </p>
                )}

                {thread.last_message && (
                  <p className="truncate text-sm text-muted-foreground">
                    {thread.last_message}
                  </p>
                )}

                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    variant={thread.type === 'booking' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {thread.type === 'booking' ? 'Booking' : 'Inquiry'}
                  </Badge>

                  {thread.status === 'archived' && (
                    <Badge variant="secondary" className="text-xs">
                      Archived
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
