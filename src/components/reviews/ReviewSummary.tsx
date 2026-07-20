import { Award, Star, TrendingUp, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useReviewStats } from '@/hooks/useReviews'

interface ReviewSummaryProps {
  vendorId: string
  showDetailed?: boolean
}

export function ReviewSummary({
  vendorId,
  showDetailed = true
}: ReviewSummaryProps) {
  const { data: stats, isLoading } = useReviewStats(vendorId)

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="py-6">
          <div className="space-y-3">
            <div className="h-6 w-32 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-8 w-full rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Star className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No Reviews Yet</h3>
          <p className="text-muted-foreground">
            This vendor hasn't received any reviews yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`size-5 ${i < Math.floor(rating) ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
      />
    ))
  }

  const getRecommendationRate = () => {
    // Calculate recommendation rate based on 4+ star reviews
    const goodReviews =
      (stats.ratingDistribution[4] || 0) + (stats.ratingDistribution[5] || 0)
    return Math.round((goodReviews / stats.totalReviews) * 100)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="text-warning size-5" />
          Customer Reviews
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{stats.averageRating}</span>
              <div className="flex">{renderStars(stats.averageRating)}</div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="size-4" />
                {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
              </span>
              <span>{getRecommendationRate()}% recommend</span>
            </div>
          </div>

          <div className="text-right">
            <Badge variant="secondary" className="mb-2">
              <Award className="mr-1 size-3" />
              {stats.averageRating >= 4.5
                ? 'Excellent'
                : stats.averageRating >= 4.0
                  ? 'Very Good'
                  : stats.averageRating >= 3.5
                    ? 'Good'
                    : stats.averageRating >= 3.0
                      ? 'Average'
                      : 'Below Average'}
            </Badge>
            {stats.recentReviews > 0 && (
              <div className="text-success flex items-center gap-1 text-sm">
                <TrendingUp className="size-3" />
                {stats.recentReviews} recent
              </div>
            )}
          </div>
        </div>

        {/* Detailed Breakdown */}
        {showDetailed && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Rating Distribution</h4>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count =
                stats.ratingDistribution[
                  rating as keyof typeof stats.ratingDistribution
                ] || 0
              const percentage =
                stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0

              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex w-16 items-center gap-1">
                    <span className="text-sm">{rating}</span>
                    <Star className="fill-warning text-warning size-3" />
                  </div>
                  <Progress value={percentage} className="h-2 flex-1" />
                  <span className="w-8 text-right text-sm text-muted-foreground">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 border-t pt-4">
          <div className="text-center">
            <div className="text-xl font-semibold text-primary">
              {getRecommendationRate()}%
            </div>
            <div className="text-xs text-muted-foreground">Recommend</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold text-primary">
              {stats.recentReviews}
            </div>
            <div className="text-xs text-muted-foreground">Recent</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold text-primary">
              {stats.totalReviews}
            </div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
