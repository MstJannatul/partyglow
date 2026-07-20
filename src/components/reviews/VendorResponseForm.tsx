import { useState } from 'react'
import { Loader2, MessageSquare } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useVendorResponse } from '@/hooks/useReviews'

interface VendorResponseFormProps {
  reviewId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function VendorResponseForm({
  reviewId,
  onSuccess,
  onCancel
}: VendorResponseFormProps) {
  const [responseText, setResponseText] = useState('')
  const vendorResponse = useVendorResponse()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!responseText.trim()) return

    try {
      await vendorResponse.mutateAsync({
        reviewId,
        responseText: responseText.trim()
      })

      setResponseText('')
      onSuccess?.()
    } catch (error) {
      console.error('Response submission error:', error)
    }
  }

  const suggestionTemplates = [
    "Thank you for your wonderful review! It was a pleasure working with you and I'm so glad we could make your celebration special.",
    'Thank you for the feedback. I appreciate you taking the time to share your experience with us.',
    "I'm thrilled that you enjoyed our service! Your satisfaction is our top priority and it means the world to us."
  ]

  const insertTemplate = (template: string) => {
    setResponseText(template)
  }

  return (
    <Card className="w-full border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="size-5 text-primary" />
          Respond to Review
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="response" className="text-base font-medium">
              Your Response
            </Label>
            <Textarea
              id="response"
              placeholder="Thank your customer for their feedback and share your thoughts..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="min-h-[100px]"
              required
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {responseText.length}/500 characters
              </p>
            </div>
          </div>

          {/* Quick Templates */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Quick Templates:
            </Label>
            <div className="space-y-1">
              {suggestionTemplates.map((template, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto justify-start whitespace-normal p-2 text-left text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => insertTemplate(template)}
                >
                  "{template}"
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={!responseText.trim() || vendorResponse.isPending}
              className="flex-1"
            >
              {vendorResponse.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Post Response
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={vendorResponse.isPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
