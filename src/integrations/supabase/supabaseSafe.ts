import { supabase } from '@/integrations/supabase/client'

// Centralized error logging helper
export const logSupabaseError = async (
  context: string,
  error: any,
  metadata?: Record<string, any>
) => {
  try {
    const msg = `${context}: ${error?.message || 'Unknown error'}`
    await supabase.functions.invoke('error-monitor', {
      body: {
        message: msg,
        error: msg,
        stack: error?.stack || String(error),
        severity: 'error',
        metadata: {
          ...(metadata || {}),
          code: error?.code,
          url: typeof window !== 'undefined' ? window.location.href : undefined
        }
      }
    })
  } catch (_) {
    // Swallow logging errors
  }
}

// Safe RPC wrapper with consistent error handling
export const safeRpc = async <T = any>(
  fnName: any,
  args?: Record<string, any>,
  metadata?: Record<string, any>
): Promise<T> => {
  const { data, error } = await supabase.rpc(fnName as any, args ?? ({} as any))
  if (error) {
    await logSupabaseError(`RPC ${String(fnName)} failed`, error, {
      args,
      ...(metadata || {})
    })
    throw error
  }
  return data as T
}
