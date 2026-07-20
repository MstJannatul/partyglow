import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface MessageActionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  threadId: string
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or unwanted messages' },
  { id: 'harassment', label: 'Harassment or abusive behavior' },
  { id: 'inappropriate', label: 'Inappropriate content' },
  { id: 'scam', label: 'Scam or fraud attempt' },
  { id: 'other', label: 'Other' }
]

export const MessageActionsDialog = ({
  open,
  onOpenChange,
  threadId
}: MessageActionsDialogProps) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitReport = async () => {
    if (!reason || !user) return

    setIsSubmitting(true)

    try {
      // Get thread details to identify the other user
      const { data: thread } = await supabase
        .from('message_threads')
        .select('vendor_id, customer_id')
        .eq('id', threadId)
        .single()

      if (!thread) throw new Error('Thread not found')

      const reportedUserId =
        thread.vendor_id === user.id ? thread.customer_id : thread.vendor_id

      const { error } = await supabase.from('conversation_disputes').insert({
        thread_id: threadId,
        created_by: user.id,
        dispute_type: reason,
        description: description || null,
        status: 'open',
        priority: 'medium'
      })

      if (error) throw error

      toast({
        title: 'Report submitted',
        description:
          'Thank you for reporting this conversation. Our team will review it.'
      })

      onOpenChange(false)
      setReason('')
      setDescription('')
    } catch (error: any) {
      toast({
        title: 'Failed to submit report',
        description: error.message || 'Please try again later.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">
              Why are you reporting this conversation?
            </Label>
            <RadioGroup
              value={reason}
              onValueChange={setReason}
              className="mt-2"
            >
              {REPORT_REASONS.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={item.id} id={item.id} />
                  <Label htmlFor={item.id} className="text-sm">
                    {item.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Additional details (optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context about the issue..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReport}
              disabled={!reason || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
