import { useState } from 'react'
import {
  ArrowRight,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
  X
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import {
  useCart,
  useCartTotal,
  useRemoveFromCart,
  useUpdateCartItem
} from '@/hooks/useCart'

import { MultiVendorBookingDialog } from '../booking/MultiVendorBookingDialog'

import { CartSummary } from './CartSummary'
import { EmptyCartState } from './EmptyCartState'
import { VendorCartGroup } from './VendorCartGroup'

interface EnhancedCartDrawerProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EnhancedCartDrawer({
  open,
  onOpenChange
}: EnhancedCartDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const { user } = useAuth()
  const { data: cartItems = [], isLoading } = useCart()
  const { itemCount, totalPrice, hasItems } = useCartTotal()
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveFromCart()

  const isOpen = open !== undefined ? open : internalOpen
  const handleOpenChange = onOpenChange || setInternalOpen

  // Group cart items by vendor
  const vendorGroups = cartItems.reduce(
    (groups, item) => {
      const vendorId = item.vendor.user_id
      if (!groups[vendorId]) {
        groups[vendorId] = {
          vendor: item.vendor,
          items: [],
          totalPrice: 0
        }
      }
      groups[vendorId].items.push(item)
      const itemTotal =
        item.item_type === 'equipment'
          ? item.listing.price * (item.quantity || 1)
          : item.listing.price * item.duration_hours
      groups[vendorId].totalPrice += itemTotal
      return groups
    },
    {} as Record<string, any>
  )

  const vendorGroupsArray = Object.values(vendorGroups)

  const handleProceedToBooking = () => {
    if (hasItems) {
      setShowBookingDialog(true)
    }
  }

  const handleUpdateQuantity = (
    itemId: string,
    newDuration?: number,
    newQuantity?: number
  ) => {
    if (newDuration !== undefined && newDuration < 1) return
    if (newQuantity !== undefined && newQuantity < 1) return

    updateItem.mutate({
      itemId,
      durationHours: newDuration,
      quantity: newQuantity
    })
  }

  const handleRemoveItem = (itemId: string) => {
    removeItem.mutate(itemId)
  }

  return (
    <>
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" className="hover-scale relative">
            <ShoppingBag className="size-5" />
            {hasItems && (
              <Badge
                variant="secondary"
                className="absolute -right-1 -top-1 flex size-5 items-center justify-center p-0 text-xs font-medium"
              >
                {itemCount}
              </Badge>
            )}
          </Button>
        </DrawerTrigger>

        <DrawerContent className="flex max-h-[90vh] flex-col">
          <DrawerHeader className="h-16 shrink-0 border-b border-border">
            <div className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-2">
                <Package className="size-5 text-primary" />
                Your cart
                {hasItems && (
                  <Badge variant="outline" className="ml-2">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </DrawerTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenChange(false)}
                className="hover:bg-muted"
              >
                <X className="size-4" />
              </Button>
            </div>
          </DrawerHeader>

          {isLoading ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="text-center">
                <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Loading your cart...</p>
              </div>
            </div>
          ) : !hasItems ? (
            <div className="flex-1">
              <EmptyCartState
                onContinueShopping={() => handleOpenChange(false)}
              />
            </div>
          ) : (
            <div className="max-h-[calc(90vh-4rem)] flex-1 overflow-y-auto">
              <div className="space-y-6 p-4">
                {vendorGroupsArray.map((group, index) => (
                  <VendorCartGroup
                    key={group.vendor.user_id}
                    vendor={group.vendor}
                    items={group.items}
                    totalPrice={group.totalPrice}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    isLast={index === vendorGroupsArray.length - 1}
                  />
                ))}

                <div className="mt-6 border-t border-border pt-4">
                  <CartSummary
                    totalPrice={totalPrice}
                    itemCount={itemCount}
                    vendorCount={vendorGroupsArray.length}
                  />

                  <div className="mt-4">
                    <Button
                      onClick={handleProceedToBooking}
                      variant="gradient"
                      className="h-12 w-full text-base font-medium"
                      disabled={!hasItems || updateItem.isPending}
                    >
                      <span>Proceed to Book</span>
                      <ArrowRight className="ml-2 size-4" />
                    </Button>

                    {!user && (
                      <p className="mt-2 text-center text-xs text-muted-foreground">
                        Sign in to save your cart and complete booking
                      </p>
                    )}
                  </div>
                </div>

                <div className="h-8" />
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <MultiVendorBookingDialog
        open={showBookingDialog}
        onOpenChange={setShowBookingDialog}
        cartItems={cartItems}
        vendorGroups={vendorGroupsArray}
      />
    </>
  )
}
