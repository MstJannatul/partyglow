import { Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface QuantityPickerProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
  maxQuantity: number
  className?: string
}

export function QuantityPicker({
  quantity,
  onQuantityChange,
  maxQuantity,
  className = ''
}: QuantityPickerProps) {
  return (
    <div className={`flex items-center rounded-lg bg-muted ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
        disabled={quantity <= 1}
      >
        <Minus className="size-3" />
      </Button>
      <span className="min-w-[2rem] px-2 text-center text-sm font-medium">
        {quantity}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
        disabled={quantity >= maxQuantity}
      >
        <Plus className="size-3" />
      </Button>
    </div>
  )
}
