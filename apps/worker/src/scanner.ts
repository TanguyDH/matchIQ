import { evaluateStrategy } from '@matchiq/rule-engine';
import type {
  StrategyWithRules,
  MatchSnapshot,
  Strategy,
  Rule,
  RuleValueType,
} from '@matchiq/shared-types';
import { supabase } from './supabase';
import { ProviderService } from './provider-service';
import { createTrigger } from './trigger-service';
import { incrementTriggerCount } from './performance-service';
import { isDuplicateTrigger, markTriggerProcessed } from './redis';
import { sendAlertQueue } from './queues';
import {
  analyzeDataRequirements,
  logDataRequirements,
  estimateApiCalls,
} from './data-requirements-analyzer';
import { config } from './config';

const providerService = new ProviderService();

/**
 * Main scanning logic.
 * Analyzes data requirements, fetches live fixtures, and processes candidates.
 */
export async function scanMatches(): Promise<void> {
  console.log('[Scanner] Starting scan cycle...');

  try {
    // 1. Load all active IN_PLAY strategies
    const strategies = await loadActiveStrategies();
    if (strategies.length === 0) {
      console.log('[Scanner] No active strategies found');
      return;
    }

    // 2. Analyze data requirements BEFORE fetching
    const requirements = analyzeDataRequirements(strategies);
    logDataRequirements(requirements);

    // 3. Fetch live fixtures from API-Football
    const allFixtures = await providerService.fetchLiveFixtures();
    if (allFixtures.length === 0) {
      console.log('[Scanner] No live matches found');
      return;
    }

    // 4. Limit fixtures to process (respects rate limits)
    const fixtureLimit = config.fixtureLimit;
    const fixtures = allFixtures.slice(0, fixtureLimit);

    console.log(
      `[Scanner] Found ${allFixtures.length} live fixtures, processing ${fixtures.length} (limit: ${fixtureLimit})`,
    );
    console.log(
      `[Scanner] Evaluating ${strategies.length} strategies`,
    );

    // 5. Estimate API calls
    const estimatedCalls = estimateApiCalls(fixtures.length, requirements);
    console.log(`[Scanner] Estimated API calls: ${estimatedCalls}`);

    // 6. Process each fixture
    let triggersCreated = 0;
    for (const fixture of fixtures) {
      try {
        // SportMonks includes statistics in the fixture response by default
        // No need to fetch separately if we use proper includes in the API call

        // Normalize to MatchSnapshot (SportMonks structure)
        const match = providerService.normalizeToMatchSnapshot(fixture);

        // DEBUG: Log match data
        console.log(
          `[Scanner] Match ${fixture.id}: ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`,
        );
        console.log(`[Scanner] inPlay data keys:`, Object.keys(match.inPlay));
        console.log(`[Scanner] home_goals:`, match.inPlay.home_goals);
        console.log(`[Scanner] attacks (home/away):`, match.inPlay.home_attacks, '/', match.inPlay.away_attacks);
        console.log(`[Scanner] dangerous_attacks (home/away):`, match.inPlay.home_dangerous_attacks, '/', match.inPlay.away_dangerous_attacks);

        // Evaluate against all strategies
        for (const strategy of strategies) {
          await evaluateAndTrigger(strategy, match, () => {
            triggersCreated++;
          });
        }
      } catch (error) {
        console.error(
          `[Scanner] Failed to process fixture ${fixture.id}:`,
          error,
        );
        // Continue with next fixture
      }
    }

    console.log(`[Scanner] Scan complete. Triggers created: ${triggersCreated}`);
    console.log(
      `[Scanner] Skipped ${allFixtures.length - fixtures.length} fixtures due to limit`,
    );
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

    console.log(
      `[Scanner] Strategy "${strategy.name}" evaluation: passed=${result.passed}, failedRuleId=${result.failedRuleId}`,
    );

    if (!result.passed) {
      return; // Strategy didn't match
    }

    console.log(
      `[Scanner] ✓ Strategy "${strategy.name}" matched for match ${match.id}`,
    );

    // Create trigger with evidence (DB constraint as final gate)
    const triggerId = await createTrigger(strategy.id, match, result);
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
