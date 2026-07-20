-- Phase 1: Critical Performance & Security Fixes

-- Enable database indexes for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_listings_active_category 
ON listings(is_active, category_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_listings_active_location 
ON listings(is_active, location) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_listings_active_price 
ON listings(is_active, price) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_listings_search 
ON listings USING gin(to_tsvector('english', title || ' ' || coalesce(description, ''))) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_reviews_user_rating 
ON reviews(reviewed_user_id, rating);

CREATE INDEX IF NOT EXISTS idx_bookings_vendor_status 
ON bookings(vendor_id, status);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_status 
ON bookings(customer_id, status);

CREATE INDEX IF NOT EXISTS idx_messages_thread_sent 
ON messages(thread_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_threads_customer 
ON message_threads(customer_id, last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_message_threads_vendor 
ON message_threads(vendor_id, last_updated DESC);

-- Function to get optimized listings (replaces the N+1 query pattern)
CREATE OR REPLACE FUNCTION get_optimized_listings(
  p_category_id uuid DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  price numeric,
  location text,
  media_urls text[],
  listing_type text,
  delivery_type text,
  min_booking_hours integer,
  max_booking_hours integer,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid,
  category_id uuid,
  vendor jsonb,
  category jsonb,
  reviews_count bigint,
  average_rating numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    l.description,
    l.price,
    l.location,
    l.media_urls,
    l.listing_type,
    l.delivery_type,
    l.min_booking_hours,
    l.max_booking_hours,
    l.is_active,
    l.created_at,
    l.updated_at,
    l.user_id,
    l.category_id,
    to_jsonb(p.*) as vendor,
    to_jsonb(c.*) as category,
    COALESCE(r.reviews_count, 0) as reviews_count,
    COALESCE(r.average_rating, 0) as average_rating
  FROM listings l
  LEFT JOIN profiles p ON p.user_id = l.user_id
  LEFT JOIN categories c ON c.id = l.category_id
  LEFT JOIN (
    SELECT 
      reviewed_user_id,
      COUNT(id) as reviews_count,
      AVG(rating) as average_rating
    FROM reviews
    GROUP BY reviewed_user_id
  ) r ON r.reviewed_user_id = l.user_id
  WHERE 
    l.is_active = true
    AND (p_category_id IS NULL OR l.category_id = p_category_id)
    AND (p_location IS NULL OR l.location ILIKE '%' || p_location || '%')
    AND (p_min_price IS NULL OR l.price >= p_min_price)
    AND (p_max_price IS NULL OR l.price <= p_max_price)
    AND (p_search IS NULL OR to_tsvector('english', l.title || ' ' || COALESCE(l.description, '')) @@ plainto_tsquery('english', p_search))
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;