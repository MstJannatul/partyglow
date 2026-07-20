import { useState } from 'react'
import {
  Calendar,
  MapPin,
  MessageCircle,
  Plus,
  Star,
  Truck,
  Verified
} from 'lucide-react'

import { SimpleBookingModal } from '@/components/booking/SimpleBookingModal'
import { CardWithMedia } from '@/components/common/CardWithMedia'
import { FavoriteToggleButton } from '@/components/common/FavoriteToggleButton'
import { PriceTag } from '@/components/common/PriceTag'
import { RatingDisplay } from '@/components/common/RatingDisplay'
import { AddToCartButton } from '@/components/listings/AddToCartButton'
import { ListingDetailModal } from '@/components/listings/ListingDetailModal'
import { QuantityPicker } from '@/components/listings/QuantityPicker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ImageZoomModal } from '@/components/ui/ImageZoomModal'
import { InventoryBadge } from '@/components/ui/InventoryBadge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useInventoryAvailability } from '@/hooks/useInventory'
import { useThreadNavigation } from '@/hooks/useThreadNavigation'
import { cn } from '@/lib/utils'
import { getVendorDisplayName, getVendorInitials } from '@/lib/vendorUtils'
// Minimal compatible type used by this component
type ListingCardData = {
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
}

interface ListingCardProps {
  listing: ListingCardData
}

export const ListingCard = ({ listing }: ListingCardProps) => {
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [imageModalIndex, setImageModalIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const { isOutOfStock, isLowStock, availableStock, hasInventory } =
    useInventoryAvailability(listing.id)

  const isEquipment = listing.type === 'equipment'

  const { user } = useAuth()
  const { toast } = useToast()
  const { createAndSelectThread, navigateToMessages, isCreatingThread } =
    useThreadNavigation()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Will be handled by AddToCartButton
  }

  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowBookingModal(true)
  }

  const handleAskQuestion = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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

  const handleCardClick = () => {
    setShowDetailModal(true)
  }

  const images =
    listing.media_urls?.length > 0 ? listing.media_urls : ['/placeholder.svg']

  return (
    <>
      <CardWithMedia
        images={images}
        alt={listing.title}
        onImageClick={handleImageClick}
        actionOverlay={<FavoriteToggleButton listingId={listing.id} />}
        className="group relative cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
        header={undefined}
        footer={
          <div className="flex w-full flex-row gap-2">
            <Button onClick={handleBookNow} className="flex-1" size="sm">
              <Calendar className="mr-2 size-4" />
              Book Now
            </Button>
            <AddToCartButton
              listing={listing}
              vendorId={listing.user_id}
              quantity={quantity}
              className="flex-1 bg-secondary hover:bg-secondary/80"
            />
          </div>
        }
      >
        {/* Clickable area: Header to Vendor Info */}
        <div onClick={handleCardClick}>
          {/* Header */}
          <div className="mb-2 flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 truncate font-semibold text-foreground">
                {listing.title}
              </h3>
              <div className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3" />
                <span className="truncate">
                  {listing.location || 'Location not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {listing.description || 'No description available'}
          </p>

          {/* Badges */}
          <div className="mb-3 flex flex-wrap gap-1">
            {listing.type && (
              <Badge variant="outline" className="text-xs">
                {listing.type}
              </Badge>
            )}
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
                    : listing.delivery_type === 'delivery'
                      ? 'Delivery'
                      : listing.delivery_type}
              </Badge>
            )}
            {isEquipment && hasInventory && (isOutOfStock || isLowStock) && (
              <InventoryBadge
                availableStock={availableStock}
                isLowStock={isLowStock}
                isOutOfStock={isOutOfStock}
              />
            )}
          </div>

          {/* Vendor Info */}
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-muted/50 p-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
              <span className="text-xs font-medium text-primary">
                {getVendorInitials(listing.vendor)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="truncate text-sm font-medium">
                  {getVendorDisplayName(listing.vendor)}
                </span>
                {listing.vendor?.is_verified && (
                  <Verified className="size-4 text-primary" />
                )}
              </div>
              <RatingDisplay
                rating={listing.average_rating || 0}
                count={listing.reviews_count || 0}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Price and Controls - Non-clickable area */}
        <div className="flex items-center justify-between">
          <PriceTag price={listing.price} listingType={listing.type} />
          <div className="flex items-center gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleAskQuestion(e)
              }}
              variant="outline"
              size="sm"
              aria-label="Ask a question"
              disabled={isCreatingThread}
              className="h-8 px-3"
            >
              <MessageCircle className="size-4" />
            </Button>
            {isEquipment && hasInventory && !isOutOfStock && (
              <QuantityPicker
                quantity={quantity}
                onQuantityChange={setQuantity}
                maxQuantity={availableStock}
                className="flex-shrink-0"
              />
            )}
          </div>
        </div>
      </CardWithMedia>

      {/* Simple Booking Modal */}
      <SimpleBookingModal
        open={showBookingModal}
        onOpenChange={setShowBookingModal}
        listing={listing}
      />

      {/* Listing Detail Modal */}
      <ListingDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        listing={listing}
      />

      {/* Image Zoom Modal */}
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
