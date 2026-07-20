
-- Create an atomic, DB-backed rate limit function
CREATE OR REPLACE FUNCTION public.bump_rate_limit(
  p_limiter_type  text,
  p_key           text,
  p_window_ms     integer,
  p_max_requests  integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_window_start timestamptz;
  v_rec RECORD;
  v_allowed boolean;
  v_remaining integer;
  v_reset_time timestamptz;
BEGIN
  -- Align current time to the start of the window (in milliseconds)
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) * 1000 / p_window_ms) * p_window_ms / 1000
  );

  -- Upsert the counter for this (limiter_type, key)
  INSERT INTO rate_limit_counters AS rlc (
    limiter_type, key, window_start, window_ms, count, updated_at
  )
  VALUES (
    p_limiter_type, p_key, v_window_start, p_window_ms, 1, now()
  )
  ON CONFLICT (limiter_type, key) DO UPDATE
  SET
    -- If we're still in the same window, increment; otherwise reset to 1
    count = CASE
      WHEN rlc.window_start = EXCLUDED.window_start THEN rlc.count + 1
      ELSE 1
    END,
    window_start = EXCLUDED.window_start,
    window_ms    = EXCLUDED.window_ms,
    updated_at   = now()
  RETURNING rlc.count, rlc.window_start, rlc.window_ms
  INTO v_rec;

  v_allowed    := v_rec.count <= p_max_requests;
  v_remaining  := GREATEST(0, p_max_requests - v_rec.count);
  v_reset_time := v_rec.window_start + (p_window_ms::text || ' milliseconds')::interval;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'count', v_rec.count,
    'remainingRequests', v_remaining,
    'resetTime', floor(extract(epoch from v_reset_time) * 1000)::bigint
  );
END;
$function$;

-- Tighten execution permissions (service role only)
REVOKE ALL ON FUNCTION public.bump_rate_limit(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bump_rate_limit(text, text, integer, integer) TO service_role;
