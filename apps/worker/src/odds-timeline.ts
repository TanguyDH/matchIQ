import { supabase } from './supabase';
import type { MatchSnapshot } from '@matchiq/shared-types';

/**
 * Upserts a snapshot of all live odds for a match at its current minute.
 * One row per (match_id, minute). Called every scan cycle.
 */
export async function upsertOddsSnapshot(match: MatchSnapshot): Promise<void> {
  const minute = match.minute;
  if (minute < 0 || Object.keys(match.odds).length === 0) return;

  const { error } = await supabase.from('match_odds_timeline').upsert(
    {
      match_id: match.id,
      minute,
      odds: match.odds,
      captured_at: new Date().toISOString(),
    },
    { onConflict: 'match_id,minute' },
  );

  if (error) {
    console.error(
      `[OddsTimeline] Failed to upsert odds for match ${match.id} at minute ${minute}:`,
      error,
    );
  }
}

/**
 * Returns the odds snapshot closest to (and at or before) the given minute.
 */
export async function getOddsAtMinute(
  matchId: string,
  maxMinute: number,
): Promise<Record<string, number> | null> {
  const { data, error } = await supabase
    .from('match_odds_timeline')
    .select('odds')
    .eq('match_id', matchId)
    .lte('minute', maxMinute)
    .order('minute', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.odds as Record<string, number>;
}
