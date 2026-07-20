import React, { useCallback, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Upload,
  X
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface UploadItem {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'retrying'
  progress: number
  url?: string
  error?: string
  retryCount: number
}

interface MediaUploadSectionProps {
  mediaUrls: string[]
  onMediaUrlsChange: (urls: string[] | ((prev: string[]) => string[])) => void
  maxImages?: number
}

export const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
  mediaUrls,
  onMediaUrlsChange,
  maxImages = 6
}) => {
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const processQueueRef = useRef<boolean>(false)

  const uploadSingleFile = useCallback(
    async (uploadItem: UploadItem): Promise<string> => {
      const { file } = uploadItem

      // Get authenticated user
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('Authentication required to upload images')
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size too large. Maximum size is 5MB.')
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload with timeout
      const uploadPromise = supabase.storage
        .from('listing-media')
        .upload(filePath, file)

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout')), 30000) // 30 second timeout
      })

      const { error: uploadError } = (await Promise.race([
        uploadPromise,
        timeoutPromise
      ])) as any

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('listing-media')
        .getPublicUrl(filePath)

      return data.publicUrl
    },
    []
  )

  const processUploadQueue = useCallback(async () => {
    if (processQueueRef.current) return
    processQueueRef.current = true
    setIsProcessing(true)

    const pendingItems = uploadQueue.filter(
      (item) => item.status === 'pending' || item.status === 'retrying'
    )
    const completedUrls: string[] = []

    // Process uploads with concurrency limit of 3
    const concurrencyLimit = 3
    const chunks = []
    for (let i = 0; i < pendingItems.length; i += concurrencyLimit) {
      chunks.push(pendingItems.slice(i, i + concurrencyLimit))
    }

    for (const chunk of chunks) {
      const uploadPromises = chunk.map(async (item) => {
        try {
          // Update status to uploading
          setUploadQueue((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, status: 'uploading' as const, progress: 0 }
                : i
            )
          )

          // Simulate progress
          const progressInterval = setInterval(() => {
            setUploadQueue((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? { ...i, progress: Math.min(i.progress + 15, 90) }
                  : i
              )
            )
          }, 200)

          const url = await uploadSingleFile(item)

          clearInterval(progressInterval)

          // Update to completed
          setUploadQueue((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, status: 'completed' as const, progress: 100, url }
                : i
            )
          )

          // Collect URL for batch update
          completedUrls.push(url)
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Upload failed'

          setUploadQueue((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    status: 'failed' as const,
                    error: errorMessage,
                    retryCount: i.retryCount + 1
                  }
                : i
            )
          )

          // Auto-retry up to 2 times for network errors
          if (
            item.retryCount < 2 &&
            (errorMessage.includes('timeout') || errorMessage.includes('fetch'))
          ) {
            setTimeout(
              () => {
                setUploadQueue((prev) =>
                  prev.map((i) =>
                    i.id === item.id ? { ...i, status: 'retrying' as const } : i
                  )
                )
              },
              2000 * (item.retryCount + 1)
            ) // Exponential backoff
          }
        }
      })

      // Wait for current chunk to complete before processing next
      await Promise.allSettled(uploadPromises)
    }

    // Batch update all completed URLs at once
    if (completedUrls.length > 0) {
      onMediaUrlsChange([...mediaUrls, ...completedUrls])
    }

    // Show completion toast
    const completedCount = uploadQueue.filter(
      (item) => item.status === 'completed'
    ).length
    const failedCount = uploadQueue.filter(
      (item) => item.status === 'failed' && item.retryCount >= 2
    ).length

    if (completedCount > 0) {
      toast({
        title: `${completedCount} image(s) uploaded successfully! 📸`,
        description:
          failedCount > 0
            ? `${failedCount} image(s) failed to upload.`
            : 'All images have been added to the listing.'
      })
    }

    setIsProcessing(false)
    processQueueRef.current = false
  }, [uploadQueue, uploadSingleFile, onMediaUrlsChange, mediaUrls, toast])

  const addFilesToQueue = useCallback(
    (files: File[]) => {
      const newItems: UploadItem[] = files.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        status: 'pending' as const,
        progress: 0,
        retryCount: 0
      }))

      setUploadQueue((prev) => [...prev, ...newItems])

      // Start processing if not already processing
      setTimeout(() => processUploadQueue(), 100)
    },
    [processUploadQueue]
  )

  const retryUpload = useCallback(
    (itemId: string) => {
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, status: 'pending' as const, error: undefined }
            : item
        )
      )
      setTimeout(() => processUploadQueue(), 100)
    },
    [processUploadQueue]
  )

  const removeFromQueue = useCallback((itemId: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== itemId))
  }, [])

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return

      const fileArray = Array.from(files)
      const totalSlots =
        maxImages -
        mediaUrls.length -
        uploadQueue.filter((item) => item.status !== 'failed').length

      if (fileArray.length > totalSlots) {
        toast({
          title: 'Too many images',
          description: `You can only upload ${totalSlots} more image(s).`,
          variant: 'destructive'
        })
        return
      }

      const validFiles = fileArray.filter((file) => {
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Invalid file type',
            description: `"${file.name}" is not a valid image file. Please select only JPEG, PNG, or WebP files.`,
            variant: 'destructive'
          })
          return false
        }
        return true
      })

      if (validFiles.length > 0) {
        addFilesToQueue(validFiles)
      }
    },
    [mediaUrls.length, maxImages, uploadQueue, toast, addFilesToQueue]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const removeImage = useCallback(
    (urlToRemove: string) => {
      onMediaUrlsChange(mediaUrls.filter((url) => url !== urlToRemove))
    },
    [mediaUrls, onMediaUrlsChange]
  )

  const canUploadMore =
    mediaUrls.length +
      uploadQueue.filter((item) => item.status !== 'failed').length <
    maxImages

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">
          Images ({mediaUrls.length}/{maxImages})
        </label>
        <p className="text-sm text-muted-foreground">
          Use clear, well-lit images. JPG/PNG, up to 5 MB.
        </p>
      </div>

      {/* Upload Area */}
      {canUploadMore && (
        <Card
          className="cursor-pointer border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary/50"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <CardContent className="p-8">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Upload className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Drag and drop images here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports JPEG, PNG, WebP up to 5MB each
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image-upload')?.click()}
                className="gap-2"
              >
                <ImageIcon className="size-4" />
                Select Images
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Upload Progress</h3>
          {uploadQueue.map((item) => (
            <div key={item.id} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.status === 'uploading' || item.status === 'retrying' ? (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  ) : item.status === 'completed' ? (
                    <CheckCircle className="size-4 text-green-500" />
                  ) : item.status === 'failed' ? (
                    <AlertCircle className="size-4 text-destructive" />
                  ) : (
                    <div className="size-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className="max-w-[200px] truncate text-sm font-medium">
                    {item.file.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === 'failed' && item.retryCount >= 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => retryUpload(item.id)}
                      className="size-6 p-0"
                    >
                      <RotateCcw className="size-3" />
                    </Button>
                  )}
                  {(item.status === 'failed' || item.status === 'pending') && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromQueue(item.id)}
                      className="size-6 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                  <span className="min-w-[40px] text-right text-xs text-muted-foreground">
                    {item.status === 'completed' ? '100%' : `${item.progress}%`}
                  </span>
                </div>
              </div>

              {item.status !== 'pending' && (
                <Progress
                  value={item.status === 'completed' ? 100 : item.progress}
                  className="h-1"
                />
              )}

              {item.error && (
                <p className="text-xs text-destructive">{item.error}</p>
              )}

              {item.status === 'retrying' && (
                <p className="text-xs text-muted-foreground">
                  Retrying... (attempt {item.retryCount + 1})
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Grid */}
      {mediaUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {mediaUrls.map((url, index) => (
            <div key={url} className="group relative">
              <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                <img
                  src={url}
                  alt={`Listing image ${index + 1}`}
                  className="size-full object-cover"
                />
              </div>
              {index === 0 && (
                <div className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                  Main Photo
                </div>
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute right-2 top-2 size-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => removeImage(url)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
