import { InfoIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface CartSummaryProps {
  totalPrice: number
  itemCount: number
  vendorCount: number
}

export function CartSummary({
  totalPrice,
  itemCount,
  vendorCount
}: CartSummaryProps) {
  const platformFee = totalPrice * 0.05 // 5% platform fee
  const estimatedTax = totalPrice * 0.08 // 8% estimated tax
  const grandTotal = totalPrice + platformFee + estimatedTax

  return (
    <div className="space-y-3 p-4">
      {/* Multi-vendor notice */}
      {vendorCount > 1 && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <InfoIcon className="size-4 flex-shrink-0 text-blue-600" />
          <div className="text-sm">
            <p className="font-medium text-blue-800">Multi-vendor booking</p>
            <p className="text-blue-600">
              Coordinating {itemCount} items from {vendorCount} vendors
            </p>
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>
            Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})
          </span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-1">
            Platform fee
            <Badge variant="outline" className="text-xs">
              5%
            </Badge>
          </span>
          <span>${platformFee.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Estimated tax</span>
          <span>${estimatedTax.toFixed(2)}</span>
        </div>

        <Separator />

        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-primary">${grandTotal.toFixed(2)}</span>
        </div>

        <p className="text-xs text-muted-foreground">Taxes are estimated.</p>
      </div>
    </div>
  )
}
