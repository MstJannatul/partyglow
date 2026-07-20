import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MonthlySpending {
  month: string;
  amount: number;
  bookings: number;
}

interface CustomerSpendingInsights {
  totalSpent: number;
  averageBookingValue: number;
  totalBookings: number;
  preferredCategories: string[];
  monthlyTrends: MonthlySpending[];
}

interface RecommendedVendor {
  vendorId: string;
  fullName: string;
  categoryId: string;
  vendorRating: number;
  totalBookings: number;
}

interface VendorBusinessMetrics {
  totalRevenue: number;
  bookingsThisMonth: number;
  averageRating: number;
  repeatCustomerRate: number;
  monthlyBookings: { month: string; bookings: number; revenue: number; uniqueCustomers: number }[];
  customerRetention: { totalCustomers: number; repeatCustomers: number; retentionRate: number; averageLifetimeValue: number };
}

type Action = "getCustomerSpendingInsights" | "getRecommendedVendors" | "getVendorBusinessMetrics";

type RequestBody =
  | { action: "getCustomerSpendingInsights"; customerId: string }
  | { action: "getRecommendedVendors"; customerId: string }
  | { action: "getVendorBusinessMetrics"; vendorId: string };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase env config" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
  });

  try {
    const body = (await req.json()) as RequestBody;

    switch (body.action as Action) {
      case "getCustomerSpendingInsights": {
        const result = await getCustomerSpendingInsights(supabase, body.customerId);
        return json({ result });
      }
      case "getRecommendedVendors": {
        const result = await getRecommendedVendors(supabase, body.customerId);
        return json({ result });
      }
      case "getVendorBusinessMetrics": {
        const result = await getVendorBusinessMetrics(supabase, body.vendorId);
        return json({ result });
      }
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (error) {
    console.error("analytics-api error", error);
    return json({ error: (error as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getCustomerSpendingInsights(supabase: any, customerId: string): Promise<CustomerSpendingInsights> {
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      `total_price, created_at, listing:listings(category_id, categories(name))`
    )
    .eq("customer_id", customerId)
    .eq("status", "completed");
  if (error) throw error;

  const totalSpent = bookings?.reduce((sum: number, b: any) => sum + (b.total_price || 0), 0) || 0;
  const totalBookings = bookings?.length || 0;
  const averageBookingValue = totalBookings > 0 ? totalSpent / totalBookings : 0;

  const categoryCount: Record<string, number> = {};
  bookings?.forEach((b: any) => {
    const categoryName = b.listing?.categories?.name;
    if (categoryName) categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
  });
  const preferredCategories = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k]) => k);

  const monthly: Record<string, { amount: number; bookings: number }> = {};
  bookings?.forEach((b: any) => {
    const month = new Date(b.created_at).toISOString().slice(0, 7);
    monthly[month] = monthly[month] || { amount: 0, bookings: 0 };
    monthly[month].amount += b.total_price || 0;
    monthly[month].bookings += 1;
  });
  const monthlyTrends: MonthlySpending[] = Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, amount: data.amount, bookings: data.bookings }));

  return { totalSpent, averageBookingValue, totalBookings, preferredCategories, monthlyTrends };
}

async function getRecommendedVendors(supabase: any, customerId: string): Promise<RecommendedVendor[]> {
  const { data: customerBookings, error: bookingsErr } = await supabase
    .from("bookings")
    .select("listing:listings(category_id)")
    .eq("customer_id", customerId)
    .eq("status", "completed");
  if (bookingsErr) throw bookingsErr;

  const preferredCategories = [
    ...new Set((customerBookings?.map((b: any) => b.listing?.category_id).filter(Boolean) as string[]) || []),
  ];
  if (preferredCategories.length === 0) return [];

  const { data: vendors, error: vendorsErr } = await supabase
    .from("profiles")
    .select(
      `user_id, full_name, listings(category_id, bookings!inner(id, vendor_id))`
    )
    .eq("role", "vendor")
    .neq("user_id", customerId);
  if (vendorsErr) throw vendorsErr;

  const vendorIds = vendors?.map((v: any) => v.user_id) || [];
  const { data: reviews, error: reviewsErr } = await supabase
    .from("reviews")
    .select("reviewed_user_id, rating")
    .in("reviewed_user_id", vendorIds);
  if (reviewsErr) throw reviewsErr;

  const vendorData: RecommendedVendor[] = [];
  vendors?.forEach((vendor: any) => {
    const vendorReviews = (reviews || []).filter((r: any) => r.reviewed_user_id === vendor.user_id);
    const averageRating = vendorReviews.length > 0
      ? vendorReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / vendorReviews.length
      : 0;

    vendor.listings?.forEach((listing: any) => {
      if (preferredCategories.includes(listing.category_id)) {
        vendorData.push({
          vendorId: vendor.user_id,
          fullName: vendor.full_name,
          categoryId: listing.category_id,
          vendorRating: averageRating,
          totalBookings: (listing.bookings?.length || 0),
        });
      }
    });
  });

  return vendorData.sort((a, b) => b.vendorRating - a.vendorRating).slice(0, 10);
}

async function getVendorBusinessMetrics(supabase: any, vendorId: string): Promise<VendorBusinessMetrics> {
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("*")
    .eq("vendor_id", vendorId)
    .in("status", ["confirmed", "completed"]);
  if (bookingsError) throw bookingsError;

  const totalRevenue = bookings?.reduce((sum: number, b: any) => sum + (b.total_price || 0), 0) || 0;

  const thisMonth = new Date().toISOString().slice(0, 7);
  const bookingsThisMonth = bookings?.filter((b: any) => (b.created_at as string).startsWith(thisMonth)).length || 0;

  const { data: reviews, error: reviewsErr } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewed_user_id", vendorId);
  if (reviewsErr) throw reviewsErr;

  const averageRating = reviews && reviews.length > 0
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
    : 0;

  const monthly: Record<string, { bookings: number; revenue: number; customers: Set<string> }> = {} as any;
  bookings?.forEach((b: any) => {
    const month = new Date(b.created_at).toISOString().slice(0, 7);
    if (!monthly[month]) monthly[month] = { bookings: 0, revenue: 0, customers: new Set() } as any;
    monthly[month].bookings += 1;
    monthly[month].revenue += b.total_price || 0;
    monthly[month].customers.add(b.customer_id);
  });

  const monthlyBookings = Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      bookings: (data as any).bookings,
      revenue: (data as any).revenue,
      uniqueCustomers: (data as any).customers.size,
    }));

  const customerBookingCount: Record<string, number> = {};
  bookings?.forEach((b: any) => {
    customerBookingCount[b.customer_id] = (customerBookingCount[b.customer_id] || 0) + 1;
  });

  const totalCustomers = Object.keys(customerBookingCount).length;
  const repeatCustomers = Object.values(customerBookingCount).filter((c) => c > 1).length;
  const repeatCustomerRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
  const averageLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  return {
    totalRevenue,
    bookingsThisMonth,
    averageRating,
    repeatCustomerRate,
    monthlyBookings,
    customerRetention: {
      totalCustomers,
      repeatCustomers,
      retentionRate: repeatCustomerRate,
      averageLifetimeValue,
    },
  };
}
