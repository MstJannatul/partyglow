import React, { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'

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

interface EditListingModalProps {
  isOpen: boolean
  onClose: () => void
  listing: any
}

export const EditListingModal: React.FC<EditListingModalProps> = ({
  isOpen,
  onClose,
  listing
}) => {
  const handleClose = () => {
    onClose()
  }

  const renderForm = () => {
    if (!listing) return null

    const commonProps = {
      onSuccess: handleClose,
      onCancel: handleClose,
      initialData: listing,
      isEditing: true
    }

    switch (listing.listing_type) {
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
          <div className="flex items-center gap-2 sm:gap-4">
            <DialogTitle className="text-lg sm:text-xl">
              Edit {listing?.listing_type} Listing
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-6">{renderForm()}</div>
      </DialogContent>
    </Dialog>
  )
}
