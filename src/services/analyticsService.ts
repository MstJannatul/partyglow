import { supabase } from '@/integrations/supabase/client'

export interface CustomerSpendingInsights {
  totalSpent: number
  averageBookingValue: number
  totalBookings: number
  preferredCategories: string[]
  monthlyTrends: MonthlySpending[]
}

export interface MonthlySpending {
  month: string
  amount: number
  bookings: number
}

export interface VendorBusinessMetrics {
  totalRevenue: number
  bookingsThisMonth: number
  averageRating: number
  repeatCustomerRate: number
  monthlyBookings: MonthlyBookings[]
  customerRetention: CustomerRetentionData
}

export interface MonthlyBookings {
  month: string
  bookings: number
  revenue: number
  uniqueCustomers: number
}

export interface CustomerRetentionData {
  totalCustomers: number
  repeatCustomers: number
  retentionRate: number
  averageLifetimeValue: number
}

export interface RecommendedVendor {
  vendorId: string
  fullName: string
  categoryId: string
  vendorRating: number
  totalBookings: number
}

export const analyticsService = {
  // Customer Analytics
  async getCustomerSpendingInsights(
    customerId: string
  ): Promise<CustomerSpendingInsights> {
    const { data, error } = await supabase.functions.invoke('analytics-api', {
      body: { action: 'getCustomerSpendingInsights', customerId }
    })
    if (error) throw error as any
    return data.result as CustomerSpendingInsights
  },

  async getRecommendedVendors(
    customerId: string
  ): Promise<RecommendedVendor[]> {
    const { data, error } = await supabase.functions.invoke('analytics-api', {
      body: { action: 'getRecommendedVendors', customerId }
    })
    if (error) throw error as any
    return data.result as RecommendedVendor[]
  },

  // Vendor Analytics
  async getVendorBusinessMetrics(
    vendorId: string
  ): Promise<VendorBusinessMetrics> {
    const { data, error } = await supabase.functions.invoke('analytics-api', {
      body: { action: 'getVendorBusinessMetrics', vendorId }
    })
    if (error) throw error as any
    return data.result as VendorBusinessMetrics
  }
}
