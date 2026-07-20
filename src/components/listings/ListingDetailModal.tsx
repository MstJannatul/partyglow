import { useState } from 'react'
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  MessageCircle,
  Truck,
  Verified
} from 'lucide-react'

import { SimpleBookingModal } from '@/components/booking/SimpleBookingModal'
import { FavoriteToggleButton } from '@/components/common/FavoriteToggleButton'
import { PriceTag } from '@/components/common/PriceTag'
import { RatingDisplay } from '@/components/common/RatingDisplay'
import { AddToCartButton } from '@/components/listings/AddToCartButton'
import { ImageGallery } from '@/components/listings/ImageGallery'
import { QuantityPicker } from '@/components/listings/QuantityPicker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ImageZoomModal } from '@/components/ui/ImageZoomModal'
import { InventoryBadge } from '@/components/ui/InventoryBadge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useInventoryAvailability } from '@/hooks/useInventory'
import { useThreadNavigation } from '@/hooks/useThreadNavigation'
import { cn } from '@/lib/utils'
import { getVendorDisplayName, getVendorInitials } from '@/lib/vendorUtils'

// Compatible type with ListingCard
type ListingDetailData = {
  id: string
  title: string
  description?: string | null
  price: number
  location?: string | null
  media_urls?: string[] | null
  type?: string | null
  listing_type?: string | null
  delivery_type?: string | null
  user_id: string
  vendor?: {
    full_name?: string
    business_name?: string
    is_verified?: boolean
  } | null
  average_rating?: number
  reviews_count?: number
  // Additional fields that might be available
  features?: string[] | null
  category?: string | null
  availability_window?: number | null
}

interface ListingDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listing: ListingDetailData
}

export function ListingDetailModal({
  open,
  onOpenChange,
  listing
}: ListingDetailModalProps) {
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [imageModalIndex, setImageModalIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const { isOutOfStock, isLowStock, availableStock, hasInventory } =
    useInventoryAvailability(listing.id)
  const { user } = useAuth()
  const { toast } = useToast()
  const { createAndSelectThread, navigateToMessages, isCreatingThread } =
    useThreadNavigation()

  const isEquipment = listing.type === 'equipment'
  const images =
    listing.media_urls?.length > 0 ? listing.media_urls : ['/placeholder.svg']

  const handleBookNow = () => {
    setShowBookingModal(true)
  }

  const handleAskQuestion = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to ask a question to the vendor.',
        variant: 'destructive'
      })
      return
    }
    try {
      const thread = await createAndSelectThread({
        vendorId: listing.user_id,
        customerId: user.id,
        listingId: listing.id,
        type: 'inquiry'
      })
      if (thread?.id) {
        onOpenChange(false) // Close detail modal first
        navigateToMessages(thread.id)
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
      toast({
        title: 'Unable to start conversation',
        description: 'Please try again in a moment.',
        variant: 'destructive'
      })
    }
  }

  const handleImageClick = (index: number) => {
    setImageModalIndex(index)
    setShowImageModal(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[95vh] w-[95vw] overflow-y-auto p-0 sm:max-w-4xl">
          <div className="relative">
            {/* Header with close and favorite */}
            <div className="absolute right-4 top-4 z-10 flex gap-2">
              <FavoriteToggleButton listingId={listing.id} />
            </div>

            {/* Enhanced Image Gallery */}
            <div className="h-[240px] overflow-hidden sm:h-[280px] lg:h-[320px]">
              <ImageGallery
                images={images}
                alt={listing.title}
                onImageClick={handleImageClick}
                className="h-full"
              />
            </div>
          </div>

          <div className="space-y-4 p-3 sm:space-y-6 sm:p-4 lg:p-6">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-lg font-bold leading-tight sm:text-xl lg:text-2xl">
                    {listing.title}
                  </DialogTitle>
                  <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-4 flex-shrink-0" />
                    <span className="text-sm leading-relaxed sm:text-base">
                      {listing.location || 'Location not specified'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <PriceTag
                    price={listing.price}
                    listingType={listing.type}
                    className="text-base sm:text-lg lg:text-xl"
                  />
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {listing.delivery_type && (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 text-xs"
                  >
                    <Truck className="size-3" />
                    {listing.delivery_type === 'both'
                      ? 'Pick-up/Delivery'
                      : listing.delivery_type === 'pickup'
                        ? 'Pick-up'
                        : 'Delivery'}
                  </Badge>
                )}
                {isEquipment &&
                  hasInventory &&
                  (isOutOfStock || isLowStock) && (
                    <InventoryBadge
                      availableStock={availableStock}
                      isLowStock={isLowStock}
                      isOutOfStock={isOutOfStock}
                    />
                  )}
              </div>
            </div>

            {/* Important Details */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base font-semibold sm:text-lg">
                Important details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <DollarSign className="size-4 text-muted-foreground" />
                  <span>
                    Pricing: ${listing.price} per{' '}
                    {listing.type === 'service' ? 'event' : 'day'}
                  </span>
                </div>
                {listing.availability_window && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="size-4 text-muted-foreground" />
                    <span>
                      Book up to {listing.availability_window} days in advance
                    </span>
                  </div>
                )}
                <div className="text-sm">
                  <p className="leading-relaxed text-muted-foreground">
                    {listing.description ||
                      'No description available for this listing.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Vendor Trust Signals */}
            <div className="rounded-lg bg-muted/30 p-3 sm:p-4">
              <h3 className="mb-2 text-base font-semibold sm:mb-3 sm:text-lg">
                Your vendor
              </h3>
              <div className="flex items-start gap-3">
                <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 sm:size-14">
                  <span className="text-lg font-semibold text-primary">
                    {getVendorInitials(listing.vendor)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-medium">
                      {getVendorDisplayName(listing.vendor)}
                    </h4>
                    {listing.vendor?.is_verified && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 text-xs"
                      >
                        <Verified className="size-3 text-primary" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <RatingDisplay
                    rating={listing.average_rating || 0}
                    count={listing.reviews_count || 0}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            {listing.features && listing.features.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-base font-semibold sm:text-lg">
                  Included features
                </h3>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {listing.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <div className="size-1.5 flex-shrink-0 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quantity Picker and Add to Cart */}
            {isEquipment && hasInventory && !isOutOfStock && (
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-base font-semibold sm:text-lg">
                  How many do you need?
                </h3>
                <div className="flex items-center justify-between">
                  <QuantityPicker
                    quantity={quantity}
                    onQuantityChange={setQuantity}
                    maxQuantity={availableStock}
                  />
                  <AddToCartButton
                    listing={listing}
                    vendorId={listing.user_id}
                    quantity={quantity}
                    className="h-12 min-h-[48px] bg-secondary text-sm hover:bg-secondary/80 sm:text-base"
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {availableStock} available for your dates
                </p>
              </div>
            )}

            {/* Book Now Button */}
            <div className="space-y-3 pt-2 sm:space-y-4">
              <Button
                onClick={handleBookNow}
                variant="gradient"
                className="h-12 min-h-[48px] w-full text-sm font-semibold sm:text-base"
                size="lg"
                disabled={isEquipment && isOutOfStock}
              >
                <Calendar className="mr-2 size-4" />
                {isEquipment && isOutOfStock ? 'Out of Stock' : 'Book Now'}
              </Button>
              {isEquipment && isLowStock && !isOutOfStock && (
                <p className="text-center text-xs text-orange-600">
                  Only {availableStock} left - book soon!
                </p>
              )}
            </div>

            {/* Sticky Footer - Ask Question Only */}
            {/*  <div className="sticky bottom-0 -mx-3 border-t bg-background/95 px-3 pt-3 backdrop-blur-sm sm:static sm:-mx-4 sm:mx-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:px-4 sm:pt-0 sm:pt-4 sm:backdrop-blur-none lg:-mx-6 lg:px-6"> */}
            <div className="sticky bottom-0 -mx-3 border-t bg-background/95 px-3 pt-3 backdrop-blur-sm sm:static sm:mx-0 sm:border-t-0 sm:bg-transparent sm:px-4 sm:pt-4 sm:backdrop-blur-none lg:-mx-6 lg:px-6">
              <Button
                onClick={handleAskQuestion}
                variant="outline"
                size="lg"
                disabled={isCreatingThread}
                className="h-12 min-h-[48px] w-full text-sm font-medium sm:text-base"
              >
                <MessageCircle className="mr-2 size-4" />
                Ask Question
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nested Modals */}
      <SimpleBookingModal
        open={showBookingModal}
        onOpenChange={setShowBookingModal}
        listing={listing}
      />

      <ImageZoomModal
        open={showImageModal}
        onOpenChange={setShowImageModal}
        images={images}
        initialIndex={imageModalIndex}
        alt={listing.title}
      />
    </>
  )
}
