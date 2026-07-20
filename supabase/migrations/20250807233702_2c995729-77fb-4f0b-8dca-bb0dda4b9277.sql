-- Fix get_optimized_listings to avoid ambiguous column references and make aggregation explicit
CREATE OR REPLACE FUNCTION public.get_optimized_listings(
  p_category_id uuid DEFAULT NULL::uuid,
  p_location text DEFAULT NULL::text,
  p_min_price numeric DEFAULT NULL::numeric,
  p_max_price numeric DEFAULT NULL::numeric,
  p_search text DEFAULT NULL::text,
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
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  user_id uuid,
  category_id uuid,
  vendor jsonb,
  category jsonb,
  reviews_count bigint,
  average_rating numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      rev.reviewed_user_id,
      COUNT(rev.id) as reviews_count,
      AVG(rev.rating)::numeric as average_rating
    FROM reviews rev
    GROUP BY rev.reviewed_user_id
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
$function$;