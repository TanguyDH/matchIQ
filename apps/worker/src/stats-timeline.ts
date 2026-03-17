import { supabase } from './supabase';
import type { MatchSnapshot } from '@matchiq/shared-types';

// Maps inPlay keys (prefixed with home_/away_) to DB column names
const STAT_KEYS = [
  'shots_total',
  'shots_on_target',
  'shots_off_target',
  'shots_inside_box',
  'shots_outside_box',
  'shots_blocked',
  'goal_attempts',
  'corners',
  'yellow_cards',
  'red_cards',
  'possession',
  'passes_total',
  'passes_accurate',
  'passes_percentage',
  'long_passes',
  'long_passes_accurate',
  'long_passes_percentage',
  'key_passes',
  'attacks',
  'dangerous_attacks',
  'counter_attacks',
  'big_chances',
  'big_chances_missed',
  'fouls',
  'offsides',
  'free_kicks',
  'saves',
  'tackles',
  'interceptions',
  'successful_headers',
  'successful_dribbles',
  'dribbles_percentage',
  'crosses',
  'crosses_accurate',
  'assists',
  'ball_safe',
] as const;

type StatKey = (typeof STAT_KEYS)[number];

type TimelineRow = {
  match_id: string;
  minute: number;
  home_score: number;
  away_score: number;
  captured_at: string;
} & Partial<Record<`home_${StatKey}` | `away_${StatKey}`, number>>;

/**
 * Upserts all live stats for a match at its current minute.
 * Called every scan cycle (~30s). One row per (match_id, minute).
 */
export async function upsertMatchStats(match: MatchSnapshot): Promise<void> {
  const minute = match.minute;
  if (minute < 0) return;

  const row: TimelineRow = {
    match_id: match.id,
    minute,
    home_score: match.homeScore,
    away_score: match.awayScore,
    captured_at: new Date().toISOString(),
  };

  for (const key of STAT_KEYS) {
    const homeVal = match.inPlay[`home_${key}`];
    const awayVal = match.inPlay[`away_${key}`];
    if (homeVal !== undefined) row[`home_${key}`] = homeVal;
    if (awayVal !== undefined) row[`away_${key}`] = awayVal;
  }

  const { error } = await supabase
    .from('match_stats_timeline')
    .upsert(row as any, { onConflict: 'match_id,minute' });

  if (error) {
    console.error(
      `[StatsTimeline] Failed to upsert match ${match.id} at minute ${minute}:`,
      error,
    );
  }
}

/**
 * Returns the stats row closest to (and at or before) the given minute.
 * Used by the resolver to get 1st-half stats (maxMinute = 45).
 */
export async function getStatsAtMinute(
  matchId: string,
  maxMinute: number,
): Promise<Record<string, number | null> | null> {
  const { data, error } = await supabase
    .from('match_stats_timeline')
    .select('*')
    .eq('match_id', matchId)
    .lte('minute', maxMinute)
    .order('minute', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return data as Record<string, number | null>;
}

/**
 * Returns the delta of each stat column between two minutes.
 * delta = value at toMinute - value at fromMinute (cumulative stats).
 * Returns null if either boundary row is missing.
 */
export async function getStatsDeltaBetween(
  matchId: string,
  fromMinute: number,
  toMinute: number,
): Promise<Record<string, number | null> | null> {
  if (fromMinute < 0 || toMinute < fromMinute) return null;

  const [from, to] = await Promise.all([
    getStatsAtMinute(matchId, fromMinute),
    getStatsAtMinute(matchId, toMinute),
  ]);

  if (!from || !to) return null;

  const delta: Record<string, number | null> = {};
  for (const key of Object.keys(to)) {
    if (key === 'match_id' || key === 'minute' || key === 'captured_at') continue;
    const toVal = to[key];
    const fromVal = from[key];
    if (typeof toVal === 'number' && typeof fromVal === 'number') {
      delta[key] = toVal - fromVal;
    } else {
      delta[key] = null;
    }
  }
  return delta;
}

/**
 * Cleanup: deletes rows older than the given number of days.
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
    console.log(
      `[StatsTimeline] Deleted ${count ?? 0} rows older than ${olderThanDays} days`,
    );
  }
}
