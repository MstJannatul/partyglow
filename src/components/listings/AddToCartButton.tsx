import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useAddToCart } from '@/hooks/useCart'

interface AddToCartButtonProps {
  listing: any
  vendorId: string
  duration?: number
  quantity?: number
  className?: string
}

export function AddToCartButton({
  listing,
  vendorId,
  duration = 1,
  quantity = 1,
  className = ''
}: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const addToCart = useAddToCart()

  const isEquipment = listing.listing_type === 'equipment'
  const isDisabled = isAdding || addToCart.isPending

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your cart.',
        variant: 'destructive'
      })
      return
    }

    setIsAdding(true)

    try {
      const params = isEquipment
        ? {
            listingId: listing.id,
            vendorId: vendorId,
            quantity: quantity,
            itemType: 'equipment',
            durationHours: 24 // Default 1 day for equipment
          }
        : {
            listingId: listing.id,
            vendorId: vendorId,
            durationHours: duration,
            itemType: 'service'
          }

      await addToCart.mutateAsync(params)

      toast({
        title: 'Added to cart',
        description: `${listing.title} has been added to your cart.`
      })
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast({
        title: 'Failed to add to cart',
        description: 'Please try again.',
        variant: 'destructive'
      })
    }

    setIsAdding(false)
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={className}
      size="sm"
    >
      {isAdding ? (
        <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        <>
          <ShoppingCart className="mr-2 size-4" />
          Add to Cart
        </>
      )}
    </Button>
  )
}
