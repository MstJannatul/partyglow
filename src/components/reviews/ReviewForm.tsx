import { useState } from 'react'
import { Loader2, Star, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useCreateReview } from '@/hooks/useReviews'
import { supabase } from '@/integrations/supabase/client'

interface ReviewFormProps {
  bookingId: string
  vendorId: string
  listingId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ReviewForm({
  bookingId,
  vendorId,
  listingId,
  onSuccess,
  onCancel
}: ReviewFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const createReview = useCreateReview()

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(
      (file) => file.type.startsWith('image/') && file.size <= 8 * 1024 * 1024 // 8MB limit
    )

    if (validFiles.length !== files.length) {
      toast({
        title: 'Some files were rejected',
        description: 'Only images under 8MB are allowed.',
        variant: 'destructive'
      })
    }

    setPhotos((prev) => [...prev, ...validFiles].slice(0, 6)) // Max 6 photos
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadPhotos = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${file.name.split('.').pop()}`
      const { data, error } = await supabase.storage
        .from('review-media')
        .upload(fileName, file)

      if (error) {
        console.error('Photo upload error:', error)
        throw new Error(`Failed to upload ${file.name}: ${error.message}`)
      }

      const { data: urlData } = supabase.storage
        .from('review-media')
        .getPublicUrl(data.path)

      return urlData.publicUrl
    })

    return Promise.all(uploadPromises)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to submit a review.',
        variant: 'destructive'
      })
      return
    }

    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a star rating.',
        variant: 'destructive'
      })
      return
    }

    if (!comment.trim()) {
      toast({
        title: 'Comment required',
        description: 'Please write a review comment.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsUploading(true)

      let mediaUrls: string[] = []

      // Try to upload photos if any exist
      if (photos.length > 0) {
        try {
          mediaUrls = await uploadPhotos(photos)
          toast({
            title: 'Photos uploaded successfully',
            description: `${photos.length} photo(s) uploaded with your review.`
          })
        } catch (uploadError) {
          console.error('Photo upload failed:', uploadError)

          // Show user the upload error and let them decide
          // eslint-disable-next-line no-alert
          const confirmSubmit = window.confirm(
            'Photo upload failed. Would you like to submit your review without photos?'
          )

          if (!confirmSubmit) {
            toast({
              title: 'Review submission cancelled',
              description:
                'You can try uploading the photos again or submit without them.',
              variant: 'destructive'
            })
            return
          }

          toast({
            title: 'Submitting review without photos',
            description:
              'Your review will be submitted without the uploaded photos.'
          })
        }
      }

      // Submit the review
      await createReview.mutateAsync({
        reviewer_id: user.id,
        reviewed_user_id: vendorId,
        booking_id: bookingId,
        rating,
        comment: comment.trim(),
        media_urls: mediaUrls.length > 0 ? mediaUrls : null
      })

      toast({
        title: 'Review submitted successfully!',
        description: 'Thank you for sharing your experience.'
      })

      onSuccess?.()
    } catch (error) {
      console.error('Review submission error:', error)
      toast({
        title: 'Failed to submit review',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1
      return (
        <button
          key={i}
          type="button"
          className="p-1 transition-colors"
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setRating(starValue)}
        >
          <Star
            className={`size-8 ${
              (hoverRating || rating) >= starValue
                ? 'fill-warning text-warning'
                : 'hover:text-warning text-muted-foreground'
            }`}
          />
        </button>
      )
    })
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="text-warning size-5" />
          Share Your Party Experience
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <Label className="text-base font-medium">
              How was your experience? *
            </Label>
            <div className="flex items-center gap-1">
              {renderStars()}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating}/5 stars
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-base font-medium">
              Tell us about your celebration *
            </Label>
            <Textarea
              id="comment"
              placeholder="Share details about the service, quality, communication, and overall experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mobile-input-stable min-h-[120px]"
              autoComplete="off"
              inputMode="text"
              required
            />
            <p className="text-sm text-muted-foreground">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Photo Upload */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Add Photos (Optional)
            </Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="relative"
                  disabled={photos.length >= 6}
                >
                  <Upload className="mr-2 size-4" />
                  {photos.length === 0
                    ? 'Add Photos'
                    : `Add More (${photos.length}/6)`}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    disabled={photos.length >= 6}
                  />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Up to 6 photos, 8MB each
                </span>
              </div>

              {/* Photo Preview */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="group relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Preview ${index + 1}`}
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -right-2 -top-2 size-6 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={
                rating === 0 ||
                !comment.trim() ||
                createReview.isPending ||
                isUploading
              }
              className="flex-1"
            >
              {(createReview.isPending || isUploading) && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {isUploading ? 'Uploading Photos...' : 'Submit Review'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={createReview.isPending || isUploading}
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
