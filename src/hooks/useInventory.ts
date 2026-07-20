import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'

export const useInventory = (listingId: string) => {
  return useQuery({
    queryKey: ['inventory', listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('listing_id', listingId)
        .eq('is_active', true)

      if (error) throw error
      return data || []
    },
    enabled: !!listingId
  })
}

export const useInventoryAvailability = (listingId: string) => {
  const { data: inventory } = useInventory(listingId)

  const totalStock =
    inventory?.reduce((sum, item) => sum + item.quantity_available, 0) || 0
  const availableStock =
    inventory?.reduce(
      (sum, item) => sum + (item.quantity_available - item.reserved_quantity),
      0
    ) || 0

  return {
    totalStock,
    availableStock,
    isOutOfStock: availableStock === 0,
    isLowStock: availableStock > 0 && availableStock <= 3,
    hasInventory: !!inventory?.length
  }
}
