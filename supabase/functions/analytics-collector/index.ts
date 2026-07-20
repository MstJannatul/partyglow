
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface AnalyticsEvent {
  event: string;
  userId?: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const event = body.event || body.event_type;
    const userId = body.userId as string | undefined;
    let properties = body.properties as Record<string, any> | undefined;
    const timestamp: string | undefined = body.timestamp;

    // Normalize properties for page_view and common aliases
    if (event === 'page_view' && properties) {
      properties = {
        page: properties.page ?? properties.path ?? '',
        referrer: properties.referrer ?? '',
        userAgent: properties.userAgent ?? properties.user_agent ?? ''
      };
    }

    const eventTimestamp = timestamp || new Date().toISOString();
    const eventDate = eventTimestamp.split('T')[0];

    // Store the event - align with analytics_events schema (event_type, created_at)
    const { error: eventError } = await supabase
      .from('analytics_events')
      .insert({
        event_type: event,
        user_id: userId,
        properties,
        created_at: eventTimestamp
      });

    if (eventError) {
      console.error('Failed to store analytics event:', eventError);
    }

    // Update daily metrics
    await updateDailyMetrics(event, eventDate, properties);

    // Handle specific event types
    switch (event) {
      case 'booking_created':
        await handleBookingCreated(properties, eventDate);
        break;
      
      case 'payment_completed':
        await handlePaymentCompleted(properties, eventDate);
        break;
      
      case 'user_signup':
        await handleUserSignup(properties, eventDate);
        break;
      
      case 'listing_created':
        await handleListingCreated(properties, eventDate);
        break;

      case 'page_view':
        await handlePageView(properties, eventDate);
        break;
    }

    return new Response(
      JSON.stringify({ success: true, event, timestamp: eventTimestamp }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analytics collector:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function updateDailyMetrics(event: string, date: string, properties?: Record<string, any>) {
  const { error } = await supabase
    .from('system_metrics')
    .upsert({
      date,
      metric_type: `event_${event}`,
      value: 1,
      metadata: properties
    }, {
      onConflict: 'date,metric_type',
      ignoreDuplicates: false
    });

  if (error) {
    console.error(`Failed to update daily metrics for ${event}:`, error);
  }
}

async function handleBookingCreated(properties: Record<string, any>, date: string) {
  // Track booking conversion rates
  const { error } = await supabase
    .from('system_metrics')
    .upsert({
      date,
      metric_type: 'bookings_created',
      value: 1,
      metadata: {
        listingType: properties?.listingType,
        amount: properties?.amount,
        duration: properties?.duration
      }
    }, {
      onConflict: 'date,metric_type',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('Failed to update booking metrics:', error);
  }
}

async function handlePaymentCompleted(properties: Record<string, any>, date: string) {
  // Track revenue metrics
  const amount = properties?.amount || 0;
  
  const { error } = await supabase
    .from('system_metrics')
    .upsert({
      date,
      metric_type: 'revenue',
      value: amount,
      metadata: {
        paymentMethod: properties?.paymentMethod,
        currency: properties?.currency || 'USD'
      }
    }, {
      onConflict: 'date,metric_type',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('Failed to update revenue metrics:', error);
  }
}

async function handleUserSignup(properties: Record<string, any>, date: string) {
  // Track user acquisition
  const { error } = await supabase
    .from('system_metrics')
    .upsert({
      date,
      metric_type: 'user_signups',
      value: 1,
      metadata: {
        userType: properties?.userType,
        source: properties?.source
      }
    }, {
      onConflict: 'date,metric_type',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('Failed to update signup metrics:', error);
  }
}

async function handleListingCreated(properties: Record<string, any>, date: string) {
  // Track vendor activity
  const { error } = await supabase
    .from('system_metrics')
    .upsert({
      date,
      metric_type: 'listings_created',
      value: 1,
      metadata: {
        listingType: properties?.listingType,
        category: properties?.category
      }
    }, {
      onConflict: 'date,metric_type',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('Failed to update listing metrics:', error);
  }
}

async function handlePageView(properties: Record<string, any>, date: string) {
  // Track page views and user engagement
  const { error } = await supabase
    .from('system_metrics')
    .upsert({
      date,
      metric_type: 'page_views',
      value: 1,
      metadata: {
        page: properties?.page,
        userAgent: properties?.userAgent,
        referrer: properties?.referrer
      }
    }, {
      onConflict: 'date,metric_type',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('Failed to update page view metrics:', error);
  }
}
