import { supabase } from './supabase';
import type { EvaluationResult, MatchSnapshot, TriggerEvidence } from '@matchiq/shared-types';

/**
 * Creates a trigger record in the database with evidence.
 * Enforces deduplication via DB unique constraint on (strategy_id, match_id).
 * Stores evidence data ONLY when trigger occurs (no continuous snapshots).
 *
 * @param strategyId - The strategy ID
 * @param match - The match snapshot
 * @param result - The evaluation result with matched rules
 * @returns The created trigger ID, or null if duplicate
 */
export async function createTrigger(
  strategyId: string,
  match: MatchSnapshot,
  result: EvaluationResult,
): Promise<string | null> {
  try {
    // Extract only the fields that were actually used in rule evaluation
    const usedMetrics = new Set(result.matchedRules.map((r) => r.metric));

    // Build relevant odds/stats subsets
    const relevantOdds: Record<string, number> = {};
    const relevantStats: Record<string, number> = {};

    for (const metric of usedMetrics) {
      // Check if metric exists in odds
      if (match.odds[metric] !== undefined) {
        relevantOdds[metric] = match.odds[metric];
      }
      // Check if metric exists in inPlay stats (includes home_*, away_* variants)
      if (match.inPlay[metric] !== undefined) {
        relevantStats[metric] = match.inPlay[metric];
      }
      // Also capture home_/away_ variants
      const homeKey = `home_${metric}`;
      const awayKey = `away_${metric}`;
      if (match.inPlay[homeKey] !== undefined) {
        relevantStats[homeKey] = match.inPlay[homeKey];
      }
      if (match.inPlay[awayKey] !== undefined) {
        relevantStats[awayKey] = match.inPlay[awayKey];
      }
    }

    // Build evidence JSON with only relevant data
    const evidence: TriggerEvidence = {
      strategyId,
      fixtureId: match.id,
      matchedRules: result.matchedRules,
      odds: Object.keys(relevantOdds).length > 0 ? relevantOdds : undefined,
      stats: Object.keys(relevantStats).length > 0 ? relevantStats : undefined,
      capturedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('triggers')
      .insert({
        strategy_id: strategyId,
        match_id: match.id,
        triggered_at: new Date().toISOString(),
        result: null, // Will be updated later when match ends
        minute: match.minute,
        home_team: match.homeTeam,
        away_team: match.awayTeam,
        score_home: match.homeScore,
        score_away: match.awayScore,
        league_id: null, // TODO: Extract from fixture data if available
        fixture_timestamp: null, // TODO: Extract from fixture data if available
        evidence_json: evidence,
      })
      .select('id')
      .single();

    if (error) {
      // Check if it's a unique constraint violation
      if (error.code === '23505') {
        // PostgreSQL unique violation code
        console.log(
          `[TriggerService] Duplicate trigger skipped: strategy=${strategyId}, match=${match.id}`,
        );
        return null;
      }
      throw error;
    }

    console.log(
      `[TriggerService] Trigger created: id=${data.id}, strategy=${strategyId}, match=${match.id}`,
    );
    return data.id;
  } catch (error) {
    console.error('[TriggerService] Failed to create trigger:', error);
    throw error;
  }
}
