import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Sparkles
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import {
  BookingFlowProvider,
  useBookingFlow
} from '@/contexts/BookingFlowContext'

import { BookingCustomizer } from './BookingCustomizer'
import { BookingReview } from './BookingReview'
import { BookingSuccess } from './BookingSuccess'
import { DateTimeSelector } from './DateTimeSelector'
import { UserHandledPaymentStep } from './UserHandledPaymentStep'

interface MultiVendorBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cartItems: any[]
  vendorGroups: any[]
}

const steps = [
  { id: 1, title: 'Pick date & time', icon: Calendar },
  { id: 2, title: 'Customize', icon: Clock },
  { id: 3, title: 'Review', icon: CheckCircle },
  { id: 4, title: 'Payment', icon: CreditCard },
  { id: 5, title: 'Done', icon: Sparkles }
]

function MultiVendorBookingDialogContent({
  cartItems,
  vendorGroups
}: {
  cartItems: any[]
  vendorGroups: any[]
}) {
  const {
    state,
    setStep,
    updateBookingData,
    setCartItems,
    setVendorGroups,
    canProceedToStep,
    submitBooking,
    resetFlow
  } = useBookingFlow()

  useEffect(() => {
    setCartItems(cartItems)
    setVendorGroups(vendorGroups)
  }, [cartItems, vendorGroups, setCartItems, setVendorGroups])

  const progress = (state.step / steps.length) * 100

  const handleNext = async () => {
    if (state.step === 4) {
      await submitBooking()
    } else if (state.step < steps.length) {
      setStep(state.step + 1)
    }
  }

  const handlePrevious = () => {
    if (state.step > 1) {
      setStep(state.step - 1)
    }
  }

  const handleStepData = (stepData: any) => {
    updateBookingData(stepData)
  }

  const renderStepContent = () => {
    switch (state.step) {
      case 1:
        return (
          <DateTimeSelector
            vendorGroups={state.vendorGroups}
            onSelectionChange={handleStepData}
            selectedDate={state.bookingData.selectedDate}
            selectedTimeSlot={state.bookingData.selectedTimeSlot}
          />
        )
      case 2:
        return (
          <BookingCustomizer
            cartItems={state.cartItems}
            vendorGroups={state.vendorGroups}
            selectedDate={state.bookingData.selectedDate}
            onCustomizationChange={handleStepData}
            customizations={state.bookingData.customizations}
          />
        )
      case 3:
        return (
          <BookingReview
            bookingData={state.bookingData}
            cartItems={state.cartItems}
            vendorGroups={state.vendorGroups}
          />
        )
      case 4:
        return <UserHandledPaymentStep />
      case 5:
        return <BookingSuccess />
      default:
        return null
    }
  }

  const getStepTitle = () => {
    if (state.step === 5) return 'Booking Confirmed! 🎉'
    return 'Book Your Perfect Party'
  }

  return (
    <div className="flex max-h-[95vh] max-w-5xl flex-col overflow-hidden">
      <div className="border-b border-border p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-2xl font-bold text-transparent">
            {getStepTitle()}
          </h2>
          <div className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
            Step {state.step} of {steps.length}
          </div>
        </div>

        {/* Progress Bar */}
        {state.step < 5 && (
          <div className="mt-6 space-y-4">
            <Progress value={progress} className="h-3 bg-muted" />
            <div className="flex justify-between px-1">
              {steps.slice(0, 4).map((step) => {
                const Icon = step.icon
                const isActive = step.id === state.step
                const isCompleted = step.id < state.step

                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center gap-2 text-xs transition-all duration-200 ${
                      isActive
                        ? 'scale-105 font-semibold text-primary'
                        : isCompleted
                          ? 'font-medium text-emerald-600'
                          : 'text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`rounded-full p-2 transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/10 ring-2 ring-primary/20'
                          : isCompleted
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-muted'
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <span className="hidden sm:block">{step.title}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">{renderStepContent()}</div>

      {/* Navigation */}
      {state.step < 5 && (
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 pb-4 pt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={state.step === 1}
            size="lg"
            className="px-6"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={resetFlow} size="lg">
              Cancel
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceedToStep(state.step + 1) || state.isProcessing}
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/80 px-8 hover:from-primary/90 hover:to-primary/70"
            >
              {state.isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </div>
              ) : state.step === 4 ? (
                <>
                  Finish
                  <CheckCircle className="ml-2 size-4" />
                </>
              ) : state.step === 3 ? (
                <>
                  Request to book
                  <ArrowRight className="ml-2 size-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function MultiVendorBookingDialog({
  open,
  onOpenChange,
  cartItems,
  vendorGroups
}: MultiVendorBookingDialogProps) {
  return (
    <BookingFlowProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[95vh] max-w-5xl overflow-hidden p-0">
          <MultiVendorBookingDialogContent
            cartItems={cartItems}
            vendorGroups={vendorGroups}
          />
        </DialogContent>
      </Dialog>
    </BookingFlowProvider>
  )
}
