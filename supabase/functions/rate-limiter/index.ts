
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

// Limiter configurations
const getLimiterConfig = (type: string) => {
  if (type === 'strict') {
    return { windowMs: 5 * 60 * 1000, maxRequests: 10 }; // 5 minutes, 10 requests
  }
  return { windowMs: 15 * 60 * 1000, maxRequests: 100 }; // 15 minutes, 100 requests
};

// Attempt to derive a stable key from the request
function getKeyFromRequest(req: Request): string {
  const authHeader = req.headers.get('authorization');
  const xForwardedFor = req.headers.get('x-forwarded-for') || 'unknown';

  // Prefer user ID from JWT if present
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload?.sub) {
        return `user:${payload.sub}`;
      }
    } catch {
      // fall through to IP-based key
    }
  }

  // Fallback to IP-based key
  return `ip:${xForwardedFor}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let limiterType = url.searchParams.get('type') || 'api';

    // Also allow type from JSON body when invoked without query params
    if (req.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await req.json();
        if (body && typeof body.type === 'string') {
          limiterType = body.type;
        }
      } catch {
        // ignore JSON parse errors
      }
    }

    const key = getKeyFromRequest(req);
    const { windowMs, maxRequests } = getLimiterConfig(limiterType);

    // Bump and read the current rate limit from DB atomically
    const { data, error } = await supabase.rpc('bump_rate_limit', {
      p_limiter_type: limiterType,
      p_key: key,
      p_window_ms: windowMs,
      p_max_requests: maxRequests,
    });

    if (error) {
      console.error('Rate limiter RPC error:', error);
      // Fail open for availability
      return new Response(
        JSON.stringify({
          error: 'Rate limiter service error',
          allowed: true,
          remainingRequests: maxRequests - 1,
          resetTime: Date.now() + windowMs,
          resetIn: windowMs,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const allowed = Boolean(data?.allowed);
    const remaining = Number(data?.remainingRequests ?? 0);
    const resetTime = Number(data?.resetTime ?? (Date.now() + windowMs));
    const resetIn = Math.max(0, resetTime - Date.now());

    const responseBody = {
      allowed,
      remainingRequests: remaining,
      resetTime,
      resetIn,
    };

    const status = allowed ? 200 : 429;

    return new Response(JSON.stringify(responseBody), {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(maxRequests),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(resetTime),
      },
    });
  } catch (err) {
    console.error('Rate limiter unexpected error:', err);
    // Fail open for availability
    return new Response(
      JSON.stringify({
        error: 'Rate limiter unexpected error',
        allowed: true,
        remainingRequests: 100,
        resetTime: Date.now() + 15 * 60 * 1000,
        resetIn: 15 * 60 * 1000,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
