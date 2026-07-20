-- Phase 1: Critical Performance & Security Fixes

-- Enable database indexes for high-frequency queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_active_category 
ON listings(is_active, category_id) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_active_location 
ON listings(is_active, location) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_active_price 
ON listings(is_active, price) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_search 
ON listings USING gin(to_tsvector('english', title || ' ' || coalesce(description, ''))) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_user_rating 
ON reviews(reviewed_user_id, rating);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_vendor_status 
ON bookings(vendor_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_customer_status 
ON bookings(customer_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_thread_sent 
ON messages(thread_id, sent_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_threads_customer 
ON message_threads(customer_id, last_updated DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_threads_vendor 
ON message_threads(vendor_id, last_updated DESC);

-- Optimize listings query by creating a view with aggregated review data
CREATE MATERIALIZED VIEW IF NOT EXISTS listings_with_reviews AS
SELECT 
  l.*,
  COALESCE(r.reviews_count, 0) as reviews_count,
  COALESCE(r.average_rating, 0) as average_rating
FROM listings l
LEFT JOIN (
  SELECT 
    p.user_id,
    COUNT(rev.id) as reviews_count,
    AVG(rev.rating) as average_rating
  FROM profiles p
  LEFT JOIN reviews rev ON rev.reviewed_user_id = p.user_id
  GROUP BY p.user_id
) r ON r.user_id = l.user_id
WHERE l.is_active = true;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_with_reviews_id 
ON listings_with_reviews(id);

CREATE INDEX IF NOT EXISTS idx_listings_with_reviews_category 
ON listings_with_reviews(category_id);

CREATE INDEX IF NOT EXISTS idx_listings_with_reviews_rating 
ON listings_with_reviews(average_rating DESC);

-- Refresh function for the materialized view
CREATE OR REPLACE FUNCTION refresh_listings_with_reviews()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY listings_with_reviews;
$$;

-- Trigger to refresh materialized view when listings or reviews change
CREATE OR REPLACE FUNCTION trigger_refresh_listings_view()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use pg_notify to trigger refresh asynchronously
  PERFORM pg_notify('refresh_listings_view', '');
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS listings_changed ON listings;
CREATE TRIGGER listings_changed
  AFTER INSERT OR UPDATE OR DELETE ON listings
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_listings_view();

DROP TRIGGER IF EXISTS reviews_changed ON reviews;  
CREATE TRIGGER reviews_changed
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_listings_view();

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
    lwr.id,
    lwr.title,
    lwr.description,
    lwr.price,
    lwr.location,
    lwr.media_urls,
    lwr.listing_type,
    lwr.delivery_type,
    lwr.min_booking_hours,
    lwr.max_booking_hours,
    lwr.is_active,
    lwr.created_at,
    lwr.updated_at,
    lwr.user_id,
    lwr.category_id,
    to_jsonb(p.*) as vendor,
    to_jsonb(c.*) as category,
    lwr.reviews_count,
    lwr.average_rating
  FROM listings_with_reviews lwr
  LEFT JOIN profiles p ON p.user_id = lwr.user_id
  LEFT JOIN categories c ON c.id = lwr.category_id
  WHERE 
    (p_category_id IS NULL OR lwr.category_id = p_category_id)
    AND (p_location IS NULL OR lwr.location ILIKE '%' || p_location || '%')
    AND (p_min_price IS NULL OR lwr.price >= p_min_price)
    AND (p_max_price IS NULL OR lwr.price <= p_max_price)
    AND (p_search IS NULL OR to_tsvector('english', lwr.title || ' ' || COALESCE(lwr.description, '')) @@ plainto_tsquery('english', p_search))
  ORDER BY lwr.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;