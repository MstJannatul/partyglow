export const queryKeys = {
  // Listings
  listings: (filters: Record<string, any> = {}) =>
    ['listings', filters] as const,
  listing: (id: string) => ['listing', id] as const,
  featuredListings: (limit: number) => ['featured-listings', limit] as const,

  // Vendor
  vendorListings: (userId?: string) => ['vendor-listings', userId] as const,

  // Cart
  cart: (userId?: string) => ['cart', userId] as const,
  cartTotals: (signature: string) => ['cartTotals', signature] as const,

  // Favorites
  favorites: (userId?: string) => ['favorites', userId] as const,
  favorite: (listingId: string, userId?: string) =>
    ['favorite', listingId, userId] as const,
  favoriteListings: (userId?: string) => ['favorite-listings', userId] as const,

  // Messages
  messages: (threadId?: string) => ['messages', threadId] as const,
  messageThreads: (userId?: string) => ['message-threads', userId] as const
}
