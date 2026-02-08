import { createClient } from '@supabase/supabase-js';
import { config } from './config';

/**
 * Supabase client with service role key.
 * Worker bypasses RLS to read/write all strategies and triggers.
 */
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

console.log('[Supabase] Client initialized with service role key');
