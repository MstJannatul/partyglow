
-- 1) Enable helpful extensions (safe if already installed)
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2) Deep categories: hierarchy and slugs
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS depth integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slug text;

-- Populate slug for existing rows, then make it unique
UPDATE public.categories
SET slug = lower(regexp_replace(name, '[^a-z0-9]+', '-', 'g'))
WHERE slug IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'categories_slug_unique'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_slug_unique UNIQUE (slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS categories_parent_idx ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS categories_depth_idx ON public.categories(depth);

-- 3) Search: generated tsvector and indexes on listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS search_tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', unaccent(coalesce(title, ''))), 'A') ||
    setweight(to_tsvector('english', unaccent(coalesce(description, ''))), 'B') ||
    setweight(to_tsvector('english', unaccent(coalesce(array_to_string(tags, ' '), ''))), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS listings_search_tsv_idx ON public.listings USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS listings_title_trgm_idx ON public.listings USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS listings_location_trgm_idx ON public.listings USING GIN (location gin_trgm_ops);
CREATE INDEX IF NOT EXISTS listings_active_category_price_idx ON public.listings (is_active, category_id, price);
CREATE INDEX IF NOT EXISTS listings_delivery_type_idx ON public.listings (delivery_type);
CREATE INDEX IF NOT EXISTS listings_listing_type_idx ON public.listings (listing_type);

-- 4) Enhanced optimized listings function with more filters and better sorting
CREATE OR REPLACE FUNCTION public.get_optimized_listings(
  p_category_id uuid DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0,
  p_min_rating numeric DEFAULT NULL,
  p_delivery_type text DEFAULT NULL,
  p_verified_only boolean DEFAULT NULL,
  p_sort text DEFAULT 'best_match'
) RETURNS TABLE(
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
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_query tsquery;
BEGIN
  IF p_search IS NOT NULL THEN
    v_query := plainto_tsquery('english', unaccent(p_search));
  END IF;

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
  FROM public.listings l
  LEFT JOIN public.profiles p ON p.user_id = l.user_id
  LEFT JOIN public.categories c ON c.id = l.category_id
  LEFT JOIN (
    SELECT 
      rev.reviewed_user_id,
      COUNT(rev.id) as reviews_count,
      AVG(rev.rating)::numeric as average_rating
    FROM public.reviews rev
    GROUP BY rev.reviewed_user_id
  ) r ON r.reviewed_user_id = l.user_id
  WHERE 
    l.is_active = true
    AND (p_category_id IS NULL OR l.category_id = p_category_id)
    AND (p_location IS NULL OR unaccent(l.location) ILIKE '%' || unaccent(p_location) || '%')
    AND (p_min_price IS NULL OR l.price >= p_min_price)
    AND (p_max_price IS NULL OR l.price <= p_max_price)
    AND (p_min_rating IS NULL OR COALESCE(r.average_rating, 0) >= p_min_rating)
    AND (p_delivery_type IS NULL OR l.delivery_type = p_delivery_type)
    AND (p_verified_only IS NULL OR p_verified_only = false OR COALESCE(p.is_verified, false) = true)
    AND (p_search IS NULL OR l.search_tsv @@ v_query)
  ORDER BY
    CASE p_sort
      WHEN 'price_asc' THEN 1
      WHEN 'price_desc' THEN 2
      WHEN 'rating_desc' THEN 3
      WHEN 'newest' THEN 4
      ELSE 5
    END,
    CASE WHEN p_sort = 'price_asc' THEN l.price END ASC NULLS LAST,
    CASE WHEN p_sort = 'price_desc' THEN l.price END DESC NULLS LAST,
    CASE WHEN p_sort = 'rating_desc' THEN COALESCE(r.average_rating, 0) END DESC NULLS LAST,
    CASE WHEN p_sort = 'newest' THEN l.created_at END DESC NULLS LAST,
    CASE WHEN p_sort NOT IN ('price_asc','price_desc','rating_desc','newest')
         THEN (CASE WHEN p_search IS NOT NULL THEN ts_rank_cd(l.search_tsv, v_query) ELSE 0 END)
    END DESC NULLS LAST,
    COALESCE(r.average_rating, 0) DESC,
    COALESCE(r.reviews_count, 0) DESC,
    l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;
