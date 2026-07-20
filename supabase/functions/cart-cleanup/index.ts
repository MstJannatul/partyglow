import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase env config" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('Starting cart cleanup process...');
    
    // Clean up expired cart items (both inventory and non-inventory items)
    const { data, error } = await supabase.rpc('release_expired_cart_reservations');
    if (error) throw error;

    const releasedCount = data as number;
    
    console.log(`Cart cleanup completed. Released ${releasedCount} expired items.`);
    
    return new Response(JSON.stringify({ 
      success: true,
      releasedCount,
      timestamp: new Date().toISOString(),
      message: `Successfully cleaned up ${releasedCount} expired cart items`
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error('Cart cleanup error:', err);
    return new Response(JSON.stringify({ 
      success: false,
      error: (err as Error).message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
