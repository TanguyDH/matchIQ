import { supabase } from './supabase';
import { config } from './config';
import { evaluateOutcome } from './outcome-evaluator';
import { recordOutcome } from './performance-service';

/**
 * Fetches the final score of a finished fixture from SportMonks.
 * Returns null if the match is not finished yet or data is unavailable.
 */
async function fetchFinalScore(matchId: string): Promise<{
  homeFinal: number;
  awayFinal: number;
  homeHT: number;
  awayHT: number;
  isFinished: boolean;
} | null> {
  try {
    const url = `${config.sportmonks.baseUrl}/fixtures/${matchId}?api_token=${config.sportmonks.key}&include=scores;state`;
    const res = await fetch(url);

    if (!res.ok) {
      console.warn(`[ResultResolver] SportMonks ${res.status} for fixture ${matchId}`);
      return null;
    }

    const json = await res.json() as any;
    const fixture = json?.data;
    if (!fixture) return null;

    // state_id 5 = finished in SportMonks
    const isFinished = fixture.state_id === 5;

    const scores: any[] = fixture.scores ?? [];

    const ftHome = scores.find((s: any) => s.description === 'CURRENT' && s.score?.participant === 'home')?.score?.goals ?? 0;
    const ftAway = scores.find((s: any) => s.description === 'CURRENT' && s.score?.participant === 'away')?.score?.goals ?? 0;
    const htHome = scores.find((s: any) => s.description === 'HALFTIME' && s.score?.participant === 'home')?.score?.goals ?? 0;
    const htAway = scores.find((s: any) => s.description === 'HALFTIME' && s.score?.participant === 'away')?.score?.goals ?? 0;

    return {
      homeFinal: ftHome,
      awayFinal: ftAway,
      homeHT: htHome,
      awayHT: htAway,
      isFinished,
    };
  } catch (err) {
    console.error(`[ResultResolver] Failed to fetch fixture ${matchId}:`, err);
    return null;
  }
}

/**
 * Resolves HIT/MISS for all pending triggers whose match has finished.
 * Called at the end of each scan cycle.
 */
export async function resolveFinishedMatches(): Promise<void> {
  // Load all unresolved triggers (result IS NULL) with their strategy's desired_outcome
  const { data: triggers, error } = await supabase
    .from('triggers')
    .select('id, match_id, strategy_id, score_home, score_away, evidence_json, strategies(desired_outcome)')
    .is('result', null)
    .limit(50); // Process max 50 per cycle to avoid overloading the API

  if (error) {
    console.error('[ResultResolver] Failed to load pending triggers:', error);
    return;
  }

  if (!triggers || triggers.length === 0) return;

  console.log(`[ResultResolver] Checking ${triggers.length} unresolved trigger(s)...`);

  // Group triggers by match_id to avoid fetching the same fixture multiple times
  const byMatch = new Map<string, typeof triggers>();
  for (const trigger of triggers) {
    const list = byMatch.get(trigger.match_id) ?? [];
    list.push(trigger);
    byMatch.set(trigger.match_id, list);
  }

  for (const [matchId, matchTriggers] of byMatch) {
    const score = await fetchFinalScore(matchId);

    if (!score || !score.isFinished) {
      // Match not finished yet — skip
      continue;
    }

    console.log(
      `[ResultResolver] Match ${matchId} finished: ${score.homeFinal}-${score.awayFinal} (HT: ${score.homeHT}-${score.awayHT})`,
    );

    for (const trigger of matchTriggers) {
      const strategyRaw = trigger.strategies as unknown;
      const strategy = Array.isArray(strategyRaw) ? strategyRaw[0] : strategyRaw as { desired_outcome: string | null } | null;
      const desiredOutcome = strategy?.desired_outcome;

      if (!desiredOutcome) {
        // Strategy has no desired outcome — mark as MISS (no target to hit)
        await resolveTrigger(trigger.id, trigger.strategy_id, 'MISS');
        continue;
      }

      // Extract pre-match odds from evidence_json for FAV/UND resolution
      const evidence = trigger.evidence_json as Record<string, any> | null;
      const homeOdds = evidence?.odds?.prematch_home_win as number | undefined;
      const awayOdds = evidence?.odds?.prematch_away_win as number | undefined;

      const result = evaluateOutcome(desiredOutcome, {
        homeFinal: score.homeFinal,
        awayFinal: score.awayFinal,
        homeHT: score.homeHT,
        awayHT: score.awayHT,
        homeOdds,
        awayOdds,
      });

      if (result === null) {
        // Cannot evaluate — leave unresolved
        console.log(
          `[ResultResolver] Cannot evaluate outcome "${desiredOutcome}" for trigger ${trigger.id} — skipped`,
        );
        continue;
      }

      await resolveTrigger(trigger.id, trigger.strategy_id, result);
    }
  }
}

async function resolveTrigger(
  triggerId: string,
  strategyId: string,
  result: 'HIT' | 'MISS',
): Promise<void> {
  const { error } = await supabase
    .from('triggers')
    .update({ result })
    .eq('id', triggerId)
    .is('result', null); // Safety: never overwrite an already-resolved trigger

  if (error) {
    console.error(`[ResultResolver] Failed to update trigger ${triggerId}:`, error);
    return;
  }

  console.log(`[ResultResolver] Trigger ${triggerId} → ${result}`);

  await recordOutcome(strategyId, result);
}
