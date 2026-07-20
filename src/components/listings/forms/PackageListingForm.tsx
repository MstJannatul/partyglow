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

const packageFormSchema = z.object({
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
    .max(48, 'Maximum booking cannot exceed 48 hours'),
  delivery_type: z.enum(['pickup_only', 'delivery_only', 'both']),
  media_urls: z.array(z.string()).optional()
})

type PackageFormData = z.infer<typeof packageFormSchema>

interface PackageListingFormProps {
  onSuccess: () => void
  onCancel: () => void
  initialData?: any
  isEditing?: boolean
}

export const PackageListingForm: React.FC<PackageListingFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const { user } = useAuth()
  const { data: categories } = useCategories()
  const createListing = useCreateListing()
  const updateListing = useUpdateListing()

  const form = useForm<PackageFormData>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      category_id: initialData?.category_id || '',
      location: initialData?.location || '',
      min_booking_hours: initialData?.min_booking_hours || 4,
      max_booking_hours: initialData?.max_booking_hours || 12,
      delivery_type: initialData?.delivery_type || 'pickup_only',
      media_urls: initialData?.media_urls || []
    }
  })

  const onSubmit = async (data: PackageFormData) => {
    if (!user) return

    // Validate delivery_type before submission
    if (
      !data.delivery_type ||
      !['pickup_only', 'delivery_only', 'both'].includes(data.delivery_type)
    ) {
      console.error('Invalid delivery_type:', data.delivery_type)
      form.setError('delivery_type', {
        type: 'manual',
        message: 'Please select a valid package delivery option'
      })
      return
    }

    console.log(
      'Submitting package listing with delivery_type:',
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
            media_urls: data.media_urls || [],
            is_package: true // Ensure package flag is maintained
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
          listing_type: 'service', // Use 'service' as the base type
          type: 'package' as const, // Required enum field
          is_package: true, // Mark as package
          is_active: true,
          is_taxable: true // Add required field
        })
      }
      onSuccess()
    } catch (error) {
      console.error('Failed to save package listing:', error)
    }
  }

  const packageCategories =
    categories?.filter(
      (cat) => cat.type === 'service' || cat.type === 'equipment'
    ) || []

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
                    <FormLabel>Package Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Complete Wedding DJ Package"
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
                        {packageCategories.map((category) => (
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
                  <FormLabel>Package Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what's included in this package, services provided, equipment included, special features..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    List all services, equipment, and extras included in this
                    package deal
                  </FormDescription>
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
                    <FormLabel>Package Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="800"
                        {...field}
                        onChange={(e) => {
                          const { value } = e.target
                          // Handle empty input or prevent leading zeros
                          if (value === '' || value === '0') {
                            field.onChange(0)
                          } else {
                            field.onChange(Number(value))
                          }
                        }}
                        onFocus={(e) => {
                          // Clear default 0 value when focused
                          if (e.target.value === '0') {
                            e.target.value = ''
                          }
                        }}
                        className="mobile-input-stable"
                        inputMode="decimal"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormDescription>Total package price</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_booking_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Duration (Hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => {
                          const { value } = e.target
                          if (value === '' || value === '0') {
                            field.onChange(1)
                          } else {
                            field.onChange(Number(value))
                          }
                        }}
                        onFocus={(e) => {
                          if (e.target.value === '0') {
                            e.target.value = ''
                          }
                        }}
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
                    <FormLabel>Maximum Duration (Hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        max="48"
                        {...field}
                        onChange={(e) => {
                          const { value } = e.target
                          if (value === '' || value === '0') {
                            field.onChange(12)
                          } else {
                            field.onChange(Number(value))
                          }
                        }}
                        onFocus={(e) => {
                          if (e.target.value === '0') {
                            e.target.value = ''
                          }
                        }}
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
                    Where do you provide this package?
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
                  <FormLabel>Package Delivery</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-row gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="pickup_only"
                          id="package-pickup"
                        />
                        <label
                          htmlFor="package-pickup"
                          className="cursor-pointer"
                        >
                          Customer Pickup
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="delivery_only"
                          id="package-delivery"
                        />
                        <label
                          htmlFor="package-delivery"
                          className="cursor-pointer"
                        >
                          We Deliver
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="both" id="package-both" />
                        <label
                          htmlFor="package-both"
                          className="cursor-pointer"
                        >
                          Both Options
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    How will customers receive this package?
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
                    : 'Update Package Listing'
                  : createListing.isPending
                    ? 'Creating...'
                    : 'Create Package Listing'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
