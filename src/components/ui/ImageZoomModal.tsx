import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface ImageZoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  images: string[]
  initialIndex?: number
  alt: string
}

export function ImageZoomModal({
  open,
  onOpenChange,
  images,
  initialIndex = 0,
  alt
}: ImageZoomModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({})
  const [imageError, setImageError] = useState<Record<number, boolean>>({})

  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const hasMultipleImages = images.length > 1
  const currentImage = images[currentIndex] || '/placeholder.svg'

  // Reset zoom and position when image changes
  // TODO: will use better approach later other than setTimeout
  useEffect(() => {
    setTimeout(() => {
      setZoom(1)
      setPosition({ x: 0, y: 0 })
    }, 0)
  }, [currentIndex])

  // Update current index when initialIndex changes
  useEffect(() => {
    if (open && initialIndex !== currentIndex) {
      setTimeout(() => {
        setCurrentIndex(initialIndex)
      }, 0)
    }
  }, [open, initialIndex, currentIndex])

  const handlePrevious = useCallback(() => {
    if (!hasMultipleImages) return
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [hasMultipleImages, images.length])

  const handleNext = useCallback(() => {
    if (!hasMultipleImages) return
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [hasMultipleImages, images.length])

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev * 1.5, 5))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev / 1.5, 0.5))
  }, [])

  const handleResetZoom = useCallback(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case 'Escape':
          onOpenChange(false)
          break
        case 'ArrowLeft':
          e.preventDefault()
          handlePrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          handleNext()
          break
        case '+':
        case '=':
          e.preventDefault()
          handleZoomIn()
          break
        case '-':
          e.preventDefault()
          handleZoomOut()
          break
        case '0':
          e.preventDefault()
          handleResetZoom()
          break
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    open,
    handlePrevious,
    handleNext,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    onOpenChange
  ])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((prev) => Math.max(0.5, Math.min(5, prev * delta)))
  }

  // Mouse drag handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch handling for mobile
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null
  )
  const [touchDistance, setTouchDistance] = useState<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - pan or navigate
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    } else if (e.touches.length === 2) {
      // Multi-touch - zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      setTouchDistance(distance)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()

    if (e.touches.length === 2 && touchDistance) {
      // Pinch zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const scale = distance / touchDistance
      setZoom((prev) => Math.max(0.5, Math.min(5, prev * scale)))
      setTouchDistance(distance)
    } else if (e.touches.length === 1 && touchStart && zoom > 1) {
      // Pan when zoomed
      const deltaX = e.touches[0].clientX - touchStart.x
      const deltaY = e.touches[0].clientY - touchStart.y
      setPosition((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setTouchStart(null)
      setTouchDistance(null)
    }
  }

  const handleImageLoad = (index: number) => {
    setImageLoading((prev) => ({ ...prev, [index]: false }))
  }

  const handleImageError = (index: number) => {
    setImageError((prev) => ({ ...prev, [index]: true }))
    setImageLoading((prev) => ({ ...prev, [index]: false }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen max-h-none w-screen max-w-none border-0 bg-black/95 p-0">
        <div className="relative flex size-full items-center justify-center">
          {/* Close Button */}
          <Button
            onClick={() => onOpenChange(false)}
            variant="secondary"
            size="sm"
            className="absolute right-4 top-4 z-10 bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <X className="size-4" />
          </Button>

          {/* Image Counter */}
          {hasMultipleImages && (
            <div className="absolute left-4 top-4 z-10 rounded-md bg-background/80 px-3 py-1 text-sm font-medium backdrop-blur-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Zoom Controls */}
          <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-2">
            <Button
              onClick={handleZoomOut}
              variant="secondary"
              size="sm"
              className="bg-background/80 backdrop-blur-sm hover:bg-background"
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="size-4" />
            </Button>
            <Button
              onClick={handleResetZoom}
              variant="secondary"
              size="sm"
              className="bg-background/80 backdrop-blur-sm hover:bg-background"
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button
              onClick={handleZoomIn}
              variant="secondary"
              size="sm"
              className="bg-background/80 backdrop-blur-sm hover:bg-background"
              disabled={zoom >= 5}
            >
              <ZoomIn className="size-4" />
            </Button>
          </div>

          {/* Navigation Arrows */}
          {hasMultipleImages && (
            <>
              <Button
                onClick={handlePrevious}
                variant="secondary"
                size="sm"
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 bg-background/80 p-3 backdrop-blur-sm hover:bg-background"
              >
                <ChevronLeft className="size-6" />
              </Button>
              <Button
                onClick={handleNext}
                variant="secondary"
                size="sm"
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 bg-background/80 p-3 backdrop-blur-sm hover:bg-background"
              >
                <ChevronRight className="size-6" />
              </Button>
            </>
          )}

          {/* Main Image */}
          <div
            ref={containerRef}
            className="flex size-full cursor-grab items-center justify-center overflow-hidden active:cursor-grabbing"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {!imageError[currentIndex] ? (
              <img
                ref={imageRef}
                src={currentImage}
                alt={`${alt} - Image ${currentIndex + 1}`}
                className={cn(
                  'max-w-full max-h-full object-contain transition-transform duration-200 select-none',
                  imageLoading[currentIndex] && 'opacity-0'
                )}
                style={{
                  transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
                  transformOrigin: 'center'
                }}
                onLoad={() => handleImageLoad(currentIndex)}
                onError={() => handleImageError(currentIndex)}
                draggable={false}
              />
            ) : (
              <div className="text-center text-white">
                <svg
                  className="mx-auto mb-4 size-16"
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
                <p>Failed to load image</p>
              </div>
            )}

            {/* Loading Indicator */}
            {imageLoading[currentIndex] && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="size-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>

          {/* Mobile Instructions */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-sm text-white/70 md:hidden">
            <p>Pinch to zoom • Swipe to navigate</p>
          </div>

          {/* Desktop Instructions */}
          <div className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 text-center text-sm text-white/70 md:block">
            <p>
              Scroll to zoom • Drag to pan • Arrow keys to navigate • ESC to
              close
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
