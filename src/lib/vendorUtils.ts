export interface VendorInfo {
  full_name?: string | null
  business_name?: string | null
  is_verified?: boolean
}

/**
 * Gets the display name for a vendor following this hierarchy:
 * 1. business_name (if provided)
 * 2. full_name (should always exist)
 * 3. "Vendor" (fallback for null/undefined vendor only)
 */
export const getVendorDisplayName = (vendor?: VendorInfo | null): string => {
  if (!vendor) return 'Vendor'

  if (vendor.business_name?.trim()) {
    return vendor.business_name.trim()
  }

  return vendor.full_name?.trim() || 'Vendor'
}

/**
 * Gets the initials for a vendor avatar following this hierarchy:
 * 1. First letter of business_name
 * 2. First letter of full_name
 * 3. "V" (fallback)
 */
export const getVendorInitials = (vendor?: VendorInfo | null): string => {
  if (!vendor) return 'V'

  if (vendor.business_name?.trim()) {
    return vendor.business_name.trim()[0].toUpperCase()
  }

  return vendor.full_name?.trim()?.[0]?.toUpperCase() || 'V'
}

/**
 * Gets the vendor name for messaging/contact contexts where we prefer personal names
 * 1. full_name (should always exist)
 * 2. business_name (if full_name unavailable)
 * 3. "Vendor" (fallback)
 */
export const getVendorContactName = (vendor?: VendorInfo | null): string => {
  if (!vendor) return 'Vendor'

  if (vendor.full_name?.trim()) {
    return vendor.full_name.trim()
  }

  return vendor.business_name?.trim() || 'Vendor'
}
