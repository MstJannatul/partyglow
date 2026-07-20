
-- Phase 2/3: Reliability, Metrics, and Performance Indexes
-- Note: Avoids reserved schemas. Uses idempotent IF NOT EXISTS where possible.

-- 1) Tables used by edge functions -----------------------------------------

-- a) Error logs captured by error-monitor (already deployed as public function)
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  error_message text NOT NULL,
  stack_trace text,
  user_id uuid,
  user_agent text,
  url text,
  severity text NOT NULL DEFAULT 'low',
  metadata jsonb,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz
);

-- optional severity constraint (immutable; safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'error_logs_severity_check'
  ) THEN
    ALTER TABLE public.error_logs
    ADD CONSTRAINT error_logs_severity_check
    CHECK (severity IN ('low','medium','high','critical'));
  END IF;
END$$;

-- Enable RLS and restrict reads/updates to admins
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'error_logs' AND policyname = 'Admins can view error logs'
  ) THEN
    CREATE POLICY "Admins can view error logs"
      ON public.error_logs
      FOR SELECT
      USING (get_user_role(auth.uid()) = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'error_logs' AND policyname = 'Admins can resolve error logs'
  ) THEN
    CREATE POLICY "Admins can resolve error logs"
      ON public.error_logs
      FOR UPDATE
      USING (get_user_role(auth.uid()) = 'admin');
  END IF;
END$$;

-- b) System metrics used by analytics-collector and error-monitor
CREATE TABLE IF NOT EXISTS public.system_metrics (
  date date NOT NULL,
  metric_type text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (date, metric_type)
);

ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'system_metrics' AND policyname = 'Admins can view metrics'
  ) THEN
    CREATE POLICY "Admins can view metrics"
      ON public.system_metrics
      FOR SELECT
      USING (get_user_role(auth.uid()) = 'admin');
  END IF;
END$$;

-- 2) Helpful indexes for triage and analytics -------------------------------

-- Error logs
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs (severity);

-- 3) Performance indexes for hot paths --------------------------------------

-- Listings: search + filters
-- Full-text search index on title + description
CREATE INDEX IF NOT EXISTS idx_listings_tsv
  ON public.listings
  USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));

-- Common filters/sorts
CREATE INDEX IF NOT EXISTS idx_listings_is_active_created_at ON public.listings (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings (category_id);
CREATE INDEX IF NOT EXISTS idx_listings_user ON public.listings (user_id);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings (price);

-- Bookings: dashboards and automation
CREATE INDEX IF NOT EXISTS idx_bookings_vendor_status_start ON public.bookings (vendor_id, status, start_date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_status_start ON public.bookings (customer_id, status, start_date);
CREATE INDEX IF NOT EXISTS idx_bookings_group_booking_id ON public.bookings (group_booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_auto_finalize_at ON public.bookings (auto_finalize_at);
CREATE INDEX IF NOT EXISTS idx_bookings_auto_close_at ON public.bookings (auto_close_at);

-- Messages and threads (assumes these tables exist as referenced by functions)
-- Threads
CREATE INDEX IF NOT EXISTS idx_message_threads_vendor_customer ON public.message_threads (vendor_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_booking ON public.message_threads (booking_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_last_updated ON public.message_threads (last_updated DESC);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_thread_sent_at ON public.messages (thread_id, sent_at DESC);

-- Booking timeline events
CREATE INDEX IF NOT EXISTS idx_booking_timeline_events_booking_created
  ON public.booking_timeline_events (booking_id, created_at DESC);

-- Reviews/Vendor rating rollups
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user ON public.reviews (reviewed_user_id);

-- Inventory and cart flows
CREATE INDEX IF NOT EXISTS idx_inventory_items_vendor ON public.inventory_items (vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_listing ON public.inventory_items (listing_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_active ON public.inventory_items (is_active);

CREATE INDEX IF NOT EXISTS idx_cart_items_customer ON public.cart_items (customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_reserved_until ON public.cart_items (reserved_until);

-- Analytics events (used by analytics-collector; keep small, selective indexes)
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events (user_id);
