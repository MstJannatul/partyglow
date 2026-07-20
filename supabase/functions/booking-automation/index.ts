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

interface AutomationRequest {
  action: 'send_reminders' | 'cleanup_expired' | 'auto_finalize' | 'health_check';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action }: AutomationRequest = await req.json();

    switch (action) {
      case 'send_reminders':
        return await sendBookingReminders();
      
      case 'cleanup_expired':
        return await cleanupExpiredBookings();
      
      case 'auto_finalize':
        return await autoFinalizeBookings();
      
      case 'health_check':
        return await performHealthCheck();
      
      default:
        throw new Error('Invalid automation action');
    }

  } catch (error) {
    console.error('Error in booking automation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendBookingReminders() {
  console.log('Running booking reminder automation...');
  
  // Find bookings that need 24-hour reminders
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const { data: upcomingBookings, error } = await supabase
    .from('bookings')
    .select(`
      id, start_date, customer_id, vendor_id,
      listing:listings(title),
      customer:profiles!customer_id(full_name, email),
      vendor:profiles!vendor_id(full_name, email)
    `)
    .eq('status', 'confirmed')
    .gte('start_date', tomorrow.toISOString())
    .lt('start_date', dayAfter.toISOString())
    .is('reminder_sent', false);

  if (error) {
    throw new Error(`Failed to fetch upcoming bookings: ${error.message}`);
  }

  let remindersSent = 0;

  for (const booking of upcomingBookings || []) {
    try {
      // Send reminder to customer
      await supabase.functions.invoke('send-notifications', {
        body: {
          type: 'booking_reminder',
          bookingId: booking.id,
          recipientId: booking.customer_id,
          customMessage: `Your booking for ${booking.listing.title} is scheduled for tomorrow at ${new Date(booking.start_date).toLocaleTimeString()}.`
        }
      });

      // Send reminder to vendor
      await supabase.functions.invoke('send-notifications', {
        body: {
          type: 'booking_reminder',
          bookingId: booking.id,
          recipientId: booking.vendor_id,
          customMessage: `You have a booking for ${booking.listing.title} scheduled for tomorrow at ${new Date(booking.start_date).toLocaleTimeString()}.`
        }
      });

      // Mark reminder as sent
      await supabase
        .from('bookings')
        .update({ reminder_sent: true })
        .eq('id', booking.id);

      remindersSent++;

    } catch (error) {
      console.error(`Failed to send reminder for booking ${booking.id}:`, error);
    }
  }

  console.log(`Sent ${remindersSent} booking reminders`);

  return new Response(
    JSON.stringify({ success: true, remindersSent }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function cleanupExpiredBookings() {
  console.log('Running expired booking cleanup...');
  
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Find bookings that ended more than 24 hours ago and are still "in_progress"
  const { data: expiredBookings, error } = await supabase
    .from('bookings')
    .select('id, end_date')
    .eq('status', 'in_progress')
    .lt('end_date', oneDayAgo.toISOString());

  if (error) {
    throw new Error(`Failed to fetch expired bookings: ${error.message}`);
  }

  let cleanedUp = 0;

  for (const booking of expiredBookings || []) {
    try {
      await supabase
        .from('bookings')
        .update({ 
          status: 'completed',
          auto_completed: true,
          updated_at: now.toISOString()
        })
        .eq('id', booking.id);

      cleanedUp++;

    } catch (error) {
      console.error(`Failed to cleanup booking ${booking.id}:`, error);
    }
  }

  console.log(`Cleaned up ${cleanedUp} expired bookings`);

  return new Response(
    JSON.stringify({ success: true, cleanedUp }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function autoFinalizeBookings() {
  console.log('Running auto-finalization...');
  
  const now = new Date();

  // Find bookings that should be auto-finalized
  const { data: bookingsToFinalize, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('status', 'completed')
    .eq('is_paid', false)
    .not('auto_finalize_at', 'is', null)
    .lt('auto_finalize_at', now.toISOString());

  if (error) {
    throw new Error(`Failed to fetch bookings for finalization: ${error.message}`);
  }

  let finalized = 0;

  for (const booking of bookingsToFinalize || []) {
    try {
      await supabase.rpc('auto_finalize_booking', { p_booking_id: booking.id });
      finalized++;

    } catch (error) {
      console.error(`Failed to auto-finalize booking ${booking.id}:`, error);
    }
  }

  console.log(`Auto-finalized ${finalized} bookings`);

  return new Response(
    JSON.stringify({ success: true, finalized }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function performHealthCheck() {
  console.log('Performing system health check...');
  
  const healthData = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      database: false,
      functions: false,
      storage: false
    },
    metrics: {}
  };

  try {
    // Test database connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    healthData.checks.database = !error;

    // Test function availability
    try {
      await supabase.functions.invoke('send-notifications', {
        body: { test: true }
      });
      healthData.checks.functions = true;
    } catch {
      healthData.checks.functions = false;
    }

    // Test storage
    const { data: buckets } = await supabase.storage.listBuckets();
    healthData.checks.storage = Array.isArray(buckets);

    // Get basic metrics
    const { data: activeBookings } = await supabase
      .from('bookings')
      .select('count')
      .in('status', ['confirmed', 'in_progress']);

    const { data: totalUsers } = await supabase
      .from('profiles')
      .select('count');

    healthData.metrics = {
      activeBookings: activeBookings?.[0]?.count || 0,
      totalUsers: totalUsers?.[0]?.count || 0
    };

    // Determine overall status
    const allChecksPass = Object.values(healthData.checks).every(check => check);
    healthData.status = allChecksPass ? 'healthy' : 'degraded';

    // Store health metrics
    await supabase.from('system_metrics').upsert({
      date: new Date().toISOString().split('T')[0],
      metric_type: 'health_check',
      value: allChecksPass ? 1 : 0,
      metadata: healthData
    });

    console.log('Health check completed:', healthData.status);

    return new Response(
      JSON.stringify(healthData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Health check failed:', error);
    
    return new Response(
      JSON.stringify({ 
        ...healthData, 
        status: 'unhealthy', 
        error: error.message 
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}