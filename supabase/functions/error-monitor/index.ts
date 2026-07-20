import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ErrorReport {
  error: string;
  stack?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Normalize payload from various clients
    const message = body.error || body.message || 'Unknown error';
    const stack = body.stack || undefined;
    const severityRaw = body.severity || 'error';
    const mapSeverity = (s: string): 'low' | 'medium' | 'high' | 'critical' => {
      switch (s) {
        case 'critical':
        case 'high':
        case 'medium':
        case 'low':
          return s;
        case 'warning':
        case 'info':
          return 'low';
        case 'error':
        default:
          return 'medium';
      }
    };
    const severity = mapSeverity(severityRaw);

    const userId = body.userId || body.userInfo?.userId || body.user?.id || null;
    const userAgent = body.userAgent || body.userInfo?.userAgent || body.metadata?.userAgent || null;
    const url = body.url || body.userInfo?.url || body.metadata?.url || null;
    const metadata = body.metadata || {};

    // Log error to console for immediate visibility
    console.error('Application Error:', {
      error: message,
      stack,
      userId,
      userAgent,
      url,
      severity,
      metadata,
      timestamp: new Date().toISOString(),
      original: body,
    });

    // Store error in database for tracking
    const { error: dbError } = await supabase
      .from('error_logs')
      .insert({
        error_message: message,
        stack_trace: stack,
        user_id: userId,
        user_agent: userAgent,
        url,
        severity,
        metadata,
        resolved: false
      });

    if (dbError) {
      console.error('Failed to store error in database:', dbError);
    }

    // For critical errors, send immediate notification
    if (severity === 'critical') {
      try {
        await supabase.functions.invoke('send-notifications', {
          body: {
            type: 'system_alert',
            message: `CRITICAL ERROR: ${message}`,
            details: { stack, url, userId, metadata }
          }
        });
      } catch (notificationError) {
        console.error('Failed to send critical error notification:', notificationError);
      }
    }

    // Track error metrics
    const today = new Date().toISOString().split('T')[0];
    
    const { error: metricsError } = await supabase
      .from('system_metrics')
      .upsert({
        date: today,
        metric_type: 'error_count',
        value: 1,
        metadata: { severity }
      }, {
        onConflict: 'date,metric_type',
        ignoreDuplicates: false
      });

    if (metricsError) {
      console.error('Failed to update error metrics:', metricsError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Error logged successfully',
        errorId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in error-monitor function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to log error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});