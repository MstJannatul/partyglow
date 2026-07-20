import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  Calendar,
  Camera,
  MessageSquare,
  Star,
  ThumbsDown,
  ThumbsUp,
  User
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useReviewVote } from '@/hooks/useReviews'

import { VendorResponseForm } from './VendorResponseForm'

interface ReviewCardProps {
  review: {
    id: string
    reviewer_id: string
    reviewed_user_id: string
    rating: number
    comment: string
    media_urls?: string[] | null
    created_at: string
    response_text?: string | null
    response_date?: string | null
    helpfulness_score?: number | null
    booking_id: string
  }
  reviewer?: {
    full_name?: string
    avatar_url?: string
  }
  showVendorActions?: boolean
}

export function ReviewCard({
  review,
  reviewer,
  showVendorActions = false
}: ReviewCardProps) {
  const { user } = useAuth()
  const [showResponseForm, setShowResponseForm] = useState(false)
  const reviewVote = useReviewVote()

  const handleVote = (isHelpful: boolean) => {
    reviewVote.mutate({
      reviewId: review.id,
      isHelpful
    })
  }

  const isVendor = user?.id === review.reviewed_user_id
  const canRespond = isVendor && !review.response_text

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`size-4 ${i < rating ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
      />
    ))
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar className="size-10 flex-shrink-0">
              <AvatarImage src={reviewer?.avatar_url} />
              <AvatarFallback>
                <User className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                <p className="truncate font-medium">
                  {reviewer?.full_name || 'Anonymous'}
                </p>
                <Badge variant="secondary" className="w-fit text-xs">
                  Verified
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex">{renderStars(review.rating)}</div>
                <span className="text-sm text-muted-foreground">
                  {review.rating}/5
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1 text-xs text-muted-foreground sm:text-sm">
            <Calendar className="size-3 sm:size-4" />
            <span className="hidden sm:inline">
              {formatDistanceToNow(new Date(review.created_at), {
                addSuffix: true
              })}
            </span>
            <span className="sm:hidden">
              {formatDistanceToNow(new Date(review.created_at), {
                addSuffix: true
              }).replace('about ', '')}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Review Comment */}
        <p className="leading-relaxed text-foreground">{review.comment}</p>

        {/* Media Gallery */}
        {review.media_urls && review.media_urls.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Camera className="size-4" />
              <span>
                {review.media_urls.length} photo
                {review.media_urls.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid max-w-full grid-cols-2 gap-2 sm:grid-cols-3">
              {review.media_urls.slice(0, 6).map((url, index) => (
                <div
                  key={index}
                  className="aspect-square max-w-[120px] overflow-hidden rounded-lg sm:max-w-none"
                >
                  <img
                    src={url}
                    alt={`Review photo ${index + 1}`}
                    className="size-full cursor-pointer object-cover transition-transform duration-200 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vendor Response */}
        {review.response_text && (
          <div className="rounded-lg border-l-4 border-primary bg-muted/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              <span className="font-medium text-primary">Vendor Response</span>
              {review.response_date && (
                <span className="text-sm text-muted-foreground">
                  •{' '}
                  {formatDistanceToNow(new Date(review.response_date), {
                    addSuffix: true
                  })}
                </span>
              )}
            </div>
            <p className="text-foreground">{review.response_text}</p>
          </div>
        )}

        {/* Vendor Response Form */}
        {showResponseForm && (
          <VendorResponseForm
            reviewId={review.id}
            onCancel={() => setShowResponseForm(false)}
            onSuccess={() => setShowResponseForm(false)}
          />
        )}

        {/* Action Buttons */}
        <div className="flex flex-col justify-between gap-3 border-t pt-2 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(true)}
              className="hover:text-success px-2 text-xs text-muted-foreground sm:px-3 sm:text-sm"
            >
              <ThumbsUp className="mr-1 size-3 sm:size-4" />
              <span className="hidden sm:inline">Helpful</span>
              <span className="sm:hidden">👍</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(false)}
              className="px-2 text-xs text-muted-foreground hover:text-destructive sm:px-3 sm:text-sm"
            >
              <ThumbsDown className="mr-1 size-3 sm:size-4" />
              <span className="hidden sm:inline">Not helpful</span>
              <span className="sm:hidden">👎</span>
            </Button>
            {review.helpfulness_score && review.helpfulness_score > 0 && (
              <span className="text-xs text-muted-foreground sm:text-sm">
                {review.helpfulness_score} helpful
              </span>
            )}
          </div>

          {showVendorActions && canRespond && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResponseForm(true)}
              className="w-full text-xs sm:w-auto sm:text-sm"
            >
              <MessageSquare className="mr-1 size-3 sm:size-4" />
              Respond
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
