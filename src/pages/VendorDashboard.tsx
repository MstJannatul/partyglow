import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CalendarDays,
  ClipboardList,
  Clock,
  DollarSign,
  Plus,
  Star,
  TrendingUp,
  Users
} from 'lucide-react'

import { BookingList } from '@/components/booking/BookingList'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardMetricCard } from '@/components/dashboard/DashboardMetricCard'
import { CreateListingModal } from '@/components/listings/CreateListingModal'
import { ListingsManagement } from '@/components/listings/ListingsManagement'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import { VendorCalendarTab } from '@/components/vendor/VendorCalendarTab'
import { useAuth } from '@/contexts/AuthContext'
import { useBookings } from '@/hooks/useBookings'
import { getVendorContactName } from '@/lib/vendorUtils'
import { analyticsService } from '@/services/analyticsService'
import { useQuery } from '@tanstack/react-query'

export default function VendorDashboard() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

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

  const { data: allBookings = [] } = useBookings('vendor')

  const { data: businessMetrics } = useQuery({
    queryKey: ['vendor-business-metrics', user.id],
    queryFn: () => analyticsService.getVendorBusinessMetrics(user.id),
    enabled: !!user
  })

  // Filter out completed/cancelled from main view
  const bookings = allBookings.filter(
    (booking) => !['completed', 'cancelled'].includes(booking.status)
  )

  const pendingBookings = bookings.filter(
    (booking) => booking.status === 'requested'
  )
  const upcomingBookings = bookings.filter(
    (booking) =>
      new Date(booking.start_date) > new Date() &&
      booking.status === 'confirmed'
  )
  const completedBookings = allBookings.filter(
    (booking) => booking.status === 'completed'
  )

  const recentBookings = bookings
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'requests', label: 'New requests', icon: ClipboardList },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'listings', label: 'Listings', icon: Plus },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ]

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={tabs}
    >
      <TabsContent value="overview" className="space-y-6">
        <div className="glass-card flex flex-col items-start justify-between gap-4 rounded-xl p-4 md:flex-row md:items-center">
          <div>
            <p className="font-medium">
              New to PartyGo? Create your first listing and start receiving
              requests.
            </p>
            <p className="text-sm text-muted-foreground">
              You can also review how messaging and bookings work.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="gradient"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create listing
            </Button>
            <Button variant="outline" onClick={() => navigate('/how-it-works')}>
              How it works
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardMetricCard
            title="Total Revenue"
            value={`$${businessMetrics?.totalRevenue?.toFixed(2) || '0.00'}`}
            subtitle="All time earnings"
            icon={DollarSign}
            color="success"
          />
          <DashboardMetricCard
            title="This Month"
            value={businessMetrics?.bookingsThisMonth || 0}
            subtitle="New bookings"
            icon={Calendar}
            color="primary"
          />
          <DashboardMetricCard
            title="Average Rating"
            value={businessMetrics?.averageRating?.toFixed(1) || '0.0'}
            subtitle="Customer satisfaction"
            icon={Star}
            color="warning"
          />
          <DashboardMetricCard
            title="Repeat Rate"
            value={`${businessMetrics?.repeatCustomerRate?.toFixed(1) || '0.0'}%`}
            subtitle="Customer retention"
            icon={Users}
            color="secondary"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="size-5" />
                Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingBookings.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No pending requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingBookings.slice(0, 3).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <h4 className="font-medium">
                          {booking.listing?.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {getVendorContactName(booking.customer)} •{' '}
                          {new Date(booking.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingBookings.length > 3 && (
                    <Button
                      variant="ghost"
                      onClick={() => setActiveTab('requests')}
                    >
                      View all requests
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

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
                  <p className="text-muted-foreground">No upcoming events</p>
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
                          {getVendorContactName(booking.customer)} •{' '}
                          {new Date(booking.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">${booking.total_price}</Badge>
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
        </div>
      </TabsContent>

      <TabsContent value="bookings" className="space-y-6">
        <BookingList userType="vendor" />
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardMetricCard
            title="Total Customers"
            value={businessMetrics?.customerRetention?.totalCustomers || 0}
            subtitle="All time"
            icon={Users}
          />
          <DashboardMetricCard
            title="Repeat Customers"
            value={businessMetrics?.customerRetention?.repeatCustomers || 0}
            subtitle="Loyal clients"
            icon={Star}
          />
          <DashboardMetricCard
            title="Average CLV"
            value={`$${businessMetrics?.customerRetention?.averageLifetimeValue?.toFixed(2) || '0.00'}`}
            subtitle="Customer lifetime value"
            icon={DollarSign}
          />
          <DashboardMetricCard
            title="Completed Events"
            value={completedBookings.length}
            subtitle="Successful bookings"
            icon={Calendar}
          />
        </div>

        {businessMetrics?.monthlyBookings &&
          businessMetrics.monthlyBookings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {businessMetrics.monthlyBookings.slice(-6).map((month) => (
                    <div
                      key={month.month}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <h4 className="font-medium">
                          {new Date(month.month + '-01').toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'long'
                            }
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {month.bookings} bookings • {month.uniqueCustomers}{' '}
                          customers
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${month.revenue.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
      </TabsContent>

      <TabsContent value="requests" className="space-y-6">
        <BookingList
          userType="vendor"
          filters={{ status: 'requested' }}
          showArchiveButton={false}
        />
      </TabsContent>

      <TabsContent value="calendar" className="space-y-6">
        <VendorCalendarTab />
      </TabsContent>

      <TabsContent value="listings" className="space-y-6">
        <ListingsManagement />
      </TabsContent>

      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccessNavigate={() => {
          setActiveTab('listings')
          setIsCreateModalOpen(false)
        }}
      />
    </DashboardLayout>
  )
}
