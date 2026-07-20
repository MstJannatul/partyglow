import { supabase } from '@/integrations/supabase/client'

export async function trackEvent(
  eventType: string,
  properties: Record<string, any> = {}
) {
  try {
    await supabase.functions.invoke('analytics-collector', {
      body: {
        event: eventType,
        properties
      }
    })
  } catch (err) {
    // Silently ignore analytics errors
    console.warn('trackEvent failed', err)
  }
}

export async function trackTiming(
  name: string,
  durationMs: number,
  properties: Record<string, any> = {}
) {
  return trackEvent('timing', { name, duration_ms: durationMs, ...properties })
}
