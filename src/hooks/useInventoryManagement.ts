import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useUpdateInventoryQuantity = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      inventoryItemId,
      newQuantity
    }: {
      inventoryItemId: string
      newQuantity: number
    }) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .update({ quantity_available: newQuantity })
        .eq('id', inventoryItemId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidate and refetch inventory data
      queryClient.invalidateQueries({
        queryKey: ['inventory', data.listing_id]
      })
      toast({
        title: 'Inventory Updated',
        description: 'Quantity has been updated successfully'
      })
    },
    onError: (error) => {
      console.error('Failed to update inventory:', error)
      toast({
        title: 'Error',
        description: 'Failed to update inventory quantity',
        variant: 'destructive'
      })
    }
  })
}

export const useCreateInventoryItem = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      listingId,
      vendorId,
      name,
      quantity
    }: {
      listingId: string
      vendorId: string
      name: string
      quantity: number
    }) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          listing_id: listingId,
          vendor_id: vendorId,
          name,
          quantity_available: quantity,
          reserved_quantity: 0,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['inventory', data.listing_id]
      })
      toast({
        title: 'Inventory Created',
        description: 'Inventory item has been created successfully'
      })
    },
    onError: (error) => {
      console.error('Failed to create inventory:', error)
      toast({
        title: 'Error',
        description: 'Failed to create inventory item',
        variant: 'destructive'
      })
    }
  })
}
