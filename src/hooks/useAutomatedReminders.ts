import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface ReminderConfig {
  id: string
  booking_id: string
  reminder_type:
    | 'payment_deadline'
    | 'vendor_response'
    | 'event_preparation'
    | 'review_request'
  scheduled_for: string
  message_template: string
  is_sent: boolean
  created_at: string
}

export const useAutomatedReminders = (bookingId?: string) => {
  return useQuery({
    queryKey: ['automated-reminders', bookingId],
    queryFn: async () => {
      if (!bookingId) return []

      // TODO: Create automated_reminders table in database
      console.log(
        'Automated reminders not yet implemented - requires database table'
      )
      return []
    },
    enabled: !!bookingId
  })
}

export const useCreateAutomatedReminders = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      bookingId,
      bookingStartDate
    }: {
      bookingId: string
      bookingStartDate: string
    }) => {
      const startDate = new Date(bookingStartDate)
      const now = new Date()

      // Define reminder schedules relative to booking start date
      const reminders = [
        {
          booking_id: bookingId,
          reminder_type: 'payment_deadline',
          scheduled_for: new Date(
            now.getTime() + 24 * 60 * 60 * 1000
          ).toISOString(), // 24 hours from now
          message_template:
            'Reminder: Payment for your booking is due within 24 hours to secure your reservation.'
        },
        {
          booking_id: bookingId,
          reminder_type: 'vendor_response',
          scheduled_for: new Date(
            now.getTime() + 48 * 60 * 60 * 1000
          ).toISOString(), // 48 hours from now
          message_template:
            "Follow-up: We're still waiting for vendor confirmation. We'll reach out to ensure a quick response."
        },
        {
          booking_id: bookingId,
          reminder_type: 'event_preparation',
          scheduled_for: new Date(
            startDate.getTime() - 24 * 60 * 60 * 1000
          ).toISOString(), // 24 hours before event
          message_template:
            'Your event is tomorrow! Here are the final details and preparation reminders.'
        },
        {
          booking_id: bookingId,
          reminder_type: 'review_request',
          scheduled_for: new Date(
            startDate.getTime() + 24 * 60 * 60 * 1000
          ).toISOString(), // 24 hours after event
          message_template:
            "How was your event? We'd love to hear about your experience and help others find great vendors!"
        }
      ]

      // Only create reminders for future dates
      const validReminders = reminders.filter(
        (reminder) => new Date(reminder.scheduled_for) > now
      )

      if (validReminders.length === 0) {
        return { success: true, created: 0 }
      }

      const { data, error } = await supabase
        .from('automated_reminders')
        .insert(validReminders)
        .select()

      if (error) {
        console.error('Error creating automated reminders:', error)
        throw error
      }

      return { success: true, created: validReminders.length, data }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['automated-reminders'] })

      if (result.created > 0) {
        console.log(`Created ${result.created} automated reminders`)
      }
    },
    onError: (error: any) => {
      console.error('Error creating automated reminders:', error)
      toast({
        title: 'Warning',
        description:
          'Failed to set up automated reminders, but your booking was created successfully.',
        variant: 'destructive'
      })
    }
  })
}

export const useProcessReminders = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      // This would typically be called by a scheduled edge function
      // For now, it's here for manual testing
      const { data, error } =
        await supabase.functions.invoke('process-reminders')

      if (error) {
        console.error('Error processing reminders:', error)
        throw error
      }

      return data
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['automated-reminders'] })

      if (result.processed > 0) {
        toast({
          title: 'Reminders processed',
          description: `${result.processed} reminder(s) were sent.`
        })
      }
    },
    onError: (error: any) => {
      console.error('Error processing reminders:', error)
      toast({
        title: 'Error',
        description: 'Failed to process reminders.',
        variant: 'destructive'
      })
    }
  })
}
