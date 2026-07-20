import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function number(val: any, fallback = 0): number {
  const n = typeof val === 'string' ? parseFloat(val) : typeof val === 'number' ? val : NaN;
  return Number.isFinite(n) ? n : fallback;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json().catch(() => ({}));
    const items = Array.isArray(payload.items) ? payload.items : [];

    const subtotal = items.reduce((sum: number, item: any) => {
      const price = number(item?.listing?.price ?? item?.price, 0);
      const duration = number(item?.duration_hours ?? item?.durationHours, 1) || 1;
      const quantity = number(item?.quantity, 1) || 1;
      return sum + price * duration * quantity;
    }, 0);

    // Basic rates (can be made dynamic later)
    const platformFee = subtotal * 0.05;
    const estimatedTax = subtotal * 0.08;
    const total = subtotal + platformFee + estimatedTax;

    const result = { subtotal, platformFee, estimatedTax, total };

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    });
  } catch (err) {
    console.error('pricing-engine error', err);
    return new Response(JSON.stringify({ error: 'failed_to_compute_totals' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 500,
    });
  }
});
