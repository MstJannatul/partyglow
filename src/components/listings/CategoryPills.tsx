import { useMemo } from 'react'
import {
  Cake,
  Camera,
  Gamepad2,
  Grid2x2,
  Headphones,
  LucideIcon,
  Sparkles,
  Tent,
  UtensilsCrossed
} from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { CategoryWithHierarchy } from '@/hooks/useCategories'
import { useTopCategories } from '@/hooks/useTopCategories'
import { cn } from '@/lib/utils'

interface CategoryPillsProps {
  selectedCategory?: string
  onCategorySelect: (category?: string) => void
}

interface CuratedCategory {
  key: string
  label: string
  Icon: LucideIcon
  pillClass: string // pastel class
  aliases: string[]
}

const curatedConfig: CuratedCategory[] = [
  {
    key: 'equipment-all',
    label: 'Equipment',
    Icon: Tent,
    pillClass: 'pill-mint',
    aliases: ['party-rentals-equipment', 'rentals', 'equipment']
  },
  {
    key: 'services-all',
    label: 'Services',
    Icon: Cake,
    pillClass: 'pill-lemon',
    aliases: [
      'event-services',
      'dj-services',
      'catering',
      'photography',
      'services'
    ]
  },
  {
    key: 'e00e37a1-7dcc-4141-8fa4-d6d4684b6c09',
    label: 'Photography',
    Icon: Camera,
    pillClass: 'pill-sky',
    aliases: ['photography', 'event-photography', 'wedding-photography']
  },
  {
    key: 'ada54aaf-3c1f-4cd4-a402-7190e2da5882',
    label: 'DJ Services',
    Icon: Headphones,
    pillClass: 'pill-blue',
    aliases: ['dj-services', 'party-dj', 'wedding-dj']
  },
  {
    key: 'e593c860-82a9-42f2-a8d0-9e6fbdc87f32',
    label: 'Catering',
    Icon: UtensilsCrossed,
    pillClass: 'pill-peach',
    aliases: ['catering', 'party-catering', 'wedding-catering']
  },
  {
    key: '55555555-5555-5555-5555-555555555555',
    label: 'Decor',
    Icon: Sparkles,
    pillClass: 'pill-lavender',
    aliases: ['decor-styling', 'decor']
  },
  {
    key: '66666666-6666-6666-6666-666666666666',
    label: 'Activities',
    Icon: Gamepad2,
    pillClass: 'pill-pink',
    aliases: ['activities-attractions', 'activities']
  }
]

export const CategoryPills = ({
  selectedCategory,
  onCategorySelect
}: CategoryPillsProps) => {
  const { data: categories, isLoading, error, refetch } = useTopCategories()

  // Debug logging for Chrome issues
  console.log('CategoryPills render:', {
    categoriesCount: categories?.length,
    isLoading,
    error: (error as any)?.message,
    selectedCategory
  })

  const getCategoryKey = (name: string) =>
    name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  const matchCategory = (c: CategoryWithHierarchy, aliasSet: Set<string>) => {
    const slug = (c as any).slug as string | null
    const nameKey = getCategoryKey(c.name)
    return (slug && aliasSet.has(slug)) || aliasSet.has(nameKey)
  }

  // Equipment category IDs - these are all the equipment-related categories
  const equipmentCategoryIds = [
    '44444444-4444-4444-4444-444444444444', // Party Rentals & Equipment
    '6b31f3aa-1966-4f36-939d-42d631632feb', // Tables & Chairs
    '56e9d10d-1e8d-4591-80bc-35371fc6e75f', // Tents & Canopies
    'e202fb45-b506-46fe-b3e6-73eaadb3548e', // Sound Equipment
    '91beec4c-9879-4145-ae0f-8bb487cd815b', // Lighting
    '5c7cb286-81fa-473a-9d22-812b2b3a23cd', // Generators
    'c47ecd4e-e963-46a8-9e45-b5cd61c847fd', // Heating & Cooling
    'f5a1b06f-c96f-490d-95a5-ea8156244b7e', // Kitchen & Serving
    'e8910a4e-a30d-4152-a526-64cffff39cd4', // Stages & Flooring
    'b1a71b6a-3bd8-4629-a584-f7a0bededaf8' // Trash & Cleaning
  ]

  const { roots, childrenByParent, activeRootId, curatedRoots } =
    useMemo(() => {
      const list = (categories || []) as CategoryWithHierarchy[]
      const roots = list.filter((c) => !c.parent_id)

      const childrenByParent = list.reduce<
        Record<string, CategoryWithHierarchy[]>
      >((acc, c) => {
        if (c.parent_id) {
          if (!acc[c.parent_id]) acc[c.parent_id] = []
          acc[c.parent_id].push(c)
        }
        return acc
      }, {})

      // Determine active root: either selected root or parent of selected child
      // Don't set activeRootId for special filters like 'equipment-all', 'services-all', or undefined
      const selected = list.find((c) => c.id === selectedCategory)
      const activeRootId =
        selectedCategory && !selectedCategory.includes('-all') && selected
          ? selected.parent_id
            ? selected.parent_id
            : selected.id
          : undefined

      // Build curated roots respecting the configured order and aliases
      const curatedRoots = curatedConfig
        .map((cfg) => {
          // For special keys like 'equipment-all' and 'services-all', we don't need a real category match
          if (cfg.key === 'equipment-all' || cfg.key === 'services-all') {
            return { cfg, category: null }
          }

          const aliasSet = new Set(cfg.aliases.map((a) => getCategoryKey(a)))
          const found = roots.find((c) => matchCategory(c, aliasSet))
          return found ? { cfg, category: found } : null
        })
        .filter(Boolean) as {
        cfg: CuratedCategory
        category: CategoryWithHierarchy | null
      }[]

      // Sort children by sort_order then name for stability
      Object.values(childrenByParent).forEach((arr) =>
        arr.sort((a, b) => {
          const aSort = (a as any).sort_order || 0
          const bSort = (b as any).sort_order || 0
          if (aSort !== bSort) return aSort - bSort
          return a.name.localeCompare(b.name)
        })
      )

      return { roots, childrenByParent, activeRootId, curatedRoots }
    }, [categories, selectedCategory])

  if (isLoading) {
    return (
      <div className="mb-6 flex gap-2 overflow-x-auto pb-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 flex-shrink-0 rounded-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
        <p className="mb-2 text-sm text-destructive">
          Failed to load categories
        </p>
        <button
          onClick={() => refetch()}
          className="rounded bg-destructive/20 px-3 py-1 text-xs hover:bg-destructive/30"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="mb-6 space-y-3">
      {/* Root Categories Row */}
      <div className="relative">
        {/* Edge gradients */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"
        />

        <div
          className="category-scroll scrollbar-hide flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-2"
          role="listbox"
          aria-label="Browse categories"
        >
          {/* All Categories Pill */}
          <button
            onClick={() => onCategorySelect(undefined)}
            role="option"
            aria-selected={!selectedCategory}
            className={cn(
              'category-pill flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 whitespace-nowrap flex-shrink-0 hover:scale-105',
              !selectedCategory
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-background text-foreground border-border hover:bg-muted'
            )}
          >
            <Grid2x2 className="size-4" aria-hidden="true" />
            <span className="font-medium">All</span>
          </button>

          {/* Curated Root Pills */}
          {curatedRoots.map(({ cfg, category }) => {
            // Determine if this pill should be highlighted
            const isEquipmentPill = cfg.key === 'equipment-all'
            const isServicesPill = cfg.key === 'services-all'
            const isEquipmentSelected =
              isEquipmentPill && selectedCategory === 'equipment-all'
            const isServicesSelected =
              isServicesPill && selectedCategory === 'services-all'
            const isRegularCategorySelected =
              !isEquipmentPill &&
              !isServicesPill &&
              selectedCategory === category?.id
            const isRootSelected =
              isEquipmentSelected ||
              isServicesSelected ||
              isRegularCategorySelected

            const { Icon } = cfg
            return (
              <button
                key={category?.id || cfg.key}
                onClick={() => {
                  if (isEquipmentPill) {
                    // Special handling for Equipment - pass 'equipment-all' to indicate multi-category search
                    onCategorySelect(
                      isEquipmentSelected ? undefined : 'equipment-all'
                    )
                  } else if (isServicesPill) {
                    // Special handling for Services - pass 'services-all' to indicate multi-category search
                    onCategorySelect(
                      isServicesSelected ? undefined : 'services-all'
                    )
                  } else {
                    onCategorySelect(
                      isRootSelected && selectedCategory === category?.id
                        ? undefined
                        : category.id
                    )
                  }
                }}
                role="option"
                aria-selected={isRootSelected}
                className={cn(
                  'category-pill flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 whitespace-nowrap flex-shrink-0 hover:scale-105',
                  isRootSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                    : cn(
                        'bg-background text-foreground border-border hover:bg-muted',
                        cfg.pillClass
                      )
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="font-medium">{cfg.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Subcategories Row (shown when a root is active and has children) */}
      {activeRootId && childrenByParent[activeRootId]?.length > 0 && (
        <div className="scrollbar-hide -mt-1 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-3 pt-1">
          {childrenByParent[activeRootId].map((child) => {
            const isSelected = selectedCategory === child.id
            return (
              <button
                key={child.id}
                onClick={() =>
                  onCategorySelect(isSelected ? activeRootId : child.id)
                }
                className={cn(
                  'category-pill text-xs md:text-sm flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full border transition-colors whitespace-nowrap flex-shrink-0',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow'
                    : 'bg-background text-foreground border-border hover:bg-muted'
                )}
                aria-label={`Subcategory ${child.name}`}
                role="option"
                aria-selected={isSelected}
              >
                <span className="font-medium">{child.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
