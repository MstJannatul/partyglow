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
import { useCreateInventoryItem } from '@/hooks/useInventoryManagement'
import { useCreateListing, useUpdateListing } from '@/hooks/useListings'
import { zodResolver } from '@hookform/resolvers/zod'

import { MediaUploadSection } from '../MediaUploadSection'

const equipmentFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(1, 'Price must be greater than 0'),
  category_id: z.string().min(1, 'Please select a category'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  min_booking_hours: z
    .number()
    .min(1, 'Minimum rental must be at least 1 hour'),
  max_booking_hours: z.number().max(168, 'Maximum rental cannot exceed 1 week'),
  delivery_type: z.enum(['pickup_only', 'delivery_only', 'both']),
  initial_quantity: z
    .number()
    .min(1, 'Initial quantity must be at least 1')
    .optional(),
  media_urls: z.array(z.string()).optional()
})

type EquipmentFormData = z.infer<typeof equipmentFormSchema>

interface EquipmentListingFormProps {
  onSuccess: () => void
  onCancel: () => void
  initialData?: any
  isEditing?: boolean
}

export const EquipmentListingForm: React.FC<EquipmentListingFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  isEditing = false
}) => {
  const { user } = useAuth()
  const { data: categories } = useCategories()
  const createListing = useCreateListing()
  const updateListing = useUpdateListing()
  const createInventoryItem = useCreateInventoryItem()

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      category_id: initialData?.category_id || '',
      location: initialData?.location || '',
      min_booking_hours: initialData?.min_booking_hours || 4,
      max_booking_hours: initialData?.max_booking_hours || 24,
      delivery_type: initialData?.delivery_type || 'pickup_only',
      initial_quantity: 1,
      media_urls: initialData?.media_urls || []
    }
  })

  const onSubmit = async (data: EquipmentFormData) => {
    if (!user) return

    // Validate delivery_type before submission
    if (
      !data.delivery_type ||
      !['pickup_only', 'delivery_only', 'both'].includes(data.delivery_type)
    ) {
      console.error('Invalid delivery_type:', data.delivery_type)
      form.setError('delivery_type', {
        type: 'manual',
        message: 'Please select a valid delivery option'
      })
      return
    }

    console.log(
      'Submitting equipment listing with delivery_type:',
      data.delivery_type
    )

    try {
      if (isEditing && initialData?.id) {
        // Update existing listing
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
        // Create new listing
        const newListing = await createListing.mutateAsync({
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
          type: 'equipment',
          listing_type: 'equipment',
          is_active: true
        })

        // Create inventory item if initial quantity is provided
        if (data.initial_quantity && data.initial_quantity > 0) {
          await createInventoryItem.mutateAsync({
            listingId: newListing.id,
            vendorId: user.id,
            name: data.title,
            quantity: data.initial_quantity
          })
        }
      }
      onSuccess()
    } catch (error) {
      console.error('Failed to save equipment listing:', error)
    }
  }

  const equipmentCategories =
    categories?.filter((cat) => cat.type === 'equipment') || []

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
                    <FormLabel>Equipment Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Professional Sound System"
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
                        {equipmentCategories.map((category) => (
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
                      placeholder="Describe your equipment, specifications, condition, what's included, delivery options..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Rate ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="mobile-input-stable"
                        inputMode="decimal"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormDescription>Your rate per day</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_booking_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Rental (Hours)</FormLabel>
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
                    <FormLabel>Maximum Rental (Hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        max="168"
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

              {!isEditing && (
                <FormField
                  control={form.control}
                  name="initial_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          className="mobile-input-stable"
                          inputMode="numeric"
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormDescription>How many items?</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="San Francisco, CA"
                      {...field}
                      className="mobile-input-stable"
                      autoComplete="address-level2"
                      inputMode="text"
                    />
                  </FormControl>
                  <FormDescription>
                    Where is this equipment located?
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
                  <FormLabel>Delivery Options</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-row gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pickup_only" id="pickup" />
                        <label htmlFor="pickup" className="cursor-pointer">
                          Customer Pickup
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="delivery_only" id="delivery" />
                        <label htmlFor="delivery" className="cursor-pointer">
                          Delivery
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="both" id="both" />
                        <label htmlFor="both" className="cursor-pointer">
                          Both Options
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Choose how customers can receive this equipment
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
                    : 'Update Equipment Listing'
                  : createListing.isPending
                    ? 'Creating...'
                    : 'Create Equipment Listing'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
