import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'
import { useQuery } from '@tanstack/react-query'

type CategoryBase = Database['public']['Tables']['categories']['Row']

// Extend locally to avoid type regen dependency for new columns
export type CategoryWithHierarchy = CategoryBase & {
  parent_id?: string | null
  depth?: number | null
  slug?: string | null
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('useCategories queryFn executing')
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      console.log('useCategories queryFn result:', { count: data?.length })
      return (data || []) as unknown as CategoryWithHierarchy[]
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - shorter for Chrome
    retry: (failureCount, error) => {
      console.log('useCategories retry attempt:', {
        failureCount,
        error: (error as any)?.message
      })
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}

export const useCategory = (id: string) => {
  return useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) throw error
      return (data || null) as unknown as CategoryWithHierarchy | null
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 30 // 30 minutes
  })
}

export const useCategoryStats = () => {
  return useQuery({
    queryKey: ['category-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select(`
          id,
          name,
          type,
          listings:listings(count),
          parent_id,
          depth,
          slug
        `)

      if (error) throw error

      const categoriesWithCounts = (data || []).map((category: any) => ({
        ...category,
        listing_count: category.listings?.[0]?.count || 0
      }))

      return categoriesWithCounts
    },
    staleTime: 1000 * 60 * 15 // 15 minutes
  })
}
