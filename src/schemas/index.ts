import { z } from 'zod'

export const ListingSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  price: z.number(),
  location: z.string().nullable().optional(),
  media_urls: z.array(z.string()).nullable().optional(),
  user_id: z.string().uuid(),
  category_id: z.string().uuid().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string()
})

export const CartListingSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  price: z.number(),
  location: z.string().nullable().optional(),
  media_urls: z.array(z.string()).nullable().optional(),
  min_booking_hours: z.number().nullable().optional(),
  max_booking_hours: z.number().nullable().optional(),
  listing_type: z.string().nullable().optional()
})

export const CartItemWithListingSchema = z.object({
  id: z.string().uuid(),
  customer_id: z.string().uuid(),
  listing_id: z.string().uuid(),
  vendor_id: z.string().uuid(),
  duration_hours: z.number(),
  quantity: z.number().optional(),
  item_type: z.string(),
  reserved_until: z.string().nullable().optional(),
  added_at: z.string(),
  listing: CartListingSchema,
  vendor: z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    full_name: z.string(),
    avatar_url: z.string().nullable().optional(),
    is_verified: z.boolean().nullable().optional()
  })
})

export const MessageSchema = z.object({
  id: z.string().uuid(),
  thread_id: z.string().uuid(),
  booking_id: z.string().uuid().nullable(),
  sender_id: z.string().uuid(),
  receiver_id: z.string().uuid(),
  content: z.string(),
  sent_at: z.string(),
  seen_at: z.string().nullable(),
  is_read: z.boolean()
})

export type Listing = z.infer<typeof ListingSchema>
export type CartItemWithListing = z.infer<typeof CartItemWithListingSchema>
export type Message = z.infer<typeof MessageSchema>
