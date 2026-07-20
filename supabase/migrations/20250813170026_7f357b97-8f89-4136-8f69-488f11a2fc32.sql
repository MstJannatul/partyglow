-- Set up cron job for automated cart cleanup every 15 minutes
-- First enable necessary extensions if not already enabled
SELECT cron.schedule(
  'cart-cleanup-job',
  '*/15 * * * *', -- Every 15 minutes
  $$
  select
    net.http_post(
        url:='https://eqaskkfrbxmpkopqctvv.supabase.co/functions/v1/cart-cleanup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxYXNra2ZyYnhtcGtvcHFjdHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjY2NTEsImV4cCI6MjA2OTE0MjY1MX0.pExELlwktA0z3vhzyg1d-s0lolzZonSfSyt1_18457s"}'::jsonb,
        body:='{"triggered_by": "cron", "timestamp": "'||now()||'"}'::jsonb
    ) as request_id;
  $$
);