import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { useCreateListing, useUpdateListing } from '@/hooks/useListings'
import { zodResolver } from '@hookform/resolvers/zod'

import { MediaUploadSection } from '../MediaUploadSection'

const serviceFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(1, 'Price must be greater than 0'),
  category_id: z.string().min(1, 'Please select a category'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  min_booking_hours: z
    .number()
    .min(1, 'Minimum booking must be at least 1 hour'),
  max_booking_hours: z
    .number()
    .max(24, 'Maximum booking cannot exceed 24 hours'),
  delivery_type: z.enum(['pickup_only', 'delivery_only', 'both']),
  media_urls: z.array(z.string()).optional()
})

type ServiceFormData = z.infer<typeof serviceFormSchema>

interface ServiceListingFormProps {
  onSuccess: () => void
  onCancel: () => void
  initialData?: any
  isEditing?: boolean
}

export const ServiceListingForm: React.FC<ServiceListingFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const { user } = useAuth()
  const { data: categories } = useCategories()
  const createListing = useCreateListing()
  const updateListing = useUpdateListing()

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      category_id: initialData?.category_id || '',
      location: initialData?.location || '',
      min_booking_hours: initialData?.min_booking_hours || 1,
      max_booking_hours: initialData?.max_booking_hours || 8,
      delivery_type: initialData?.delivery_type || 'pickup_only',
      media_urls: initialData?.media_urls || []
    }
  })

  const onSubmit = async (data: ServiceFormData) => {
    if (!user) return

    // Validate delivery_type before submission
    if (
      !data.delivery_type ||
      !['pickup_only', 'delivery_only', 'both'].includes(data.delivery_type)
    ) {
      console.error('Invalid delivery_type:', data.delivery_type)
      form.setError('delivery_type', {
        type: 'manual',
        message: 'Please select a valid service location option'
      })
      return
    }

    console.log(
      'Submitting service listing with delivery_type:',
      data.delivery_type
    )

    try {
      if (isEditing && initialData?.id) {
        await updateListing.mutateAsync({
          id: initialData.id,
          updates: {
            title: data.title,
            description: data.description,
            price: data.price,
            category_id: data.category_id,
            location: data.location,
            min_booking_hours: data.min_booking_hours,
            max_booking_hours: data.max_booking_hours,
            delivery_type: data.delivery_type,
            media_urls: data.media_urls || []
          }
        })
      } else {
        await createListing.mutateAsync({
          title: data.title,
          description: data.description,
          price: data.price,
          category_id: data.category_id,
          location: data.location,
          min_booking_hours: data.min_booking_hours,
          max_booking_hours: data.max_booking_hours,
          delivery_type: data.delivery_type,
          media_urls: data.media_urls || [],
          user_id: user.id,
          type: 'service',
          listing_type: 'service',
          is_active: true
        })
      }
      onSuccess()
    } catch (error) {
      console.error('Failed to save service listing:', error)
    }
  }

  const serviceCategories =
    categories?.filter((cat) => cat.type === 'service') || []

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="DJ Services for Weddings"
                        {...field}
                        className="mobile-input-stable"
                        autoComplete="off"
                        inputMode="text"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your service, what's included, your experience, and what makes you special..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="150"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="mobile-input-stable"
                        inputMode="decimal"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormDescription>Your rate per hour</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_booking_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="mobile-input-stable"
                        inputMode="numeric"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_booking_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        max="24"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="mobile-input-stable"
                        inputMode="numeric"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Area</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="San Francisco Bay Area"
                      {...field}
                      className="mobile-input-stable"
                      autoComplete="address-level2"
                      inputMode="text"
                    />
                  </FormControl>
                  <FormDescription>
                    Where do you provide this service?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="delivery_type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Service Location</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-row gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="pickup_only"
                          id="service-pickup"
                        />
                        <label
                          htmlFor="service-pickup"
                          className="cursor-pointer"
                        >
                          At Your Location
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="delivery_only"
                          id="service-delivery"
                        />
                        <label
                          htmlFor="service-delivery"
                          className="cursor-pointer"
                        >
                          At My Location
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="both" id="service-both" />
                        <label
                          htmlFor="service-both"
                          className="cursor-pointer"
                        >
                          Both Options
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Where do you provide your service?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="media_urls"
              render={({ field }) => (
                <FormItem>
                  <MediaUploadSection
                    mediaUrls={field.value || []}
                    onMediaUrlsChange={field.onChange}
                    maxImages={6}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col justify-end gap-4 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createListing.isPending || updateListing.isPending}
                className="order-1 sm:order-2"
              >
                {isEditing
                  ? updateListing.isPending
                    ? 'Updating...'
                    : 'Update Service Listing'
                  : createListing.isPending
                    ? 'Creating...'
                    : 'Create Service Listing'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
