import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface NotificationRequest {
  type: 'booking_confirmed' | 'booking_cancelled' | 'booking_completed' | 'payment_received' | 'review_submitted';
  bookingId: string;
  recipientId: string;
  customMessage?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, bookingId, recipientId, customMessage }: NotificationRequest = await req.json();

    // Get booking and user details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        listing:listings(title, price),
        customer:profiles!customer_id(full_name, email),
        vendor:profiles!vendor_id(full_name, email)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    const { data: recipient } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', recipientId)
      .single();

    if (!recipient?.email) {
      throw new Error('Recipient email not found');
    }

    // Generate email content based on notification type
    let subject = '';
    let html = '';

    switch (type) {
      case 'booking_confirmed':
        subject = `Booking Confirmed - ${booking.listing.title}`;
        html = `
          <h2>Your booking has been confirmed!</h2>
          <p>Hi ${recipient.full_name},</p>
          <p>Great news! Your booking for <strong>${booking.listing.title}</strong> has been confirmed.</p>
          <p><strong>Details:</strong></p>
          <ul>
            <li>Date: ${new Date(booking.start_date).toLocaleDateString()}</li>
            <li>Time: ${new Date(booking.start_date).toLocaleTimeString()} - ${new Date(booking.end_date).toLocaleTimeString()}</li>
            <li>Total: $${booking.total_amount}</li>
          </ul>
          <p>Please check your dashboard for more details and to view the signed contract.</p>
        `;
        break;

      case 'booking_cancelled':
        subject = `Booking Cancelled - ${booking.listing.title}`;
        html = `
          <h2>Booking Cancelled</h2>
          <p>Hi ${recipient.full_name},</p>
          <p>We're sorry to inform you that your booking for <strong>${booking.listing.title}</strong> has been cancelled.</p>
          <p>If you paid for this booking, a refund will be processed within 3-5 business days.</p>
          <p>You can browse other available services on our platform.</p>
        `;
        break;

      case 'booking_completed':
        subject = `Booking Completed - ${booking.listing.title}`;
        html = `
          <h2>Booking Completed</h2>
          <p>Hi ${recipient.full_name},</p>
          <p>Your booking for <strong>${booking.listing.title}</strong> has been completed!</p>
          <p>We hope you had a great experience. Please consider leaving a review to help other customers.</p>
          <p>Thank you for using our platform!</p>
        `;
        break;

      case 'payment_received':
        subject = `Payment Received - ${booking.listing.title}`;
        html = `
          <h2>Payment Received</h2>
          <p>Hi ${recipient.full_name},</p>
          <p>We've received your payment of $${booking.total_amount} for <strong>${booking.listing.title}</strong>.</p>
          <p>Your booking is now confirmed and the vendor has been notified.</p>
          <p>Payment will be released to the vendor after the service is completed.</p>
        `;
        break;

      case 'review_submitted':
        subject = `New Review Submitted - ${booking.listing.title}`;
        html = `
          <h2>New Review Received</h2>
          <p>Hi ${recipient.full_name},</p>
          <p>You've received a new review for your service <strong>${booking.listing.title}</strong>.</p>
          <p>Check your dashboard to view the review and respond if needed.</p>
        `;
        break;

      default:
        throw new Error('Invalid notification type');
    }

    if (customMessage) {
      html += `<br><p><em>Additional message: ${customMessage}</em></p>`;
    }

    // Send email
    if (resend && recipient.email) {
      await resend.emails.send({
        from: 'PartyGuard <notifications@resend.dev>',
        to: [recipient.email],
        subject,
        html,
      });
    }

    // Store notification in database
    await supabase.from('notifications').insert({
      user_id: recipientId,
      booking_id: bookingId,
      title: subject,
      message: html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text
      type: 'info'
    });

    console.log(`Notification sent: ${type} for booking ${bookingId} to ${recipient.email}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});