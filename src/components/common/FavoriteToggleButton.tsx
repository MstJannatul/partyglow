import React from 'react'
import { Heart } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useIsFavorited, useToggleFavorite } from '@/hooks/useFavorites'
import { cn } from '@/lib/utils'

interface FavoriteToggleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  listingId: string
  className?: string
}

export function FavoriteToggleButton({
  listingId,
  className,
  ...props
}: FavoriteToggleButtonProps) {
  const { data: isFavorited = false } = useIsFavorited(listingId)
  const toggleFavorite = useToggleFavorite()

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite.mutate({ listingId, isFavorited })
    props.onClick?.(e)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      onClick={onClick}
      className={cn(
        'rounded-full bg-background/80 backdrop-blur-sm hover:bg-background',
        className
      )}
    >
      <Heart
        className={cn(
          'w-4 h-4 transition-colors',
          isFavorited
            ? 'text-destructive'
            : 'text-muted-foreground hover:text-destructive'
        )}
      />
    </Button>
  )
}
