import { InternalServerErrorException, Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { Database } from './database.types';

/**
 * Holds the Subabase client configured with the **service-role key**.
 * The service-role key bypasses RLS — every service method must therefore
 * filter by user_id explicitly to maintain isolation (§1.3, §6).
 */
@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient<Database>;

  constructor() {
    this.client = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
}

// ─── Response helpers ────────────────────────────────────────────────────────

interface SupabaseResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

/**
 * Extracts `data` from a Subabase response.
 * Logs the raw error message at ERROR level but **never** forwards it to the
 * HTTP response — the client only sees a generic 500.
 */
export function unwrap<T>(res: SupabaseResponse<T>, context = 'SupabaseService'): T {
  if (res.error) {
    new Logger(context).error(res.error.message);
    throw new InternalServerErrorException();
  }

  if (res.data === null) {
    new Logger(context).error('Unexpected null data in Subabase response');
    throw new InternalServerErrorException();
  }

  return res.data;
}

/**
 * Asserts no error on responses that carry no meaningful data (e.g. DELETE).
 */
export function assertNoError(res: { error: { message: string } | null }, context = 'SupabaseService'): void {
  if (res.error) {
    new Logger(context).error(res.error.message);
    throw new InternalServerErrorException();
  }
}
