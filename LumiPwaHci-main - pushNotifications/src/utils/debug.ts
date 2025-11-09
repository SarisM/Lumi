// Debug utilities for Lumi app

// Toggle debug based on build environment. Vite exposes import.meta.env.PROD
// which is true in production builds. Keep logging off in production.
export const DEBUG = typeof import.meta !== 'undefined' && !(import.meta as any).env?.PROD;

export function debugLog(context: string, ...args: unknown[]) {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log(`[Lumi Debug - ${context}]`, ...args);
  }
}

export function debugError(context: string, ...args: unknown[]) {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.error(`[Lumi Error - ${context}]`, ...args);
  }
}

export function debugWarn(context: string, ...args: unknown[]) {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.warn(`[Lumi Warning - ${context}]`, ...args);
  }
}

// Test Supabase connection
export async function testSupabaseConnection(projectId: string, publicAnonKey: string): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    debugLog('SupabaseTest', 'Testing connection...');
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-7e221a31/health`,
      {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      debugError('SupabaseTest', 'Health check failed:', response.status, errorText);
      return {
        success: false,
        message: `Health check failed with status ${response.status}`,
        details: { status: response.status, error: errorText }
      };
    }
    
    const result = await response.json();
    debugLog('SupabaseTest', 'Health check result:', result);
    
    return {
      success: true,
      message: 'Supabase connection successful',
      details: result
    };
  } catch (error: any) {
    debugError('SupabaseTest', 'Connection test error:', error);
    return {
      success: false,
      message: error.message || 'Unknown connection error',
      details: { error: error.toString() }
    };
  }
}
