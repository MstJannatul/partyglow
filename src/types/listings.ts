import { Database } from '@/integrations/supabase/types'

export type Listing = Database['public']['Tables']['listings']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

export interface ListingWithVendor extends Listing {
  vendor: Profile
  category: Category | null
  reviews_count: number
  average_rating: number
}

export type ListingsSort =
  | 'best_match'
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'rating_desc'

export interface ListingsFilters {
  category?: string
  location?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  limit?: number
  offset?: number

  // New filters supported by optimized RPC
  rating?: number // minimum rating
  delivery_type?: string // 'pickup' | 'delivery' | 'both'
  verified_only?: boolean
  sort?: ListingsSort

  // UI-only (not used by backend yet)
  radius?: number
}
