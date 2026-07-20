import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageGalleryProps {
  images: string[]
  alt: string
  onImageClick?: (index: number) => void
  className?: string
}

export function ImageGallery({
  images,
  alt,
  onImageClick,
  className
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({})
  const [imageError, setImageError] = useState<Record<number, boolean>>({})
  const galleryRef = useRef<HTMLDivElement>(null)
  const thumbnailsRef = useRef<HTMLDivElement>(null)

  const hasMultipleImages = images.length > 1
  const currentImage = images[currentIndex] || '/placeholder.svg'

  const handlePrevious = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleThumbnailClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex(index)
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onImageClick?.(currentIndex)
  }

  const handleImageLoad = (index: number) => {
    setImageLoading((prev) => ({ ...prev, [index]: false }))
  }

  const handleImageError = (index: number) => {
    setImageError((prev) => ({ ...prev, [index]: true }))
    setImageLoading((prev) => ({ ...prev, [index]: false }))
  }

  // Touch handling for mobile swipe
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && hasMultipleImages) {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }
    if (isRightSwipe && hasMultipleImages) {
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    }
  }

  return (
    <div className={cn('relative group', className)}>
      {/* Main Image */}
      <div
        className="relative size-full cursor-pointer overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleImageClick}
      >
        {!imageError[currentIndex] ? (
          <img
            src={currentImage}
            alt={`${alt} - Image ${currentIndex + 1}`}
            className={cn(
              'w-full h-full object-cover transition-all duration-500 group-hover:scale-110',
              imageLoading[currentIndex] && 'opacity-0'
            )}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 100vw, 50vw"
            onLoad={() => handleImageLoad(currentIndex)}
            onError={() => handleImageError(currentIndex)}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted">
            <div className="text-center text-muted-foreground">
              <svg
                className="mx-auto mb-2 size-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm">No image</p>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {imageLoading[currentIndex] && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 hidden bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block" />

        {/* Image Count Badge */}
        {hasMultipleImages && (
          <Badge
            variant="secondary"
            className="absolute left-2 top-2 text-xs sm:left-3 sm:top-3"
          >
            {currentIndex + 1} of {images.length}
          </Badge>
        )}

        {/* View Full Size Button */}
        <Button
          onClick={handleImageClick}
          variant="secondary"
          size="sm"
          className="absolute right-2 top-2 bg-background/80 opacity-80 backdrop-blur-sm transition-opacity hover:bg-background group-hover:opacity-100 sm:right-3 sm:top-3 sm:opacity-0"
        >
          <Eye className="size-4" />
        </Button>

        {/* Navigation Arrows */}
        {hasMultipleImages && (
          <>
            <Button
              onClick={handlePrevious}
              variant="secondary"
              size="sm"
              className="absolute left-2 top-1/2 min-h-[36px] min-w-[36px] -translate-y-1/2 bg-background/80 p-1.5 opacity-60 backdrop-blur-sm transition-opacity hover:bg-background group-hover:opacity-100 sm:left-3 sm:p-2 sm:opacity-0"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              onClick={handleNext}
              variant="secondary"
              size="sm"
              className="absolute right-2 top-1/2 min-h-[36px] min-w-[36px] -translate-y-1/2 bg-background/80 p-1.5 opacity-60 backdrop-blur-sm transition-opacity hover:bg-background group-hover:opacity-100 sm:right-3 sm:p-2 sm:opacity-0"
            >
              <ChevronRight className="size-4" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {hasMultipleImages && (
        <div className="mt-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div
            ref={thumbnailsRef}
            className="scrollbar-hide flex gap-2 overflow-x-auto pb-2"
          >
            {images.map((image, index) => (
              <button
                key={index}
                onClick={(e) => handleThumbnailClick(index, e)}
                className={cn(
                  'flex-shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-all',
                  index === currentIndex
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <img
                  src={image}
                  alt={`${alt} thumbnail ${index + 1}`}
                  className="size-full object-cover"
                  loading="lazy"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dot Indicators for Mobile */}
      {hasMultipleImages && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 sm:bottom-3 md:hidden">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => handleThumbnailClick(index, e)}
              className={cn(
                'w-2 h-2 rounded-full transition-all min-h-[8px] min-w-[8px]',
                index === currentIndex ? 'bg-white shadow-lg' : 'bg-white/60'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
