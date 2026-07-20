import { useState } from 'react'
import {
  Clock,
  Edit2,
  MapPin,
  Package,
  Star,
  Truck,
  Verified
} from 'lucide-react'

import { CardWithMedia } from '@/components/common/CardWithMedia'
import { PriceTag } from '@/components/common/PriceTag'
import { RatingDisplay } from '@/components/common/RatingDisplay'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ImageZoomModal } from '@/components/ui/ImageZoomModal'
import { Input } from '@/components/ui/input'
import { useInventoryAvailability } from '@/hooks/useInventory'
import { useUpdateInventoryQuantity } from '@/hooks/useInventoryManagement'
import { cn } from '@/lib/utils'

// Minimal compatible type for vendor listing card
type VendorListingData = {
  id: string
  title: string
  description?: string | null
  price: number
  location?: string | null
  media_urls?: string[] | null
  listing_type?: string | null
  delivery_type?: string | null
  is_active: boolean
  vendor?: {
    full_name?: string
    business_name?: string
    is_verified?: boolean
  } | null
  average_rating?: number
  reviews_count?: number
}

interface VendorListingCardProps {
  listing: VendorListingData
}

export const VendorListingCard = ({ listing }: VendorListingCardProps) => {
  const [showImageModal, setShowImageModal] = useState(false)
  const [imageModalIndex, setImageModalIndex] = useState(0)
  const [isEditingInventory, setIsEditingInventory] = useState(false)
  const [newQuantity, setNewQuantity] = useState(0)

  const inventoryData = useInventoryAvailability(listing.id)
  const updateInventoryMutation = useUpdateInventoryQuantity()

  const handleImageClick = (index: number) => {
    setImageModalIndex(index)
    setShowImageModal(true)
  }

  const handleEditInventory = () => {
    setNewQuantity(inventoryData.totalStock)
    setIsEditingInventory(true)
  }

  const handleSaveInventory = async () => {
    if (inventoryData.hasInventory && listing.listing_type === 'equipment') {
      try {
        // Import supabase dynamically
        const { supabase } = await import('@/integrations/supabase/client')

        // Get the inventory item ID
        const { data: inventoryItems } = await supabase
          .from('inventory_items')
          .select('id')
          .eq('listing_id', listing.id)
          .eq('is_active', true)
          .single()

        if (inventoryItems) {
          await updateInventoryMutation.mutateAsync({
            inventoryItemId: inventoryItems.id,
            newQuantity: newQuantity
          })
          setIsEditingInventory(false)
        }
      } catch (error) {
        console.error('Failed to update inventory:', error)
      }
    }
  }

  const handleCancelEdit = () => {
    setIsEditingInventory(false)
    setNewQuantity(inventoryData.totalStock)
  }

  const images =
    listing.media_urls?.length > 0 ? listing.media_urls : ['/placeholder.svg']

  return (
    <>
      <CardWithMedia
        images={images}
        alt={listing.title}
        onImageClick={handleImageClick}
        className="group relative transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
      >
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
          {listing.listing_type && (
            <Badge variant="outline" className="text-xs">
              {listing.listing_type}
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
        </div>

        {/* Vendor Info - Simplified for vendor's own view */}
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-muted/50 p-2">
          <RatingDisplay
            rating={listing.average_rating || 0}
            count={listing.reviews_count || 0}
            size="sm"
          />
          {listing.vendor?.is_verified && (
            <div className="flex items-center gap-1">
              <Verified className="size-4 text-primary" />
              <span className="text-xs text-muted-foreground">Verified</span>
            </div>
          )}
          {/* Equipment Inventory Display */}
          {listing.listing_type === 'equipment' &&
            inventoryData.hasInventory && (
              <div className="ml-auto flex items-center gap-1">
                <Package className="size-3 text-muted-foreground" />
                {isEditingInventory ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(Number(e.target.value))}
                      className="h-6 w-16 px-1 text-xs"
                      min="0"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-6 p-0"
                      onClick={handleSaveInventory}
                    >
                      ✓
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-6 p-0"
                      onClick={handleCancelEdit}
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {inventoryData.totalStock - inventoryData.availableStock}{' '}
                      rented / {inventoryData.totalStock} total
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="size-4 p-0"
                      onClick={handleEditInventory}
                    >
                      <Edit2 className="size-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Price and Status */}
        <div className="flex items-center justify-between">
          <PriceTag price={listing.price} listingType={listing.listing_type} />
          {/* Status Indicator */}
          <div
            className={cn(
              'flex items-center gap-1 text-xs',
              listing.is_active ? 'text-green-600' : 'text-muted-foreground'
            )}
          >
            <Clock className="size-3" />
            <span>{listing.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </CardWithMedia>

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
