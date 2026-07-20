import React, { useState } from 'react'
import { format, isSameDay } from 'date-fns'
import { CalendarDays, Clock, Settings } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/contexts/AuthContext'
import { useBookings } from '@/hooks/useBookings'

import { VendorAvailabilityManager } from './VendorAvailabilityManager'

type ViewMode = 'calendar' | 'availability'

export function VendorCalendarTab() {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const { data: bookings = [] } = useBookings('vendor')

  // Get bookings for selected date
  const selectedDateBookings = selectedDate
    ? bookings.filter((booking) =>
        isSameDay(new Date(booking.start_date), selectedDate)
      )
    : []

  // Get booking dates for calendar indicators
  const bookingDates = bookings.map((booking) => new Date(booking.start_date))

  return (
    <div className="space-y-6">
      {/* Radio Pills Navigation */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center rounded-lg bg-muted p-1">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className="relative rounded-md px-4 py-2"
          >
            <CalendarDays className="mr-2 size-4" />
            Calendar
          </Button>
          <Button
            variant={viewMode === 'availability' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('availability')}
            className="relative rounded-md px-4 py-2"
          >
            <Settings className="mr-2 size-4" />
            Availability
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-5" />
                Schedule Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  booked: bookingDates
                }}
                modifiersStyles={{
                  booked: {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    borderRadius: '6px'
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* Daily Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5" />
                {selectedDate
                  ? format(selectedDate, 'MMMM d, yyyy')
                  : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateBookings.length === 0 ? (
                <div className="py-8 text-center">
                  <Clock className="mx-auto mb-4 size-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No events yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateBookings.map((booking) => (
                    <div key={booking.id} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="font-medium">
                          {booking.listing?.title}
                        </h4>
                        <Badge
                          variant={
                            booking.status === 'confirmed'
                              ? 'default'
                              : booking.status === 'completed'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="mb-1 text-sm text-muted-foreground">
                        {booking.customer?.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.start_date), 'h:mm a')} -
                        {format(new Date(booking.end_date), 'h:mm a')}
                      </p>
                      <p className="text-sm font-medium text-primary">
                        ${booking.total_price}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Availability View */}
      {viewMode === 'availability' && <VendorAvailabilityManager />}
    </div>
  )
}
