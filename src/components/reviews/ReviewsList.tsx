import { useState } from 'react'
import { Camera, Clock, Filter, Star, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useReviews } from '@/hooks/useReviews'

import { ReviewCard } from './ReviewCard'

interface ReviewsListProps {
  listingId?: string
  vendorId?: string
  showFilters?: boolean
  maxReviews?: number
  showVendorActions?: boolean
}

type FilterOptions = {
  rating: 'all' | '5' | '4' | '3' | '2' | '1'
  timeframe: 'all' | 'week' | 'month' | 'year'
  mediaOnly: boolean
  sortBy: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful'
}

export function ReviewsList({
  listingId,
  vendorId,
  showFilters = true,
  maxReviews,
  showVendorActions = false
}: ReviewsListProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    rating: 'all',
    timeframe: 'all',
    mediaOnly: false,
    sortBy: 'newest'
  })

  const {
    data: reviews = [],
    isLoading,
    error
  } = useReviews(listingId, vendorId)

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter((review) => {
      // Rating filter
      if (
        filters.rating !== 'all' &&
        review.rating !== parseInt(filters.rating)
      ) {
        return false
      }

      // Timeframe filter
      if (filters.timeframe !== 'all') {
        const reviewDate = new Date(review.created_at)
        const now = new Date()
        const timeDiff = now.getTime() - reviewDate.getTime()

        switch (filters.timeframe) {
          case 'week':
            if (timeDiff > 7 * 24 * 60 * 60 * 1000) return false
            break
          case 'month':
            if (timeDiff > 30 * 24 * 60 * 60 * 1000) return false
            break
          case 'year':
            if (timeDiff > 365 * 24 * 60 * 60 * 1000) return false
            break
        }
      }

      // Media only filter
      if (
        filters.mediaOnly &&
        (!review.media_urls || review.media_urls.length === 0)
      ) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        case 'oldest':
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        case 'rating_high':
          return b.rating - a.rating
        case 'rating_low':
          return a.rating - b.rating
        case 'helpful':
          return (b.helpfulness_score || 0) - (a.helpfulness_score || 0)
        default:
          return 0
      }
    })

  const displayedReviews = maxReviews
    ? filteredReviews.slice(0, maxReviews)
    : filteredReviews

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Failed to load reviews. Please try again.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="py-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-muted" />
                  <div className="space-y-1">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-3 w-16 rounded bg-muted" />
                  </div>
                </div>
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-3/4 rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Star className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No Reviews Yet</h3>
          <p className="text-muted-foreground">
            Be the first to share your experience with this vendor!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>

              <Select
                value={filters.rating}
                onValueChange={(value: any) =>
                  setFilters((prev) => ({ ...prev, rating: value }))
                }
              >
                <SelectTrigger className="w-auto">
                  <Star className="mr-1 size-4" />
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.timeframe}
                onValueChange={(value: any) =>
                  setFilters((prev) => ({ ...prev, timeframe: value }))
                }
              >
                <SelectTrigger className="w-auto">
                  <Clock className="mr-1 size-4" />
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="year">Past Year</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={filters.mediaOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    mediaOnly: !prev.mediaOnly
                  }))
                }
              >
                <Camera className="mr-1 size-4" />
                With Photos
              </Button>

              <Select
                value={filters.sortBy}
                onValueChange={(value: any) =>
                  setFilters((prev) => ({ ...prev, sortBy: value }))
                }
              >
                <SelectTrigger className="w-auto">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="rating_high">Highest Rated</SelectItem>
                  <SelectItem value="rating_low">Lowest Rated</SelectItem>
                  <SelectItem value="helpful">Most Helpful</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters Summary */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {displayedReviews.length} of {reviews.length} reviews
              </span>
              {filters.rating !== 'all' && (
                <Badge variant="secondary">{filters.rating} stars</Badge>
              )}
              {filters.timeframe !== 'all' && (
                <Badge variant="secondary">Past {filters.timeframe}</Badge>
              )}
              {filters.mediaOnly && (
                <Badge variant="secondary">With photos</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {displayedReviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            showVendorActions={showVendorActions}
          />
        ))}
      </div>

      {/* Load More */}
      {maxReviews && filteredReviews.length > maxReviews && (
        <div className="text-center">
          <Button variant="outline">
            <Users className="mr-2 size-4" />
            View All {filteredReviews.length} Reviews
          </Button>
        </div>
      )}
    </div>
  )
}
