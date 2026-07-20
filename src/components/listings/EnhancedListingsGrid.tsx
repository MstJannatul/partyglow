import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'

import { ListingCardSkeleton } from '@/components/common/ListingCardSkeleton'
import { useListings } from '@/hooks/useListings'
import { ListingFilters } from '@/pages/Browse'

import { ListingCard } from './ListingCard'

interface EnhancedListingsGridProps {
  filters: ListingFilters
}

export const EnhancedListingsGrid = ({
  filters
}: EnhancedListingsGridProps) => {
  const [page, setPage] = useState(0)
  const [allListings, setAllListings] = useState<any[]>([])
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 })

  const {
    data: listings,
    isLoading,
    error,
    refetch,
    isFetching
  } = useListings({
    ...filters,
    limit: 12,
    offset: page * 12
  })

  // Reset on filter change
  useEffect(() => {
    // TODO: will use better approach later other than setTimeout
    setTimeout(() => {
      setPage(0)
      setAllListings([])
    }, 0)
  }, [filters])

  // Add new listings to the collection
  useEffect(() => {
    if (listings) {
      // TODO: will use better approach later other than setTimeout
      setTimeout(() => {
        if (page === 0) {
          setAllListings(listings)
        } else {
          setAllListings((prev) => [...prev, ...listings])
        }
      }, 0)
    }
  }, [listings, page])

  // Load more when in view
  useEffect(() => {
    if (inView && !isLoading && listings?.length === 12) {
      // TODO: will use better approach later other than setTimeout
      setTimeout(() => {
        setPage((prev) => prev + 1)
      }, 0)
    }
  }, [inView, isLoading, listings?.length])

  if (isLoading && page === 0) {
    return (
      <ListingCardSkeleton
        count={8}
        columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      />
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-destructive">
          <svg
            className="mx-auto mb-4 size-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold">Something went wrong</h3>
          <p className="mt-2 text-muted-foreground">
            Unable to load listings. Please try again.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!allListings.length && page === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-muted-foreground">
          <svg
            className="mx-auto mb-4 size-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold">
            No results match your filters
          </h3>
          <p className="mt-2">Try clearing your filters.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {allListings.length} results
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {allListings.map((listing, index) => (
          <ListingCard key={`${listing.id}-${index}`} listing={listing} />
        ))}
      </div>

      {/* Load More Trigger */}
      {listings?.length === 12 && (
        <div ref={loadMoreRef} className="py-8">
          <ListingCardSkeleton
            count={8}
            columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          />
        </div>
      )}

      {/* End of Results */}
      {allListings.length > 0 && listings && listings.length < 12 && (
        <div className="py-8 text-center text-muted-foreground">
          <p>You've reached the end of the results</p>
        </div>
      )}
    </div>
  )
}
