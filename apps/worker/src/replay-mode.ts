import { supabase } from './supabase';
import { sendAlert } from './telegram';
import type { MatchSnapshot, EvaluationResult, TriggerEvidence, Trigger } from '@matchiq/shared-types';
import { config } from './config';

/**
 * Replay mode: Loads existing triggers from DB and re-sends alerts.
 * Useful for development/testing without calling API-Football.
 *
 * @param limit - Number of recent triggers to replay (default: 20)
 */
export async function replayMode(limit: number = 20): Promise<void> {
  console.log('[Replay] Starting replay mode...');
  console.log(`[Replay] Loading last ${limit} triggers from database`);
  console.log(`[Replay] Dry run: ${config.dryRun ? 'YES (no Telegram)' : 'NO (will send)'}`);

  try {
    // Load recent triggers with evidence
    const { data: triggers, error } = await supabase
      .from('triggers')
      .select('*')
      .order('triggered_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Replay] Failed to load triggers:', error);
      throw error;
    }

    if (!triggers || triggers.length === 0) {
      console.log('[Replay] No triggers found in database');
      return;
    }

    console.log(`[Replay] Found ${triggers.length} triggers`);
    console.log('');

    // Replay each trigger
    let sent = 0;
    for (const trigger of triggers as Trigger[]) {
      try {
        await replayTrigger(trigger);
        sent++;

        // Add delay to avoid rate limiting
        if (!config.dryRun) {
          await sleep(1000); // 1 second between alerts
        }
      } catch (error) {
        console.error(`[Replay] Failed to replay trigger ${trigger.id}:`, error);
        // Continue with next trigger
      }
    }

    console.log('');
    console.log(`[Replay] Complete. Replayed ${sent}/${triggers.length} triggers`);
  } catch (error) {
    console.error('[Replay] Replay failed:', error);
    throw error;
  }
}

/**
 * Replays a single trigger by reconstructing the match snapshot and evaluation result.
 */
async function replayTrigger(trigger: Trigger): Promise<void> {
  // Extract evidence
  const evidence = trigger.evidence_json as TriggerEvidence;

  // Load strategy name
  const { data: strategy, error: strategyError } = await supabase
    .from('strategies')
    .select('name')
    .eq('id', trigger.strategy_id)
    .single();

  if (strategyError) {
    console.error(`[Replay] Failed to load strategy ${trigger.strategy_id}:`, strategyError);
    throw strategyError;
  }

  const strategyName = strategy?.name || 'Unknown Strategy';

  // Reconstruct MatchSnapshot from evidence
  const match: MatchSnapshot = {
    id: trigger.match_id,
    homeTeam: trigger.home_team || 'Unknown Home',
    awayTeam: trigger.away_team || 'Unknown Away',
    homeScore: trigger.score_home || 0,
    awayScore: trigger.score_away || 0,
    minute: trigger.minute || 0,
    isLive: false, // Historical data, not live
    inPlay: evidence.stats || {},
    preMatch: {},
    odds: evidence.odds || {},
  };

  // Reconstruct EvaluationResult from evidence
  const result: EvaluationResult = {
    passed: true,
    matchedRules: evidence.matchedRules,
  };

  // Log the replay
  console.log(`[Replay] ${trigger.triggered_at} | ${strategyName}`);
  console.log(`         ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} (${match.minute}')`);
  console.log(`         Rules: ${evidence.matchedRules.map((r) => r.metric).join(', ')}`);

  // Send alert (or simulate)
  if (config.dryRun) {
    // Just format the message without sending
    const message = formatPreview(strategyName, match, result);
    console.log('');
    console.log('─────────────────────────────────────');
    console.log(message);
    console.log('─────────────────────────────────────');
    console.log('');
  } else {
    // Actually send to Telegram
    await sendAlert(strategyName, match, result);
    console.log(`         ✓ Alert sent to Telegram`);
  }
}

/**
 * Formats a preview of what the Telegram message would look like.
 * This duplicates logic from telegram.ts for DRY_RUN mode.
 */
function formatPreview(
  strategyName: string,
  match: MatchSnapshot,
  result: EvaluationResult,
): string {
  const lines: string[] = [];

  lines.push(`🚨 Strategy Triggered: ${strategyName}`);
  lines.push('');
  lines.push(`⚽ Match: ${match.homeTeam} vs ${match.awayTeam}`);
  lines.push(`📊 Score: ${match.homeScore} - ${match.awayScore}`);
  lines.push(`⏱ Minute: ${match.minute}'`);
  lines.push('');
  lines.push('✅ Matched Rules:');
  for (const rule of result.matchedRules) {
    lines.push(
      `  • ${rule.metric} ${rule.comparator} ${rule.target} (actual: ${rule.actual})`,
    );
  }

  return lines.join('\n');
}

/**
 * Sleep utility for rate limiting.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
