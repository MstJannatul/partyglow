import {
  MapPin,
  Minus,
  Package,
  Plus,
  Star,
  Trash2,
  Verified
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getVendorDisplayName, getVendorInitials } from '@/lib/vendorUtils'

interface CartItem {
  id: string
  duration_hours: number
  quantity?: number
  item_type?: string
  listing: {
    id: string
    title: string
    price: number
    location: string
    media_urls: string[] | null
    min_booking_hours: number | null
    max_booking_hours: number | null
    listing_type?: string
  }
}

interface Vendor {
  id: string
  user_id: string
  full_name: string
  business_name?: string | null
  avatar_url: string | null
  is_verified: boolean | null
}

interface VendorCartGroupProps {
  vendor: Vendor
  items: CartItem[]
  totalPrice: number
  onUpdateQuantity: (
    itemId: string,
    newDuration?: number,
    newQuantity?: number
  ) => void
  onRemoveItem: (itemId: string) => void
  isLast?: boolean
}

export function VendorCartGroup({
  vendor,
  items,
  totalPrice,
  onUpdateQuantity,
  onRemoveItem,
  isLast = false
}: VendorCartGroupProps) {
  return (
    <div className="space-y-4">
      {/* Vendor Header */}
      <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
        <Avatar className="size-10">
          <AvatarImage src={vendor.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 font-medium text-primary">
            {getVendorInitials(vendor)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="truncate font-medium">
              {getVendorDisplayName(vendor)}
            </h3>
            {vendor.is_verified && (
              <Verified className="size-4 flex-shrink-0 text-blue-500" />
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="size-3 fill-yellow-400 text-yellow-400" />
            <span>4.8 (24 reviews)</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-muted-foreground">Subtotal</p>
          <p className="font-semibold text-primary">${totalPrice.toFixed(2)}</p>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-3 rounded-lg border border-border bg-background p-3"
          >
            {/* Item Image */}
            <div className="size-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.listing.media_urls?.[0] ? (
                <img
                  src={item.listing.media_urls[0]}
                  alt={item.listing.title}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-muted">
                  <Package className="size-6 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Item Details */}
            <div className="min-w-0 flex-1">
              <h4 className="mb-1 truncate text-sm font-medium">
                {item.listing.title}
              </h4>
              <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                <span className="truncate">{item.listing.location}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.item_type === 'equipment' ? (
                    /* Quantity Controls for Equipment */
                    <div className="flex items-center gap-1 rounded-lg bg-muted">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() =>
                          onUpdateQuantity(
                            item.id,
                            undefined,
                            (item.quantity || 1) - 1
                          )
                        }
                        disabled={(item.quantity || 1) <= 1}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="min-w-[3ch] px-2 text-center text-sm font-medium">
                        {item.quantity || 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() =>
                          onUpdateQuantity(
                            item.id,
                            undefined,
                            (item.quantity || 1) + 1
                          )
                        }
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  ) : (
                    /* Duration Controls for Services */
                    <div className="flex items-center gap-1 rounded-lg bg-muted">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() =>
                          onUpdateQuantity(item.id, item.duration_hours - 1)
                        }
                        disabled={
                          item.duration_hours <=
                          (item.listing.min_booking_hours || 1)
                        }
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="min-w-[3ch] px-2 text-center text-sm font-medium">
                        {item.duration_hours}h
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() =>
                          onUpdateQuantity(item.id, item.duration_hours + 1)
                        }
                        disabled={
                          item.listing.max_booking_hours &&
                          item.duration_hours >= item.listing.max_booking_hours
                        }
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold">
                    $
                    {item.item_type === 'equipment'
                      ? (item.listing.price * (item.quantity || 1)).toFixed(2)
                      : (item.listing.price * item.duration_hours).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${item.listing.price}/
                    {item.item_type === 'equipment' ? 'day' : 'hr'}
                  </p>
                </div>
              </div>
            </div>

            {/* Remove Button */}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 self-start text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveItem(item.id)}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        ))}
      </div>

      {!isLast && <Separator className="my-6" />}
    </div>
  )
}
