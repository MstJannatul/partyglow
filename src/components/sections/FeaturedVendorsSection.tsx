import { EmptyState } from '@/components/common/EmptyState'
import { ListingCardSkeleton } from '@/components/common/ListingCardSkeleton'
import { withErrorBoundary } from '@/components/ErrorBoundary'
import { ListingCard } from '@/components/listings/ListingCard'
import { QueryGuard } from '@/components/QueryGuard'
import { useFeaturedListings } from '@/hooks/useListings'

const FeaturedVendorsSection = () => {
  const { data: listings, isLoading, error } = useFeaturedListings(3)

  return (
    <section className="bg-background py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Featured Vendors
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Discover top-rated vendors in your area
          </p>
        </div>

        <QueryGuard
          loadingFallback={
            <ListingCardSkeleton
              count={3}
              columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            />
          }
          fallback={
            <div className="py-8 text-center">
              <EmptyState
                title="Unable to load featured vendors"
                description="Please try again later."
              />
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <ListingCardSkeleton
                count={3}
                columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              />
            ) : error ? (
              <div className="col-span-full">
                <EmptyState
                  title="Unable to load featured vendors"
                  description="Please try again later."
                />
              </div>
            ) : listings && listings.length > 0 ? (
              listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState
                  title="No featured vendors"
                  description="Check back soon or browse all listings."
                />
              </div>
            )}
          </div>
        </QueryGuard>
      </div>
    </section>
  )
}

export default withErrorBoundary(FeaturedVendorsSection)
