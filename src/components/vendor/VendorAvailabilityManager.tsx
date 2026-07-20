import React, { useEffect, useState } from 'react'
import { Clock, HelpCircle, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

interface AvailabilitySlot {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
}

const DAYS = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 0, label: 'Sunday', short: 'Sun' }
]

const TIME_SLOTS = [
  '06:00',
  '07:00',
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
  '22:00',
  '23:00'
]

export function VendorAvailabilityManager() {
  const { user } = useAuth()
  const [isAvailable, setIsAvailable] = useState(true)
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      loadAvailabilitySettings()
    }
  }, [user])

  const loadAvailabilitySettings = async () => {
    try {
      // Load availability enabled status
      const { data: profile } = await supabase
        .from('profiles')
        .select('availability_enabled')
        .eq('user_id', user?.id)
        .single()

      if (profile) {
        setIsAvailable(profile.availability_enabled ?? true)
      }

      // Load availability slots
      const { data: slots, error } = await supabase
        .from('vendor_availability')
        .select('*')
        .eq('vendor_id', user?.id)
        .order('day_of_week')
        .order('start_time')

      if (error) throw error

      const mappedSlots: AvailabilitySlot[] = (slots || []).map(
        (item: any) => ({
          id: item.id,
          day_of_week: item.day_of_week,
          start_time: item.start_time,
          end_time: item.end_time
        })
      )

      setAvailability(mappedSlots)
    } catch (error) {
      console.error('Error loading availability:', error)
      toast.error('Failed to load availability settings')
    } finally {
      setLoading(false)
    }
  }

  const toggleAvailability = async (enabled: boolean) => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({ availability_enabled: enabled })
        .eq('user_id', user?.id)

      if (error) throw error

      setIsAvailable(enabled)
      toast.success(
        enabled ? 'You are now accepting bookings' : 'You are now offline'
      )
    } catch (error) {
      console.error('Error updating availability:', error)
      toast.error('Failed to update availability status')
    } finally {
      setSaving(false)
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

  const removeTimeSlot = (slotToRemove: AvailabilitySlot) => {
    setAvailability(
      availability.filter(
        (slot) =>
          !(
            slot.day_of_week === slotToRemove.day_of_week &&
            slot.start_time === slotToRemove.start_time &&
            slot.end_time === slotToRemove.end_time
          )
      )
    )
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

      // Insert new availability
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

      toast.success('Availability updated successfully')
    } catch (error) {
      console.error('Error saving availability:', error)
      toast.error('Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="mx-auto mb-4 size-12 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">
            Loading availability settings...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Master Availability Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Availability Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor="availability-toggle"
                className="text-base font-medium"
              >
                {isAvailable ? 'You are accepting bookings' : 'You are offline'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isAvailable
                  ? 'Customers can book available time slots'
                  : 'Customers cannot see your availability'}
              </p>
            </div>
            <Switch
              id="availability-toggle"
              checked={isAvailable}
              onCheckedChange={toggleAvailability}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Dialog>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Add time windows when new bookings can start (e.g., 9:00–17:00).
          </p>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="How availability works"
            >
              <HelpCircle className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>How availability works</DialogTitle>
              <DialogDescription>
                These hours control when new bookings can start. Customers will
                only see start times inside your windows.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>
                  Add hours like 09:00–17:00 for each day. Use multiple ranges
                  to split a day.
                </li>
                <li>
                  Bookings must start within a window. They can extend past the
                  end time if no conflicts.
                </li>
                <li>
                  Use the status switch above to pause new bookings without
                  deleting hours.
                </li>
                <li>Click Save to apply your changes.</li>
              </ul>
              <p className="text-xs text-muted-foreground">
                Tip: Avoid overlapping windows on the same day.
              </p>
            </div>
          </DialogContent>
        </div>
      </Dialog>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DAYS.map((day) => {
          const daySlots = availability.filter(
            (slot) => slot.day_of_week === day.value
          )

          return (
            <Card key={day.value} className="relative">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{day.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Existing slots */}
                {daySlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Not available</p>
                ) : (
                  <div className="space-y-2">
                    {daySlots.map((slot, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md bg-muted p-2"
                      >
                        <span className="text-sm">
                          {slot.start_time} - {slot.end_time}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeSlot(slot)}
                          className="size-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new slot */}
                <DaySlotAdder dayOfWeek={day.value} onAddSlot={addTimeSlot} />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={saveAvailability}
          disabled={saving}
          className="min-w-32"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

interface DaySlotAdderProps {
  dayOfWeek: number
  onAddSlot: (dayOfWeek: number, startTime: string, endTime: string) => void
}

function DaySlotAdder({ dayOfWeek, onAddSlot }: DaySlotAdderProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')

  const handleAdd = () => {
    if (startTime && endTime && startTime < endTime) {
      onAddSlot(dayOfWeek, startTime, endTime)
      setIsAdding(false)
      setStartTime('09:00')
      setEndTime('17:00')
    } else {
      toast.error('Please select valid start and end times')
    }
  }

  if (!isAdding) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsAdding(true)}
        className="w-full justify-center"
      >
        <Plus className="mr-1 size-3" />
        Add Hours
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <select
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
        className="w-full rounded-md border p-1 text-sm"
      >
        {TIME_SLOTS.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
      <select
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
        className="w-full rounded-md border p-1 text-sm"
      >
        {TIME_SLOTS.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
      <div className="flex gap-1">
        <Button
          variant="default"
          size="sm"
          onClick={handleAdd}
          className="flex-1 text-xs"
        >
          Add
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(false)}
          className="flex-1 text-xs"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
