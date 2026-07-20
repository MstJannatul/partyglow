import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  DollarSign,
  Heart,
  MapPin,
  Star,
  TrendingUp,
  User
} from 'lucide-react'

import { BookingList } from '@/components/booking/BookingList'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardMetricCard } from '@/components/dashboard/DashboardMetricCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TabsContent } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { getBookingStatusInfo } from '@/hooks/useBookingActions'
import { useBookings } from '@/hooks/useBookings'
import { useFavoriteListings } from '@/hooks/useFavorites'
import { analyticsService } from '@/services/analyticsService'
import { useQuery } from '@tanstack/react-query'

export default function CustomerDashboard() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (location.hash === '#favorites') {
      setActiveTab('favorites')
    }
  }, [location.hash])

  // Show loading state while auth resolves
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // ProtectedRoute already handles auth/role redirects, no need for duplicate logic here

  const { data: bookings = [], isLoading: bookingsLoading } =
    useBookings('customer')
  const { data: favoriteListings = [], isLoading: favoritesLoading } =
    useFavoriteListings()

  const { data: spendingInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['customer-spending', user.id],
    queryFn: () => analyticsService.getCustomerSpendingInsights(user.id),
    enabled: !!user,
    retry: 1,
    staleTime: 10 * 60 * 1000 // 10 minutes
  })

  const { data: recommendedVendors = [], isLoading: vendorsLoading } = useQuery(
    {
      queryKey: ['recommended-vendors', user.id],
      queryFn: () => analyticsService.getRecommendedVendors(user.id),
      enabled: !!user,
      retry: 1,
      staleTime: 10 * 60 * 1000 // 10 minutes
    }
  )

  // Filter out completed/cancelled from main view
  const activeBookings = bookings.filter(
    (booking) => !['completed', 'cancelled'].includes(booking.status)
  )

  const ACTIVE_STATUSES = [
    'confirmed',
    'in_progress',
    'awaiting_pickup',
    'out_for_delivery',
    'item_delivered',
    'item_in_use',
    'awaiting_return'
  ]
  const upcomingBookings = bookings.filter(
    (booking) =>
      new Date(booking.start_date) > new Date() &&
      ACTIVE_STATUSES.includes(booking.status)
  )

  const pastBookings = bookings.filter(
    (booking) => booking.status === 'completed'
  )

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Calendar },
    { id: 'bookings', label: 'My Events', icon: Calendar },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'insights', label: 'Insights', icon: TrendingUp }
  ]

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={tabs}
    >
      <TabsContent value="overview" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardMetricCard
            title="Upcoming Events"
            value={upcomingBookings.length}
            subtitle="Active bookings"
            icon={Calendar}
            color="primary"
          />
          <DashboardMetricCard
            title="Total Spent"
            value={`$${spendingInsights?.totalSpent?.toFixed(2) || '0.00'}`}
            subtitle="All time"
            icon={DollarSign}
            color="success"
          />
          <DashboardMetricCard
            title="Favorite Vendors"
            value={favoriteListings.length}
            subtitle="Saved for later"
            icon={Heart}
            color="secondary"
          />
          <DashboardMetricCard
            title="Past Celebrations"
            value={pastBookings.length}
            subtitle="Completed events"
            icon={Star}
            color="warning"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="mb-4 text-muted-foreground">
                    No upcoming events
                  </p>
                  <Button onClick={() => navigate('/browse')}>
                    Browse Vendors
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.slice(0, 3).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <h4 className="font-medium">
                          {booking.listing?.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {getBookingStatusInfo(booking.status).label}
                      </Badge>
                    </div>
                  ))}
                  {upcomingBookings.length > 3 && (
                    <Button
                      variant="ghost"
                      onClick={() => setActiveTab('bookings')}
                    >
                      View all events
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Recommended Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendedVendors.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="mb-4 text-muted-foreground">
                    Book your first event to get personalized recommendations
                  </p>
                  <Button onClick={() => navigate('/browse')}>
                    Explore Vendors
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendedVendors.slice(0, 3).map((vendor) => (
                    <div
                      key={vendor.vendorId}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <h4 className="font-medium">{vendor.fullName}</h4>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="size-3 fill-current" />
                          {vendor.vendorRating.toFixed(1)}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="bookings" className="space-y-6">
        <BookingList userType="customer" />
      </TabsContent>

      <TabsContent value="favorites" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Favorite Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            {favoritesLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <Skeleton className="mb-2 h-4 w-3/4" />
                    <Skeleton className="mb-2 h-3 w-1/2" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : favoriteListings.length === 0 ? (
              <div className="py-8 text-center">
                <Heart className="mx-auto mb-4 size-12 text-muted-foreground" />
                <p className="mb-4 text-muted-foreground">No favorites yet</p>
                <Button onClick={() => navigate('/browse')}>
                  Discover Vendors
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {favoriteListings.map((favorite) => (
                  <div key={favorite.id} className="rounded-lg border p-4">
                    <h3 className="mb-2 font-semibold">
                      {favorite.listings.title}
                    </h3>
                    <p className="mb-2 text-sm text-muted-foreground">
                      {favorite.listings.location}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        ${favorite.listings.price}
                      </span>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="insights" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <DashboardMetricCard
            title="Average Booking"
            value={`$${spendingInsights?.averageBookingValue?.toFixed(2) || '0.00'}`}
            subtitle="Per event"
            icon={DollarSign}
          />
          <DashboardMetricCard
            title="Total Events"
            value={spendingInsights?.totalBookings || 0}
            subtitle="All time"
            icon={Calendar}
          />
          <DashboardMetricCard
            title="Preferred Categories"
            value={spendingInsights?.preferredCategories?.length || 0}
            subtitle="Top categories"
            icon={Star}
          />
        </div>

        {spendingInsights?.preferredCategories &&
          spendingInsights.preferredCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Party Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {spendingInsights.preferredCategories.map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
      </TabsContent>
    </DashboardLayout>
  )
}
