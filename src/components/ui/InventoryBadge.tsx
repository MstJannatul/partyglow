import { AlertTriangle, Package } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

interface InventoryBadgeProps {
  availableStock: number
  isLowStock: boolean
  isOutOfStock: boolean
  className?: string
}

export function InventoryBadge({
  availableStock,
  isLowStock,
  isOutOfStock,
  className = ''
}: InventoryBadgeProps) {
  if (isOutOfStock) {
    return (
      <Badge variant="destructive" className={`text-xs ${className}`}>
        <AlertTriangle className="mr-1 size-3" />
        Out of Stock
      </Badge>
    )
  }

  if (isLowStock) {
    return (
      <Badge
        variant="secondary"
        className={`bg-orange-100 text-xs text-orange-800 ${className}`}
      >
        <Package className="mr-1 size-3" />
        {availableStock} left
      </Badge>
    )
  }

  return null
}
