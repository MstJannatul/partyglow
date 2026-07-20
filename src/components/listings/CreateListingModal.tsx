import React, { useState } from 'react'
import { ArrowLeft, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

import { EquipmentListingForm } from './forms/EquipmentListingForm'
import { PackageListingForm } from './forms/PackageListingForm'
import { ServiceListingForm } from './forms/ServiceListingForm'
import { ListingTypeSelection } from './ListingTypeSelection'

type ListingType = 'service' | 'equipment' | 'package'
type ModalStep = 'type-selection' | 'form'

interface CreateListingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccessNavigate?: () => void
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  onSuccessNavigate
}) => {
  const [currentStep, setCurrentStep] = useState<ModalStep>('type-selection')
  const [selectedType, setSelectedType] = useState<ListingType | null>(null)

  const handleTypeSelect = (type: ListingType) => {
    setSelectedType(type)
    setCurrentStep('form')
  }

  const handleBackToTypeSelection = () => {
    setCurrentStep('type-selection')
    setSelectedType(null)
  }

  const handleClose = () => {
    setCurrentStep('type-selection')
    setSelectedType(null)
    onClose()
  }

  const handleSuccess = () => {
    if (onSuccessNavigate) {
      onSuccessNavigate()
    } else {
      handleClose()
    }
  }

  const renderForm = () => {
    if (!selectedType) return null

    const commonProps = {
      onSuccess: handleSuccess,
      onCancel: handleBackToTypeSelection
    }

    switch (selectedType) {
      case 'service':
        return <ServiceListingForm {...commonProps} />
      case 'equipment':
        return <EquipmentListingForm {...commonProps} />
      case 'package':
        return <PackageListingForm {...commonProps} />
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[95vh] w-[95vw] max-w-lg overflow-y-auto sm:max-w-2xl lg:max-w-4xl">
        <DialogHeader>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              {currentStep === 'form' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToTypeSelection}
                  className="shrink-0 gap-2"
                >
                  <ArrowLeft className="size-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              )}
              <DialogTitle className="text-lg sm:text-xl">
                {currentStep === 'type-selection'
                  ? 'Create New Listing'
                  : `Create ${selectedType} Listing`}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6">
          {currentStep === 'type-selection' ? (
            <ListingTypeSelection
              onTypeSelect={handleTypeSelect}
              onCancel={handleClose}
            />
          ) : (
            renderForm()
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
