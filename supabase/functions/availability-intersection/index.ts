import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const vendorIds: string[] = Array.isArray(body.vendorIds) ? body.vendorIds : [];
    const date: string = typeof body.date === 'string' ? body.date : '';
    const durationHours: number = Number(body.durationHours ?? 1);

    if (!vendorIds.length || !date) {
      return new Response(JSON.stringify({ error: 'invalid_arguments' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 400,
      });
    }

    const { data, error } = await supabase.rpc('get_vendor_availability_intersection', {
      p_vendor_ids: vendorIds,
      p_date: date,
      p_duration: durationHours,
    });

    if (error) throw error;

    const slots = (data || []).map((row: any) => ({
      start: row.start_time,
      end: row.end_time,
      availableVendors: row.available_vendors || vendorIds,
      conflictedVendors: [],
      isFullyAvailable: true,
    }));

    return new Response(JSON.stringify({ slots }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    });
  } catch (err) {
    console.error('availability-intersection error', err);
    return new Response(JSON.stringify({ error: 'failed_to_fetch_slots', slots: [] }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 500,
    });
  }
});
