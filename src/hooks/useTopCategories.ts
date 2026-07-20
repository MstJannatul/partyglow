import { CategoryWithHierarchy } from '@/hooks/useCategories'
import { supabase } from '@/integrations/supabase/client'
import { useQuery } from '@tanstack/react-query'

export const useTopCategories = () => {
  return useQuery({
    queryKey: ['top-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id,name,slug,parent_id,sort_order,type')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      return (data || []) as unknown as CategoryWithHierarchy[]
    },
    staleTime: 1000 * 60 * 10
  })
}
