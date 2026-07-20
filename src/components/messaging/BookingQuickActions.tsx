import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  MessageSquare,
  XCircle
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useUpdateBookingStatus } from '@/hooks/useBookings'
import { useSendMessage } from '@/hooks/useMessages'

interface BookingQuickActionsProps {
  bookingId: string
  threadId: string
  currentStatus: string
  userRole: 'customer' | 'vendor'
  receiverId: string
}

export function BookingQuickActions({
  bookingId,
  threadId,
  currentStatus,
  userRole,
  receiverId
}: BookingQuickActionsProps) {
  const updateStatus = useUpdateBookingStatus()
  const sendMessage = useSendMessage()
  const { toast } = useToast()

  const handleStatusUpdate = async (newStatus: string, message?: string) => {
    try {
      await updateStatus.mutateAsync({
        bookingId,
        status: newStatus as any,
        notes: message
      })

      if (message) {
        await sendMessage.mutateAsync({
          threadId,
          receiverId,
          content: message,
          bookingId
        })
      }

      toast({
        title: 'Status updated',
        description: `Booking status changed to ${newStatus.replace('_', ' ')}`
      })
    } catch (error) {
      console.error('Failed to update status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive'
      })
    }
  }

  const sendQuickMessage = async (message: string) => {
    try {
      await sendMessage.mutateAsync({
        threadId,
        receiverId,
        content: message,
        bookingId
      })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const getAvailableActions = () => {
    const actions = []

    if (userRole === 'vendor') {
      switch (currentStatus) {
        case 'requested':
          actions.push(
            {
              id: 'confirm',
              label: 'Confirm Booking',
              icon: CheckCircle,
              variant: 'gradient' as const,
              action: () =>
                handleStatusUpdate(
                  'confirmed',
                  "Great! I've confirmed your booking. Looking forward to your event! 🎉"
                )
            },
            {
              id: 'decline',
              label: 'Decline',
              icon: XCircle,
              variant: 'destructive' as const,
              action: () =>
                handleStatusUpdate(
                  'cancelled',
                  "Sorry, I'm not available for this booking. Please check other vendors or different dates."
                )
            }
          )
          break
        case 'confirmed':
          actions.push({
            id: 'start',
            label: 'Start Event',
            icon: Calendar,
            variant: 'gradient' as const,
            action: () =>
              handleStatusUpdate(
                'in_progress',
                "Event has started! Hope you're having a great time! 🎊"
              )
          })
          break
        case 'in_progress':
          actions.push({
            id: 'complete',
            label: 'Mark Complete',
            icon: CheckCircle,
            variant: 'gradient' as const,
            action: () =>
              handleStatusUpdate(
                'completed',
                'Event completed successfully! Thank you for choosing our services. Please leave a review! ⭐'
              )
          })
          break
      }
    }

    if (userRole === 'customer') {
      switch (currentStatus) {
        case 'requested':
          actions.push({
            id: 'payment_sent',
            label: 'Payment Sent',
            icon: DollarSign,
            variant: 'outline' as const,
            action: () =>
              sendQuickMessage(
                "Hi! I've sent the payment. Please confirm when you receive it. Thank you!"
              )
          })
          break
        case 'confirmed':
          actions.push({
            id: 'event_details',
            label: 'Discuss Details',
            icon: MessageSquare,
            variant: 'outline' as const,
            action: () =>
              sendQuickMessage(
                'Hi! I wanted to discuss some details about the upcoming event. When would be a good time to chat?'
              )
          })
          break
        case 'completed':
          actions.push({
            id: 'review_reminder',
            label: 'Leave Review',
            icon: CheckCircle,
            variant: 'gradient' as const,
            action: () => window.open('#', '_blank') // TODO: Link to review form
          })
          break
      }
    }

    // Common actions for both roles
    actions.push(
      {
        id: 'reschedule',
        label: 'Request Reschedule',
        icon: Calendar,
        variant: 'outline' as const,
        action: () =>
          sendQuickMessage(
            'Hi! I need to discuss rescheduling this event. Could we chat about available dates?'
          )
      },
      {
        id: 'issue',
        label: 'Report Issue',
        icon: AlertTriangle,
        variant: 'outline' as const,
        action: () =>
          sendQuickMessage(
            'Hi! I wanted to discuss an issue regarding this booking. Could you please help?'
          )
      }
    )

    return actions
  }

  const actions = getAvailableActions()

  if (actions.length === 0) return null

  return (
    <Card className="p-3">
      <div className="mb-3 flex items-center gap-2">
        <Calendar className="size-4 text-primary" />
        <span className="text-sm font-medium">Quick Actions</span>
        <Badge variant="outline" className="text-xs">
          {currentStatus.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {actions.slice(0, 4).map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.id}
              variant={action.variant}
              size="sm"
              onClick={action.action}
              disabled={updateStatus.isPending || sendMessage.isPending}
              className="flex h-auto flex-col items-center gap-1 px-3 py-2"
            >
              <Icon className="size-4" />
              <span className="text-center text-xs leading-tight">
                {action.label}
              </span>
            </Button>
          )
        })}
      </div>

      {actions.length > 4 && (
        <div className="mt-2 grid grid-cols-1 gap-1">
          {actions.slice(4).map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.id}
                variant={action.variant}
                size="sm"
                onClick={action.action}
                disabled={updateStatus.isPending || sendMessage.isPending}
                className="justify-start"
              >
                <Icon className="mr-2 size-3" />
                {action.label}
              </Button>
            )
          })}
        </div>
      )}
    </Card>
  )
}
