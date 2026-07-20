import React from 'react'
import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'

interface RatingDisplayProps {
  rating: number
  count?: number
  size?: 'sm' | 'md'
  className?: string
}

export function RatingDisplay({
  rating,
  count = 0,
  size = 'sm',
  className
}: RatingDisplayProps) {
  const formatted = Number.isFinite(rating) ? rating.toFixed(1) : '0.0'
  const iconSize = size === 'md' ? 'w-4 h-4' : 'w-3 h-3'
  const textSize = size === 'md' ? 'text-sm' : 'text-xs'

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Star className={cn(iconSize, 'text-primary fill-primary')} />
      <span className={cn(textSize, 'text-muted-foreground')}>
        {formatted} ({count})
      </span>
    </div>
  )
}
