import { useEffect, useMemo, useState } from 'react'
import { addDays, format } from 'date-fns'
import {
  AlertCircle,
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Loader2,
  Users,
  XCircle
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { getVendorDisplayName } from '@/lib/vendorUtils'
import { AvailabilityService } from '@/services/availabilityService'

interface DateTimeSelectorProps {
  vendorGroups: any[]
  onSelectionChange: (data: any) => void
  selectedDate: Date | null
  selectedTimeSlot: any
}

interface VendorAvailability {
  vendorId: string
  vendor: any
  isAvailable: boolean
  reason?: string
}

interface CustomTimeSlot {
  start: string
  end: string
  duration: number
}

export function DateTimeSelector({
  vendorGroups,
  onSelectionChange,
  selectedDate,
  selectedTimeSlot
}: DateTimeSelectorProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(
    selectedDate
  )
  const [selectedStartTime, setSelectedStartTime] = useState<string>('')
  const [selectedEndTime, setSelectedEndTime] = useState<string>('')
  const [vendorAvailability, setVendorAvailability] = useState<
    VendorAvailability[]
  >([])
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const [timeValidationError, setTimeValidationError] = useState<string | null>(
    null
  )

  // Generate time options (24-hour format)
  const timeOptions = useMemo(() => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        options.push(timeString)
      }
    }
    return options
  }, [])

  // Calculate duration and validate times
  const customTimeSlot = useMemo((): CustomTimeSlot | null => {
    if (!selectedStartTime || !selectedEndTime) return null

    const startHour = parseInt(selectedStartTime.split(':')[0])
    const startMinute = parseInt(selectedStartTime.split(':')[1])
    const endHour = parseInt(selectedEndTime.split(':')[0])
    const endMinute = parseInt(selectedEndTime.split(':')[1])

    const startMinutes = startHour * 60 + startMinute
    let endMinutes = endHour * 60 + endMinute

    // Handle next day
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60
    }

    const durationMinutes = endMinutes - startMinutes
    const durationHours = durationMinutes / 60

    return {
      start: selectedStartTime,
      end: selectedEndTime,
      duration: durationHours
    }
  }, [selectedStartTime, selectedEndTime])

  // Check vendor availability when date and times change
  useEffect(() => {
    if (!internalSelectedDate || !customTimeSlot) {
      setVendorAvailability([])
      setTimeValidationError(null)
      return
    }

    // Validate duration
    if (customTimeSlot.duration < 0.5) {
      setTimeValidationError('Event must be at least 30 minutes long')
      setVendorAvailability([])
      return
    }

    if (customTimeSlot.duration > 24) {
      setTimeValidationError('Event cannot be longer than 24 hours')
      setVendorAvailability([])
      return
    }

    setTimeValidationError(null)
    setIsCheckingAvailability(true)

    const checkVendorAvailability = async () => {
      try {
        const availability: VendorAvailability[] = []

        for (const group of vendorGroups) {
          const [dateStr] = internalSelectedDate.toISOString().split('T')
          const startDateTime = new Date(
            `${dateStr}T${customTimeSlot.start}:00`
          )
          const endDateTime = new Date(`${dateStr}T${customTimeSlot.end}:00`)

          const validation =
            await AvailabilityService.validateBookingAvailability(
              group.vendor.user_id,
              startDateTime,
              endDateTime
            )

          availability.push({
            vendorId: group.vendor.user_id,
            vendor: group.vendor,
            isAvailable: validation.isValid,
            reason: validation.reason
          })
        }

        setVendorAvailability(availability)
      } catch (error) {
        console.error('Failed to check vendor availability:', error)
        setVendorAvailability([])
      } finally {
        setIsCheckingAvailability(false)
      }
    }

    checkVendorAvailability()
  }, [internalSelectedDate, customTimeSlot, vendorGroups])

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    setInternalSelectedDate(date)
    // Reset availability when date changes
    setVendorAvailability([])
  }

  const handleStartTimeChange = (time: string) => {
    setSelectedStartTime(time)
    if (time && selectedEndTime && time >= selectedEndTime) {
      // Auto-adjust end time to 1 hour after start
      const startHour = parseInt(time.split(':')[0])
      const startMinute = parseInt(time.split(':')[1])
      const endHour = (startHour + 1) % 24
      setSelectedEndTime(
        `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`
      )
    }
  }

  const handleEndTimeChange = (time: string) => {
    setSelectedEndTime(time)
  }

  // Update parent when we have valid selection
  useEffect(() => {
    if (internalSelectedDate && customTimeSlot && !timeValidationError) {
      const allAvailable =
        vendorAvailability.length > 0 &&
        vendorAvailability.every((v) => v.isAvailable)

      onSelectionChange({
        selectedDate: internalSelectedDate,
        selectedTimeSlot: {
          start: customTimeSlot.start,
          end: customTimeSlot.end,
          isValid: allAvailable && !isCheckingAvailability,
          vendorAvailability
        }
      })
    } else {
      onSelectionChange({
        selectedDate: internalSelectedDate,
        selectedTimeSlot: null
      })
    }
  }, [
    internalSelectedDate,
    customTimeSlot,
    timeValidationError,
    vendorAvailability,
    isCheckingAvailability,
    onSelectionChange
  ])

  const disabledDates = (date: Date) => {
    // Disable past dates and dates more than 6 months in advance
    const today = new Date()
    const maxDate = addDays(today, 180)
    return date < today || date > maxDate
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-2 text-center">
        <h3 className="text-xl font-semibold text-foreground">
          Pick date & time
        </h3>
        <p className="mx-auto max-w-md text-muted-foreground">
          Pick a date and a start time.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Date Selection */}
        <div className="space-y-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <CalendarIcon className="size-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Date</h4>
              <p className="text-sm text-muted-foreground">Pick a date</p>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <Calendar
              mode="single"
              selected={internalSelectedDate || undefined}
              onSelect={handleDateSelect}
              disabled={disabledDates}
              className="w-full rounded-md"
            />
          </div>
        </div>

        {/* Time Selection */}
        <div className="space-y-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Clock className="size-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Time</h4>
              <p className="text-sm text-muted-foreground">
                Pick a start and end time
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border bg-card p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Start time
                </label>
                <Select
                  value={selectedStartTime}
                  onValueChange={handleStartTimeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  End time
                </label>
                <Select
                  value={selectedEndTime}
                  onValueChange={handleEndTimeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {customTimeSlot && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <span className="text-sm font-medium">Duration:</span>
                <Badge variant="secondary">
                  {customTimeSlot.duration < 1
                    ? `${Math.round(customTimeSlot.duration * 60)} minutes`
                    : `${customTimeSlot.duration.toFixed(1)} hours`}
                </Badge>
              </div>
            )}

            {timeValidationError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                <AlertCircle className="size-4 text-destructive" />
                <span className="text-sm text-destructive">
                  {timeValidationError}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vendor Availability Grid */}
      {internalSelectedDate && customTimeSlot && !timeValidationError && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Availability</h4>
              <p className="text-sm text-muted-foreground">
                Checking availability for{' '}
                {format(internalSelectedDate, 'MMMM d, yyyy')} from{' '}
                {customTimeSlot.start} to {customTimeSlot.end}
              </p>
            </div>
          </div>

          {isCheckingAvailability ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Checking availability...
                </span>
              </div>
              {Array.from({ length: vendorGroups.length }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3">
              {vendorAvailability.map((availability) => (
                <Card
                  key={availability.vendorId}
                  className="transition-all duration-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {availability.isAvailable ? (
                            <div className="rounded-full bg-green-100 p-2">
                              <CheckCircle className="size-4 text-green-600" />
                            </div>
                          ) : (
                            <div className="rounded-full bg-red-100 p-2">
                              <XCircle className="size-4 text-red-600" />
                            </div>
                          )}
                        </div>

                        <div>
                          <h5 className="font-semibold text-foreground">
                            {getVendorDisplayName(availability.vendor)}
                          </h5>
                          <p className="text-sm text-muted-foreground">
                            {availability.isAvailable
                              ? 'Available for your requested time'
                              : getUnavailabilityReason(availability.reason)}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={
                          availability.isAvailable ? 'default' : 'destructive'
                        }
                        className="shrink-0"
                      >
                        {availability.isAvailable ? 'Available' : 'Conflict'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Summary */}
              {vendorAvailability.length > 0 && (
                <div
                  className={`rounded-lg border p-4 ${
                    vendorAvailability.every((v) => v.isAvailable)
                      ? 'border-green-200 bg-green-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        vendorAvailability.every((v) => v.isAvailable)
                          ? 'bg-green-100'
                          : 'bg-yellow-100'
                      }`}
                    >
                      {vendorAvailability.every((v) => v.isAvailable) ? (
                        <CheckCircle className="size-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="size-4 text-yellow-600" />
                      )}
                    </div>
                    <div>
                      <h5
                        className={`font-semibold ${
                          vendorAvailability.every((v) => v.isAvailable)
                            ? 'text-green-800'
                            : 'text-yellow-800'
                        }`}
                      >
                        {vendorAvailability.every((v) => v.isAvailable)
                          ? 'All vendors are available'
                          : `${vendorAvailability.filter((v) => v.isAvailable).length}/${vendorAvailability.length} vendors available`}
                      </h5>
                      <p
                        className={`text-sm ${
                          vendorAvailability.every((v) => v.isAvailable)
                            ? 'text-green-700'
                            : 'text-yellow-700'
                        }`}
                      >
                        {vendorAvailability.every((v) => v.isAvailable)
                          ? 'You can continue with this time'
                          : 'Some vendors have conflicts. You may need to adjust your time or contact vendors directly.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Helper Text */}
      <div className="space-y-1 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        <p>Pick a date and start time; we'll check with your vendors.</p>
      </div>
    </div>
  )
}

function getUnavailabilityReason(reason?: string): string {
  switch (reason) {
    case 'vendor_unavailable':
      return 'Already booked or outside availability hours'
    case 'validation_error':
      return 'Unable to check availability'
    default:
      return 'Not available for this time'
  }
}
