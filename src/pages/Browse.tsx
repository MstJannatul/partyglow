import { useState } from 'react'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import { CategoryPills } from '@/components/listings/CategoryPills'
import { EnhancedListingsGrid } from '@/components/listings/EnhancedListingsGrid'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchFilters } from '@/components/search/SearchFilters'
import { SortSelect } from '@/components/search/SortSelect'
import { SEO } from '@/lib/seo'
import type { ListingsSort } from '@/types/listings'

export interface ListingFilters {
  category?: string
  location?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  radius?: number
  rating?: number
  verified_only?: boolean
  delivery_type?: string
  sort?: ListingsSort
}

const Browse = () => {
  const [filters, setFilters] = useState<ListingFilters>({})
  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (newFilters: Partial<ListingFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  const activeFilterCount = Object.keys(filters).filter(
    (key) => (filters as any)[key] !== undefined && (filters as any)[key] !== ''
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <SEO
        title="Browse Party Supplies & Services | PartyGo"
        description="Find everything for your perfect party - equipment rentals, decorations, catering, entertainment, and more from verified professionals."
        canonicalPath="/browse"
        ogImagePath="/placeholder.svg"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Browse Party Supplies & Services',
          description:
            'Find everything for your perfect party - equipment rentals, decorations, catering, entertainment, and more from verified professionals.',
          url:
            typeof window !== 'undefined'
              ? `${window.location.origin}/browse`
              : '/browse'
        }}
      />
      <Header />

      <main id="main-content" className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="mb-6 text-center">
            <h1 className="mb-2 bg-gradient-to-r from-pastel-blue to-secondary bg-clip-text text-4xl font-bold text-transparent">
              Browse Party Supplies & Services
            </h1>
            <p className="text-lg text-muted-foreground">
              Find everything you need for your perfect party
            </p>
          </div>

          {/* Search Bar */}
          <SearchBar
            onSearch={(search) => handleFilterChange({ search })}
            placeholder="Search for party supplies, services, or vendors..."
          />
        </div>

        {/* Category Pills */}
        <ErrorBoundary>
          <CategoryPills
            selectedCategory={filters.category}
            onCategorySelect={(category) => handleFilterChange({ category })}
          />
        </ErrorBoundary>

        {/* Filter Bar */}
        <div className="mb-6 flex flex-col gap-3 rounded-lg border bg-card/50 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 transition-colors hover:bg-primary/20"
            >
              <svg
                className="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex items-center sm:ml-auto">
            <SortSelect
              value={filters.sort}
              onChange={(value) => handleFilterChange({ sort: value })}
            />
          </div>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="mb-6">
            <SearchFilters
              filters={filters}
              onFiltersChange={handleFilterChange}
            />
          </div>
        )}

        {/* Listings Grid */}
        <ErrorBoundary>
          <EnhancedListingsGrid filters={filters} />
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
  )
}

export default Browse
