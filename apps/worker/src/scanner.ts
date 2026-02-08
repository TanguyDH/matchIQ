import { evaluateStrategy } from '@matchiq/rule-engine';
import type {
  StrategyWithRules,
  MatchSnapshot,
  Strategy,
  Rule,
} from '@matchiq/shared-types';
import { supabase } from './supabase';
import { getLiveMatches } from './mock-provider';
import { createTrigger } from './trigger-service';
import { incrementTriggerCount } from './performance-service';
import { isDuplicateTrigger, markTriggerProcessed } from './redis';
import { sendAlertQueue } from './queues';

/**
 * Main scanning logic.
 * Polls live matches, loads active strategies, evaluates rules, and triggers alerts.
 */
export async function scanMatches(): Promise<void> {
  console.log('[Scanner] Starting scan cycle...');

  try {
    // 1. Fetch live matches
    const matches = getLiveMatches();
    if (matches.length === 0) {
      console.log('[Scanner] No live matches found');
      return;
    }

    // 2. Load all active IN_PLAY strategies
    // TODO: Filter by alert_type when PRE_MATCH is implemented
    const strategies = await loadActiveStrategies();
    if (strategies.length === 0) {
      console.log('[Scanner] No active strategies found');
      return;
    }

    console.log(
      `[Scanner] Evaluating ${strategies.length} strategies against ${matches.length} matches`,
    );

    // 3. Evaluate each strategy against each match
    let triggersCreated = 0;
    for (const strategy of strategies) {
      for (const match of matches) {
        await evaluateAndTrigger(strategy, match, () => {
          triggersCreated++;
        });
      }
    }

    console.log(`[Scanner] Scan complete. Triggers created: ${triggersCreated}`);
  } catch (error) {
    console.error('[Scanner] Scan failed:', error);
    // Don't throw - let the next cycle try again
  }
}

/**
 * Loads all active strategies with their rules.
 */
async function loadActiveStrategies(): Promise<StrategyWithRules[]> {
  const { data: strategies, error: strategiesError } = await supabase
    .from('strategies')
    .select('*')
    .eq('is_active', true)
    .eq('alert_type', 'IN_PLAY');

  if (strategiesError) {
    console.error('[Scanner] Failed to load strategies:', strategiesError);
    throw strategiesError;
  }

  if (!strategies || strategies.length === 0) {
    return [];
  }

  // Load rules for all strategies
  const strategiesWithRules: StrategyWithRules[] = [];
  for (const strategy of strategies) {
    const { data: rules, error: rulesError } = await supabase
      .from('rules')
      .select('*')
      .eq('strategy_id', strategy.id);

    if (rulesError) {
      console.error(
        `[Scanner] Failed to load rules for strategy ${strategy.id}:`,
        rulesError,
      );
      continue; // Skip this strategy
    }

    strategiesWithRules.push({
      ...(strategy as Strategy),
      rules: (rules as Rule[]) || [],
    });
  }

  return strategiesWithRules;
}

/**
 * Evaluates a strategy against a match and triggers if it passes.
 */
async function evaluateAndTrigger(
  strategy: StrategyWithRules,
  match: MatchSnapshot,
  onTrigger: () => void,
): Promise<void> {
  try {
    // Skip if no rules
    if (strategy.rules.length === 0) {
      return;
    }

    // PHASE 6: Check Redis dedup FIRST (fast path)
    const isDuplicate = await isDuplicateTrigger(strategy.id, match.id);
    if (isDuplicate) {
      // Already processed - skip silently
      return;
    }

    // Evaluate using rule engine
    const result = evaluateStrategy(strategy, match);

    if (!result.passed) {
      return; // Strategy didn't match
    }

    console.log(
      `[Scanner] ✓ Strategy "${strategy.name}" matched for match ${match.id}`,
    );

    // Create trigger (DB constraint as final gate)
    const triggerId = await createTrigger(strategy.id, match.id);
    if (!triggerId) {
      // Duplicate trigger - DB constraint caught it
      // Mark in Redis to prevent future checks
      await markTriggerProcessed(strategy.id, match.id);
      return;
    }

    // Mark as processed in Redis with TTL
    await markTriggerProcessed(strategy.id, match.id);

    // PHASE 6: Queue alert for async processing with retries
    await sendAlertQueue.add('send-alert', {
      strategyName: strategy.name,
      match,
      result,
    });

    // Update performance stats
    await incrementTriggerCount(strategy.id);

    onTrigger();
  } catch (error) {
    console.error(
      `[Scanner] Failed to process strategy "${strategy.name}" for match ${match.id}:`,
      error,
    );
    // Continue with next evaluation
  }
}
