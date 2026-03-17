import { supabase } from './supabase';
import { evaluateOutcome, type MatchResult } from './outcome-evaluator';
import { recordOutcome } from './performance-service';
import { editAlertResult } from './telegram';
import type { MatchSnapshot } from '@matchiq/shared-types';

/**
 * Returns true if the result for this outcome is "locked in" mid-game
 * and cannot change regardless of what happens next.
 *
 * Rules:
 *   OVER_*  + HIT  → permanent (once threshold crossed, can't un-cross)
 *   UNDER_* + MISS → permanent (once threshold exceeded, UNDER is dead)
 *   BTTS_YES / BTTS_1H_YES / BTTS_2H_YES + HIT → both scored, permanent
 *   BTTS_NO / BTTS_1H_NO / BTTS_2H_NO  + MISS → both scored, permanent
 *
 * Everything else (win/draw, double chance, win-by-1, most-goals, etc.)
 * can still reverse → let result-resolver handle at match end.
 */
function isResultStable(outcome: string, result: 'HIT' | 'MISS'): boolean {
  if (outcome.startsWith('OVER_') && result === 'HIT') return true;
  if (outcome.startsWith('UNDER_') && result === 'MISS') return true;
  if (
    (outcome === 'BTTS_YES' ||
      outcome === 'BTTS_1H_YES' ||
      outcome === 'BTTS_2H_YES') &&
    result === 'HIT'
  )
    return true;
  if (
    (outcome === 'BTTS_NO' ||
      outcome === 'BTTS_1H_NO' ||
      outcome === 'BTTS_2H_NO') &&
    result === 'MISS'
  )
    return true;
  return false;
}

/**
 * Builds a MatchResult from the current live snapshot.
 *
 * During the 1st half, halfTimeScore is not yet populated → we treat the
 * current running score AS the 1H score (since FT = 1H at that point).
 * During the 2nd half, halfTimeScore is available and homeSH is derived.
 */
function buildLiveMatchResult(
  match: MatchSnapshot,
  triggerScoreHome: number | null,
  triggerScoreAway: number | null,
  homeOdds: number | undefined,
  awayOdds: number | undefined,
): MatchResult {
  const minute = match.minute ?? 0;
  const inSecondHalf = minute > 45 && !match.isHalftime;

  // HT goals: use halfTimeScore if available, otherwise fall back to current
  // score (valid during 1H when halfTimeScore hasn't been set yet).
  const htHome = match.halfTimeScore?.home ?? (inSecondHalf ? 0 : match.homeScore);
  const htAway = match.halfTimeScore?.away ?? (inSecondHalf ? 0 : match.awayScore);

  const homeSH = inSecondHalf ? match.homeScore - htHome : 0;
  const awaySH = inSecondHalf ? match.awayScore - htAway : 0;

  // Corners
  const cornersHomeRaw = match.inPlay['home_corners'];
  const cornersAwayRaw = match.inPlay['away_corners'];
  const cornersHome = cornersHomeRaw !== undefined ? cornersHomeRaw : null;
  const cornersAway = cornersAwayRaw !== undefined ? cornersAwayRaw : null;

  // During 1H: current corners ARE the 1H corners.
  // During 2H: we don't know the 1H split from live data alone → null
  // (result-resolver will query the timeline for final resolution).
  const cornersHomeHT = !inSecondHalf ? cornersHome : null;
  const cornersAwayHT = !inSecondHalf ? cornersAway : null;

  // Cards (yellow + red combined)
  const yh = match.inPlay['home_yellow_cards'] ?? 0;
  const rh = match.inPlay['home_red_cards'] ?? 0;
  const ya = match.inPlay['away_yellow_cards'] ?? 0;
  const ra = match.inPlay['away_red_cards'] ?? 0;
  const cardsHome = yh + rh > 0 ? yh + rh : null;
  const cardsAway = ya + ra > 0 ? ya + ra : null;

  return {
    homeFinal: match.homeScore,
    awayFinal: match.awayScore,
    homeHT: htHome,
    awayHT: htAway,
    homeSH,
    awaySH,
    cornersHome,
    cornersAway,
    cornersHomeHT,
    cornersAwayHT,
    cardsHome,
    cardsAway,
    cardsHomeHT: null, // split not available live; result-resolver handles via timeline
    cardsAwayHT: null,
    homeAtTrigger: triggerScoreHome,
    awayAtTrigger: triggerScoreAway,
    cornersAtTrigger: null, // timeline query skipped here; result-resolver handles SP corners
    homeOdds,
    awayOdds,
  };
}

/**
 * Called every scan cycle for each live match.
 * Resolves pending triggers whose outcome is already permanently determined.
 */
export async function resolveLiveTriggers(match: MatchSnapshot): Promise<void> {
  const { data: triggers, error } = await supabase
    .from('triggers')
    .select(
      'id, strategy_id, minute, score_home, score_away, evidence_json, telegram_message_id, telegram_chat_id, strategies(desired_outcome)',
    )
    .eq('match_id', match.id)
    .is('result', null);

  if (error || !triggers || triggers.length === 0) return;

  for (const trigger of triggers) {
    const strategyRaw = trigger.strategies as unknown;
    const strategy = Array.isArray(strategyRaw)
      ? strategyRaw[0]
      : (strategyRaw as { desired_outcome: string | null } | null);
    const desiredOutcome = strategy?.desired_outcome;
    if (!desiredOutcome) continue;

    const evidence = trigger.evidence_json as Record<string, any> | null;
    const homeOdds = evidence?.odds?.prematch_home_win as number | undefined;
    const awayOdds = evidence?.odds?.prematch_away_win as number | undefined;

    const liveResult = buildLiveMatchResult(
      match,
      trigger.score_home ?? null,
      trigger.score_away ?? null,
      homeOdds,
      awayOdds,
    );

    const evaluation = evaluateOutcome(desiredOutcome, liveResult);
    if (evaluation === null) continue;
    if (!isResultStable(desiredOutcome, evaluation)) continue;

    await resolveNow(
      trigger.id,
      trigger.strategy_id,
      evaluation,
      (trigger as any).telegram_message_id as number | null,
      (trigger as any).telegram_chat_id as string | null,
      match.homeScore,
      match.awayScore,
    );
  }
}

async function resolveNow(
  triggerId: string,
  strategyId: string,
  result: 'HIT' | 'MISS',
  telegramMessageId: number | null,
  telegramChatId: string | null,
  homeScore: number,
  awayScore: number,
): Promise<void> {
  const { error } = await supabase
    .from('triggers')
    .update({ result })
    .eq('id', triggerId)
    .is('result', null); // never overwrite

  if (error) {
    console.error(`[LiveResolver] Failed to update trigger ${triggerId}:`, error);
    return;
  }

  console.log(`[LiveResolver] Trigger ${triggerId} → ${result} (live, score ${homeScore}-${awayScore})`);

  await recordOutcome(strategyId, result);

  if (telegramMessageId && telegramChatId) {
    await editAlertResult(telegramChatId, telegramMessageId, result, homeScore, awayScore);
  }
}
