import { supabase } from './supabase';
import type { MatchSnapshot } from '@matchiq/shared-types';

/**
 * Upserts the full inPlay stats for a live match at its current minute.
 * Called every scan cycle for every live fixture.
 * One row per (match_id, minute) — last scan at each minute wins.
 */
export async function upsertMatchStats(match: MatchSnapshot): Promise<void> {
  const minute = match.minute;
  if (minute < 0) return;

  const { error } = await supabase.from('match_stats_timeline').upsert(
    {
      match_id: match.id,
      minute,
      home_score: match.homeScore,
      away_score: match.awayScore,
      inplay: match.inPlay,
      captured_at: new Date().toISOString(),
    },
    { onConflict: 'match_id,minute' },
  );

  if (error) {
    console.error(
      `[StatsTimeline] Failed to upsert stats for match ${match.id} at minute ${minute}:`,
      error,
    );
  }
}

/**
 * Returns the stats snapshot closest to (and at or before) the given minute.
 * Used by the resolver to get 1st-half stats (query minute ≤ 45).
 */
export async function getStatsAtMinute(
  matchId: string,
  maxMinute: number,
): Promise<{
  minute: number;
  homeScore: number;
  awayScore: number;
  stats: Record<string, number>;
} | null> {
  const { data, error } = await supabase
    .from('match_stats_timeline')
    .select('minute, home_score, away_score, inplay')
    .eq('match_id', matchId)
    .lte('minute', maxMinute)
    .order('minute', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    minute: data.minute,
    homeScore: data.home_score,
    awayScore: data.away_score,
    stats: (data.inplay as Record<string, number>) ?? {},
  };
}

/**
 * Cleanup: deletes timeline rows older than the given number of days.
 * Call periodically (e.g. once a day) to keep the table small.
 */
export async function cleanupOldStats(olderThanDays = 14): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const { error, count } = await supabase
    .from('match_stats_timeline')
    .delete({ count: 'exact' })
    .lt('captured_at', cutoff.toISOString());

  if (error) {
    console.error('[StatsTimeline] Cleanup failed:', error);
  } else {
    console.log(`[StatsTimeline] Deleted ${count ?? 0} rows older than ${olderThanDays} days`);
  }
}
