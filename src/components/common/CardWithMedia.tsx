import React from 'react'

import { ImageGallery } from '@/components/listings/ImageGallery'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CardWithMediaProps {
  images: string[]
  alt: string
  onImageClick?: (index: number) => void
  header?: React.ReactNode
  children?: React.ReactNode // content
  footer?: React.ReactNode
  actionOverlay?: React.ReactNode // e.g., favorite button
  className?: string
}

export function CardWithMedia({
  images,
  alt,
  onImageClick,
  header,
  children,
  footer,
  actionOverlay,
  className
}: CardWithMediaProps) {
  return (
    <Card className={cn('overflow-hidden bg-card shadow-card', className)}>
      <div className="relative">
        <ImageGallery images={images} alt={alt} onImageClick={onImageClick} />
        {actionOverlay && (
          <div className="absolute right-3 top-3 z-10">{actionOverlay}</div>
        )}
      </div>

      {header}

      <CardContent className="p-4">{children}</CardContent>

      {footer && (
        <CardFooter className="border-t border-border/50 p-4 pt-0">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
