import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

interface AvailabilitySlot {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
}

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00'
]

export function VendorAvailabilitySetup() {
  const { user } = useAuth()
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      loadAvailability()
    }
  }, [user])

  const loadAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_availability')
        .select('*')
        .eq('vendor_id', user?.id)
        .order('day_of_week')
        .order('start_time')

      if (error) throw error

      // Map the database response to our interface
      const mappedData: AvailabilitySlot[] = (data || []).map((item: any) => ({
        id: item.id,
        day_of_week: item.day_of_week,
        start_time: item.start_time,
        end_time: item.end_time
      }))

      setAvailability(mappedData)
    } catch (error) {
      console.error('Error loading availability:', error)
      toast.error('Failed to load availability')
    } finally {
      setLoading(false)
    }
  }

  const addTimeSlot = (
    dayOfWeek: number,
    startTime: string,
    endTime: string
  ) => {
    const newSlot: AvailabilitySlot = {
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime
    }
    setAvailability([...availability, newSlot])
  }

  const removeTimeSlot = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index))
  }

  const saveAvailability = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Delete existing availability
      await supabase
        .from('vendor_availability')
        .delete()
        .eq('vendor_id', user.id)

      // Insert new availability with type casting to bypass TypeScript issues
      if (availability.length > 0) {
        const { error } = await supabase.from('vendor_availability').insert(
          availability.map((slot) => ({
            vendor_id: user.id,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time
          })) as any
        )

        if (error) throw error
      }

      toast.success('Availability saved successfully')
      loadAvailability()
    } catch (error) {
      console.error('Error saving availability:', error)
      toast.error('Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  const setQuickAvailability = (startTime: string, endTime: string) => {
    const weekdaySlots = DAYS.filter((day) => day.value >= 1 && day.value <= 5) // Monday to Friday
      .map((day) => ({
        day_of_week: day.value,
        start_time: startTime,
        end_time: endTime
      }))

    setAvailability(weekdaySlots)
  }

  if (loading) {
    return <div>Loading availability...</div>
  }

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Set Your Availability</CardTitle>
        <p className="text-sm text-muted-foreground">
          Set days and time windows when new bookings can start.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Setup */}
        <div>
          <h3 className="mb-3 text-lg font-medium">Quick Setup</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickAvailability('09:00', '17:00')}
            >
              Mon-Fri 9AM-5PM
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickAvailability('08:00', '18:00')}
            >
              Mon-Fri 8AM-6PM
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickAvailability('10:00', '22:00')}
            >
              Mon-Fri 10AM-10PM
            </Button>
          </div>
        </div>

        {/* Current Availability */}
        <div>
          <h3 className="mb-3 text-lg font-medium">Current Availability</h3>
          {availability.length === 0 ? (
            <p className="text-muted-foreground">
              No availability set. Use quick setup or add custom slots below.
            </p>
          ) : (
            <div className="space-y-2">
              {DAYS.map((day) => {
                const daySlots = availability.filter(
                  (slot) => slot.day_of_week === day.value
                )
                return (
                  <div
                    key={day.value}
                    className="flex items-center gap-4 rounded-lg border p-3"
                  >
                    <div className="w-20 font-medium">{day.label}</div>
                    <div className="flex flex-1 flex-wrap gap-2">
                      {daySlots.length === 0 ? (
                        <span className="text-muted-foreground">
                          Not available
                        </span>
                      ) : (
                        daySlots.map((slot, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {slot.start_time} - {slot.end_time}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => {
                                const globalIndex = availability.findIndex(
                                  (s) =>
                                    s.day_of_week === slot.day_of_week &&
                                    s.start_time === slot.start_time &&
                                    s.end_time === slot.end_time
                                )
                                removeTimeSlot(globalIndex)
                              }}
                            >
                              ×
                            </Button>
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add Custom Slot */}
        <div>
          <h3 className="mb-3 text-lg font-medium">Add Custom Time Slot</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <select className="rounded-md border p-2" id="day-select">
              <option value="">Select Day</option>
              {DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
            <select className="rounded-md border p-2" id="start-time-select">
              <option value="">Start Time</option>
              {TIME_SLOTS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            <select className="rounded-md border p-2" id="end-time-select">
              <option value="">End Time</option>
              {TIME_SLOTS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            <Button
              onClick={() => {
                const daySelect = document.getElementById(
                  'day-select'
                ) as HTMLSelectElement
                const startSelect = document.getElementById(
                  'start-time-select'
                ) as HTMLSelectElement
                const endSelect = document.getElementById(
                  'end-time-select'
                ) as HTMLSelectElement

                if (daySelect.value && startSelect.value && endSelect.value) {
                  addTimeSlot(
                    parseInt(daySelect.value),
                    startSelect.value,
                    endSelect.value
                  )
                  daySelect.value = ''
                  startSelect.value = ''
                  endSelect.value = ''
                }
              }}
            >
              Add Slot
            </Button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setAvailability([])}>
            Clear All
          </Button>
          <Button onClick={saveAvailability} disabled={saving}>
            {saving ? 'Saving...' : 'Save Availability'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
