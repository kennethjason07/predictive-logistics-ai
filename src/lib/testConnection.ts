import { supabase } from './supabase';

/**
 * Quick helper to verify your connection to Supabase.
 * Checks if the client can reach Supabase auth / health check.
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  sessionActive?: boolean;
}> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return { success: false, message: `Supabase returned an error: ${error.message}` };
    }
    return {
      success: true,
      message: 'Successfully connected to Supabase!',
      sessionActive: !!data?.session,
    };
  } catch (err: any) {
    return { success: false, message: `Connection failed: ${err?.message || err}` };
  }
}
