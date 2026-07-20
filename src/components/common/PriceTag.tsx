import React from 'react'

interface PriceTagProps {
  price: number
  listingType?: 'service' | 'equipment' | string | null
  className?: string
}

export function PriceTag({ price, listingType, className }: PriceTagProps) {
  const unit = listingType === 'service' ? 'event' : 'day'
  return (
    <div className={className}>
      <span className="text-lg font-bold text-primary">${price}</span>
      <span className="ml-1 text-sm text-muted-foreground">/ {unit}</span>
    </div>
  )
}
