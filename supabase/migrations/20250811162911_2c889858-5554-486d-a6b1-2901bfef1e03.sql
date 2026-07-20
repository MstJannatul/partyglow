-- Persistent rate limiter storage
CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  limiter_type text NOT NULL,
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  window_ms integer NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (limiter_type, key)
);

-- Enable RLS (edge function will use service role to bypass RLS)
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;

-- Optional: helpful index for maintenance/analytics
CREATE INDEX IF NOT EXISTS idx_rate_limit_window_start ON public.rate_limit_counters (window_start);
