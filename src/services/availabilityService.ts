import { supabase } from '@/integrations/supabase/client'

export interface AvailabilitySlot {
  start: string
  end: string
  availableVendors: string[]
  conflictedVendors: string[]
  isFullyAvailable: boolean
}

export interface AvailabilityRequest {
  vendorIds: string[]
  date: Date
  durationHours: number
}

export class AvailabilityService {
  /**
   * Get vendor availability intersection for a specific date and duration
   */
  static async getVendorAvailabilityIntersection({
    vendorIds,
    date,
    durationHours
  }: AvailabilityRequest): Promise<AvailabilitySlot[]> {
    try {
      const dateStr = date.toISOString().split('T')[0]
      const { data, error } = await supabase.functions.invoke(
        'availability-intersection',
        {
          body: {
            vendorIds,
            date: dateStr,
            durationHours
          }
        }
      )
      if (error) throw error as any
      const slots = (data as any)?.slots as AvailabilitySlot[] | undefined
      if (Array.isArray(slots)) return slots
      return []
    } catch (error) {
      console.error('Error fetching vendor availability (edge):', error)
      // Fallback to mock data for resilience
      return this.getMockAvailabilitySlots(vendorIds, durationHours)
    }
  }

  /**
   * Check if a single vendor is available for a specific time slot
   */
  private static async checkVendorAvailability(
    vendorId: string,
    date: Date,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    try {
      // Create simple local timestamps - no timezone conversion
      const dateStr = date.toISOString().split('T')[0]
      const startDateTime = new Date(`${dateStr}T${startTime}:00`)
      const endDateTime = new Date(`${dateStr}T${endTime}:00`)

      const { data, error } = await supabase.rpc(
        'simple_booking_availability',
        {
          p_vendor_id: vendorId,
          p_start_date: startDateTime.toISOString(),
          p_end_date: endDateTime.toISOString()
        }
      )

      if (error) {
        console.error('RPC error:', error)
        throw error
      }

      return data || false
    } catch (error) {
      console.error('Error checking vendor availability:', error)
      return false // Default to unavailable for safety
    }
  }

  /**
   * Validate booking availability for a specific time slot
   */
  static async validateBookingAvailability(
    vendorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    isValid: boolean
    reason?: string
    requiresApproval?: boolean
  }> {
    try {
      const { data, error } = await supabase.rpc(
        'simple_booking_availability',
        {
          p_vendor_id: vendorId,
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString()
        }
      )

      if (error) throw error

      return {
        isValid: data || false,
        reason: data ? undefined : 'vendor_unavailable',
        requiresApproval: false
      }
    } catch (error) {
      console.error('Error validating booking availability:', error)
      return { isValid: false, reason: 'validation_error' }
    }
  }

  /**
   * Find alternative time slots when conflicts exist
   */
  static async suggestAlternativeTimes(
    vendorIds: string[],
    originalDate: Date,
    durationHours: number
  ): Promise<AvailabilitySlot[]> {
    const alternatives: AvailabilitySlot[] = []

    // Check next 7 days for alternatives
    for (let i = 1; i <= 7; i++) {
      const alternativeDate = new Date(originalDate)
      alternativeDate.setDate(alternativeDate.getDate() + i)

      const slots = await this.getVendorAvailabilityIntersection({
        vendorIds,
        date: alternativeDate,
        durationHours
      })

      // Only include slots where all vendors are available
      const fullyAvailableSlots = slots.filter((slot) => slot.isFullyAvailable)
      alternatives.push(...fullyAvailableSlots)

      if (alternatives.length >= 5) break // Limit to 5 suggestions
    }

    return alternatives
  }

  /**
   * Mock availability data for development
   */
  private static getMockAvailabilitySlots(
    vendorIds: string[],
    durationHours: number
  ): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = []
    const startHour = 9
    const endHour = 20

    for (let hour = startHour; hour <= endHour - durationHours; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`
      const endTime = `${(hour + durationHours).toString().padStart(2, '0')}:00`

      // Create deterministic mock data based on hour and vendor IDs
      const slotHash = hour + vendorIds.join('').length
      const isSlotAvailable = slotHash % 3 !== 0 // Make every 3rd slot unavailable

      const availableVendors = isSlotAvailable ? vendorIds : []
      const conflictedVendors = isSlotAvailable ? [] : vendorIds

      slots.push({
        start: startTime,
        end: endTime,
        availableVendors,
        conflictedVendors,
        isFullyAvailable: conflictedVendors.length === 0
      })
    }

    return slots
  }
}

export default AvailabilityService
