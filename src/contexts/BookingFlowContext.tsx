import React, {
  createContext,
  useCallback,
  useContext,
  useReducer
} from 'react'

import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useClearCart } from '@/hooks/useCart'
import { useThreadNavigation } from '@/hooks/useThreadNavigation'
import { supabase } from '@/integrations/supabase/client'

interface BookingFlowState {
  step: number
  bookingData: {
    selectedDate: Date | null
    selectedTimeSlot: any
    customizations: Record<string, any>
    deliveryDetails: Record<string, any>
    paymentMethod: string | null
    totalAmount: number
    paymentReference: string | null
  }
  cartItems: any[]
  vendorGroups: any[]
  isProcessing: boolean
  bookingId: string | null
  messageThreadId: string | null
  completedBooking: any | null
}

type BookingFlowAction =
  | { type: 'SET_STEP'; payload: number }
  | {
      type: 'UPDATE_BOOKING_DATA'
      payload: Partial<BookingFlowState['bookingData']>
    }
  | { type: 'SET_CART_ITEMS'; payload: any[] }
  | { type: 'SET_VENDOR_GROUPS'; payload: any[] }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_BOOKING_ID'; payload: string }
  | { type: 'SET_MESSAGE_THREAD_ID'; payload: string }
  | { type: 'SET_COMPLETED_BOOKING'; payload: any }
  | { type: 'RESET_FLOW' }

const initialState: BookingFlowState = {
  step: 1,
  bookingData: {
    selectedDate: null,
    selectedTimeSlot: null,
    customizations: {},
    deliveryDetails: {},
    paymentMethod: null,
    totalAmount: 0,
    paymentReference: null
  },
  cartItems: [],
  vendorGroups: [],
  isProcessing: false,
  bookingId: null,
  messageThreadId: null,
  completedBooking: null
}

function bookingFlowReducer(
  state: BookingFlowState,
  action: BookingFlowAction
): BookingFlowState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload }
    case 'UPDATE_BOOKING_DATA':
      return {
        ...state,
        bookingData: { ...state.bookingData, ...action.payload }
      }
    case 'SET_CART_ITEMS':
      return { ...state, cartItems: action.payload }
    case 'SET_VENDOR_GROUPS':
      return { ...state, vendorGroups: action.payload }
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload }
    case 'SET_BOOKING_ID':
      return { ...state, bookingId: action.payload }
    case 'SET_MESSAGE_THREAD_ID':
      return { ...state, messageThreadId: action.payload }
    case 'SET_COMPLETED_BOOKING':
      return { ...state, completedBooking: action.payload }
    case 'RESET_FLOW':
      return initialState
    default:
      return state
  }
}

interface BookingFlowContextType {
  state: BookingFlowState
  setStep: (step: number) => void
  updateBookingData: (data: Partial<BookingFlowState['bookingData']>) => void
  setCartItems: (items: any[]) => void
  setVendorGroups: (groups: any[]) => void
  submitBooking: () => Promise<void>
  resetFlow: () => void
  canProceedToStep: (step: number) => boolean
  generatePaymentReference: () => string
}

const BookingFlowContext = createContext<BookingFlowContextType | undefined>(
  undefined
)

export const useBookingFlow = () => {
  const context = useContext(BookingFlowContext)
  if (!context) {
    throw new Error('useBookingFlow must be used within BookingFlowProvider')
  }
  return context
}

export const BookingFlowProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [state, dispatch] = useReducer(bookingFlowReducer, initialState)
  const { user } = useAuth()
  const { toast } = useToast()
  const { createAndSelectThread } = useThreadNavigation()
  const clearCartMutation = useClearCart()

  const setStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', payload: step })
  }, [])

  const updateBookingData = useCallback(
    (data: Partial<BookingFlowState['bookingData']>) => {
      dispatch({ type: 'UPDATE_BOOKING_DATA', payload: data })
    },
    []
  )

  const setCartItems = useCallback(
    (items: any[]) => {
      dispatch({ type: 'SET_CART_ITEMS', payload: items })

      // Calculate total amount
      const totalAmount = items.reduce(
        (sum, item) => sum + item.listing.price * item.duration_hours,
        0
      )
      updateBookingData({ totalAmount })
    },
    [updateBookingData]
  )

  const setVendorGroups = useCallback((groups: any[]) => {
    dispatch({ type: 'SET_VENDOR_GROUPS', payload: groups })
  }, [])

  const generatePaymentReference = useCallback(() => {
    const reference = `PG-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    updateBookingData({ paymentReference: reference })
    return reference
  }, [updateBookingData])

  const submitBooking = useCallback(async () => {
    if (!user || !state.bookingData.selectedDate) {
      toast({
        title: 'Error',
        description: 'Please complete all required fields',
        variant: 'destructive'
      })
      return
    }

    dispatch({ type: 'SET_PROCESSING', payload: true })

    try {
      // Pre-submission validation
      if (!state.bookingData.selectedDate) {
        throw new Error('Please select a date for your booking')
      }

      if (!state.bookingData.selectedTimeSlot) {
        throw new Error('Please select a time slot for your booking')
      }

      if (!state.vendorGroups || state.vendorGroups.length === 0) {
        throw new Error('No items in cart to book')
      }

      console.log('Creating bookings for vendor groups:', state.vendorGroups)
      console.log('Selected date:', state.bookingData.selectedDate)
      console.log('Selected time slot:', state.bookingData.selectedTimeSlot)

      // Create simple datetime objects for booking
      const selectedTimeSlot = state.bookingData.selectedTimeSlot!
      const baseDate = state.bookingData.selectedDate!
      const dateStr = baseDate.toISOString().split('T')[0]

      // Create local timestamps without timezone conversion
      const startDateTime = new Date(`${dateStr}T${selectedTimeSlot.start}:00`)
      const endDateTime = new Date(`${dateStr}T${selectedTimeSlot.end}:00`)

      // Validate availability for each vendor before proceeding
      const { AvailabilityService } = await import(
        '@/services/availabilityService'
      )
      const vendorIds = state.vendorGroups.map((group) => group.vendor.user_id)

      for (const vendorId of vendorIds) {
        const validation =
          await AvailabilityService.validateBookingAvailability(
            vendorId,
            startDateTime,
            endDateTime
          )

        if (!validation.isValid) {
          throw new Error(
            `Vendor is not available at the selected time: ${validation.reason || 'Unknown reason'}`
          )
        }
      }

      // Create booking for each vendor group
      const bookingPromises = state.vendorGroups.map(async (group) => {
        const bookingData = {
          customer_id: user.id,
          vendor_id: group.vendor.user_id,
          listing_id: group.items[0].listing.id, // Use first item's listing
          start_date: startDateTime.toISOString(),
          end_date: endDateTime.toISOString(),
          total_price: group.totalPrice,
          payment_reference_number: state.bookingData.paymentReference,
          notes: state.bookingData.customizations?.notes || null, // Only store user notes
          status: 'requested' as const
        }

        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .insert(bookingData)
          .select()
          .single()

        if (bookingError) {
          console.error('Detailed booking creation error:', {
            error: bookingError,
            code: bookingError.code,
            message: bookingError.message,
            details: bookingError.details,
            hint: bookingError.hint,
            bookingData
          })

          // Provide specific error messages based on error type
          if (bookingError.code === '23505') {
            throw new Error(
              'This time slot is no longer available. Please select a different time.'
            )
          } else if (bookingError.code === '23503') {
            throw new Error(
              'Invalid vendor or listing selected. Please refresh and try again.'
            )
          } else if (bookingError.message.includes('availability')) {
            throw new Error(
              'Vendor is not available at the selected time. Please choose a different time slot.'
            )
          } else {
            throw new Error(
              `Booking failed: ${bookingError.message || 'Unknown database error'}`
            )
          }
        }

        console.log('Booking created successfully:', booking)

        // Create booking items for each item in the group
        if (group.items && group.items.length > 0) {
          const bookingItemsData = group.items.map((item: any) => ({
            booking_id: booking.id,
            vendor_id: group.vendor.user_id,
            item_type: item.item_type || 'service',
            item_id: item.listing.id,
            quantity: item.quantity || 1,
            unit_price: item.listing.price,
            total_price:
              item.listing.price *
              (item.quantity || 1) *
              (item.duration_hours || 1)
          }))

          const { error: itemsError } = await supabase
            .from('booking_items')
            .insert(bookingItemsData)

          if (itemsError) {
            console.error('Failed to create booking items:', itemsError)
          }
        }

        // Create delivery details if needed
        const deliveryDetails =
          state.bookingData.deliveryDetails[group.vendor.user_id]
        if (deliveryDetails?.delivery_type) {
          const deliveryData = {
            booking_id: booking.id,
            vendor_id: group.vendor.user_id,
            delivery_type: deliveryDetails.delivery_type,
            address: deliveryDetails.address || null,
            instructions: deliveryDetails.instructions || null,
            preferred_time_window: deliveryDetails.preferred_time_window || null
          }

          const { error: deliveryError } = await supabase
            .from('booking_delivery_details')
            .insert(deliveryData)

          if (deliveryError) {
            console.error('Failed to create delivery details:', deliveryError)
          }
        }

        return booking
      })

      const createdBookings = await Promise.all(bookingPromises)
      const primaryBooking = createdBookings[0]

      dispatch({ type: 'SET_BOOKING_ID', payload: primaryBooking.id })
      dispatch({ type: 'SET_COMPLETED_BOOKING', payload: primaryBooking })

      // Create message thread for primary vendor
      try {
        const thread = await createAndSelectThread({
          vendorId: state.vendorGroups[0].vendor.user_id,
          customerId: user.id,
          bookingId: primaryBooking.id,
          type: 'booking'
        })

        dispatch({ type: 'SET_MESSAGE_THREAD_ID', payload: thread.id })
      } catch (threadError) {
        console.error('Failed to create message thread:', threadError)
        // Continue without thread - not critical
      }

      // Clear cart after successful booking
      try {
        await clearCartMutation.mutateAsync()
      } catch (cartError) {
        console.error('Failed to clear cart:', cartError)
        // Don't fail the entire booking for this
      }

      // Move to success step
      setStep(5)

      toast({
        title: 'Booking submitted! 🎉',
        description:
          'Your booking request has been sent to the vendors. Check your messages for updates.'
      })
    } catch (error) {
      console.error('Failed to submit booking:', error)

      // Provide specific error message based on error type
      let errorMessage =
        'There was an error submitting your booking. Please try again.'

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      toast({
        title: 'Booking Failed',
        description: errorMessage,
        variant: 'destructive'
      })
      dispatch({ type: 'SET_PROCESSING', payload: false })
    }
  }, [user, state, createAndSelectThread, setStep, toast])

  const resetFlow = useCallback(() => {
    dispatch({ type: 'RESET_FLOW' })
  }, [])

  const canProceedToStep = useCallback(
    (step: number) => {
      switch (step) {
        case 1:
          return true
        case 2:
          // Validate date/time selection and ensure time slot is valid
          return !!(
            state.bookingData.selectedDate &&
            state.bookingData.selectedTimeSlot?.isValid === true
          )
        case 3:
          return true // Customizations are optional
        case 4:
          return true // Review step
        case 5:
          return !!(
            state.bookingData.paymentMethod &&
            state.bookingData.paymentReference
          )
        default:
          return false
      }
    },
    [state.bookingData]
  )

  const value: BookingFlowContextType = {
    state,
    setStep,
    updateBookingData,
    setCartItems,
    setVendorGroups,
    submitBooking,
    resetFlow,
    canProceedToStep,
    generatePaymentReference
  }

  return (
    <BookingFlowContext.Provider value={value}>
      {children}
    </BookingFlowContext.Provider>
  )
}
