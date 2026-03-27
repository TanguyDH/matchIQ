import { evaluateStrategy, extractWithTeamScope } from '@matchiq/rule-engine';
import type {
  StrategyWithRules,
  MatchSnapshot,
  Strategy,
  Rule,
  RuleValueType,
} from '@matchiq/shared-types';

type StrategyWithTelegram = StrategyWithRules & { telegramChatId?: string };
import { supabase } from './supabase';
import { ProviderService } from './provider-service';
import { createTrigger } from './trigger-service';
import { incrementTriggerCount } from './performance-service';
import { isDuplicateTrigger, markTriggerProcessed } from './redis';
import { sendAlertQueue } from './queues';
import { resolveFinishedMatches } from './result-resolver';
import { upsertMatchStats, getStatsAtMinute, getStatsDeltaBetween } from './stats-timeline';
import { upsertOddsSnapshot, getOddsAtMinute } from './odds-timeline';
import { resolveLiveTriggers } from './live-resolver';
import type { TimeFilter } from '@matchiq/shared-types';
import {
  analyzeDataRequirements,
  logDataRequirements,
  estimateApiCalls,
} from './data-requirements-analyzer';
import { config } from './config';

const providerService = new ProviderService();

// Pre-match odds don't change once a match starts — cache per fixture for the worker session.
const prematchOddsCache = new Map<string, Record<string, number>>();

/**
 * Main scanning logic.
 * Analyzes data requirements, fetches live fixtures, and processes candidates.
 */
export async function scanMatches(): Promise<void> {
  console.log('[Scanner] Starting scan cycle...');

  try {
    // 1. Load all active strategies (IN_PLAY + PRE_MATCH)
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
        const match = await providerService.normalizeToMatchSnapshot(fixture);

        // DEBUG: Log match data
        console.log(
          `[Scanner] Match ${fixture.id}: ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`,
        );
        console.log(`[Scanner] inPlay data keys:`, Object.keys(match.inPlay));
        console.log(`[Scanner] home_goals:`, match.inPlay.home_goals);
        console.log(`[Scanner] attacks (home/away):`, match.inPlay.home_attacks, '/', match.inPlay.away_attacks);
        console.log(`[Scanner] dangerous_attacks (home/away):`, match.inPlay.home_dangerous_attacks, '/', match.inPlay.away_dangerous_attacks);

        // Fetch and merge pre-match odds if strategies need ODDS rules
        if (requirements.needsOdds) {
          if (!prematchOddsCache.has(match.id)) {
            const pmOdds = await providerService.fetchPreMatchOddsData(fixture.id);
            if (Object.keys(pmOdds).length > 0) {
              prematchOddsCache.set(match.id, pmOdds);
              console.log(`[Scanner] Pre-match odds cached for fixture ${fixture.id}: ${Object.keys(pmOdds).length} keys`);
            }
          }
          const cachedOdds = prematchOddsCache.get(match.id);
          if (cachedOdds) Object.assign(match.odds, cachedOdds);
        }

        // Persist all live stats to timeline (one row per match per minute)
        await upsertMatchStats(match);

        // Persist live odds snapshot to timeline
        await upsertOddsSnapshot(match);

        // Resolve any pending triggers whose outcome is already locked in
        await resolveLiveTriggers(match);

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

    // Resolve HIT/MISS for triggers whose match has now finished
    await resolveFinishedMatches();
  } catch (error) {
    console.error('[Scanner] Scan failed:', error);
    // Don't throw - let the next cycle try again
  }
}

/**
 * Loads all active strategies with their rules.
 */
async function loadActiveStrategies(): Promise<StrategyWithTelegram[]> {
  const { data: strategies, error: strategiesError } = await supabase
    .from('strategies')
    .select('*')
    .eq('is_active', true)
    .in('alert_type', ['IN_PLAY', 'PRE_MATCH']);

  if (strategiesError) {
    console.error('[Scanner] Failed to load strategies:', strategiesError);
    throw strategiesError;
  }

  if (!strategies || strategies.length === 0) {
    return [];
  }

  // Batch-load telegram chat_ids for all unique user_ids
  const userIds = [...new Set(strategies.map((s) => s.user_id as string))];
  const { data: telegramRows } = await supabase
    .from('user_telegram')
    .select('user_id, chat_id')
    .in('user_id', userIds);

  const chatIdByUser: Record<string, string> = {};
  for (const row of telegramRows ?? []) {
    if (row.chat_id) chatIdByUser[row.user_id as string] = row.chat_id as string;
  }

  // Load rules for all strategies
  const strategiesWithRules: StrategyWithTelegram[] = [];
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
      telegramChatId: chatIdByUser[strategy.user_id as string],
    });
  }

  return strategiesWithRules;
}

/**
 * Extracts the timeline column key for a given metric + team_scope combination.
 * Used by resolveTimeFilteredValues to pick the right DB column.
 */
function timelineKeyForRule(rule: Rule): string | null {
  const { metric, team_scope } = rule;
  if (!team_scope || team_scope === 'TOTAL') {
    // TOTAL or no scope: caller sums home_ + away_
    return null; // handled separately
  }
  if (team_scope === 'HOME') return `home_${metric}`;
  if (team_scope === 'AWAY') return `away_${metric}`;
  return null; // Complex scopes (FAV, UND, etc.) not supported with time filter
}

/**
 * Extracts a numeric value from a timeline row for a given rule.
 * Handles HOME, AWAY, and TOTAL scopes.
 */
function extractFromTimelineRow(
  row: Record<string, number | null>,
  rule: Rule,
): number | null {
  const { metric, team_scope } = rule;
  const homeKey = `home_${metric}`;
  const awayKey = `away_${metric}`;

  if (!team_scope || team_scope === 'TOTAL') {
    const h = row[homeKey];
    const a = row[awayKey];
    if (typeof h === 'number' && typeof a === 'number') return h + a;
    return null;
  }
  if (team_scope === 'HOME') return typeof row[homeKey] === 'number' ? (row[homeKey] as number) : null;
  if (team_scope === 'AWAY') return typeof row[awayKey] === 'number' ? (row[awayKey] as number) : null;
  return null; // Complex scopes not supported with time filter
}

/**
 * Pre-computes time-filtered values for all rules that have an active time_filter.
 * Results are keyed by rule.id and passed to evaluateStrategy.
 * Uses a local cache to avoid duplicate timeline queries within the same call.
 */
async function resolveTimeFilteredValues(
  rules: Rule[],
  match: MatchSnapshot,
): Promise<Map<string, number> | undefined> {
  const inPlayRules = rules.filter(
    (r) => r.value_type === 'IN_PLAY' && r.time_filter && r.time_filter.mode !== 'off',
  );
  const oddsRules = rules.filter(
    (r) => r.value_type === 'ODDS' && r.time_filter && r.time_filter.mode !== 'off',
  );

  if (inPlayRules.length === 0 && oddsRules.length === 0) return undefined;

  const matchId = match.id;
  const currentMinute = match.minute ?? 0;

  const result = new Map<string, number>();

  // ── IN_PLAY: cumulative stats from timeline ────────────────────────────
  if (inPlayRules.length > 0) {
    // Cache: cacheKey → Promise<row | null> to avoid duplicate DB queries
    const rowCache = new Map<string, Promise<Record<string, number | null> | null>>();

    const getRow = (cacheKey: string, fetcher: () => Promise<Record<string, number | null> | null>) => {
      if (!rowCache.has(cacheKey)) rowCache.set(cacheKey, fetcher());
      return rowCache.get(cacheKey)!;
    };

    await Promise.all(
      inPlayRules.map(async (rule) => {
        const tf = rule.time_filter as TimeFilter;
        let row: Record<string, number | null> | null = null;

        switch (tf.mode) {
          case 'as_of_minute':
            row = await getRow(`abs_${tf.x}`, () => getStatsAtMinute(matchId, tf.x));
            break;

          case 'x_minutes_ago': {
            const target = currentMinute - tf.x;
            if (target < 0) return;
            row = await getRow(`abs_${target}`, () => getStatsAtMinute(matchId, target));
            break;
          }

          case 'as_of_halftime':
            row = await getRow('abs_45', () => getStatsAtMinute(matchId, 45));
            break;

          case 'between':
            if (tf.y > currentMinute) return; // y in future → skip
            row = await getRow(`delta_${tf.x}_${tf.y}`, () => getStatsDeltaBetween(matchId, tf.x, tf.y));
            break;

          case 'past_x': {
            const from = currentMinute - tf.x;
            if (from < 0) return;
            row = await getRow(`delta_${from}_${currentMinute}`, () =>
              getStatsDeltaBetween(matchId, from, currentMinute),
            );
            break;
          }

          case 'since_minute':
            row = await getRow(`delta_${tf.x}_${currentMinute}`, () =>
              getStatsDeltaBetween(matchId, tf.x, currentMinute),
            );
            break;

          case 'during_2nd_half':
            if (currentMinute <= 45) return; // not in 2nd half yet
            row = await getRow(`delta_45_${currentMinute}`, () =>
              getStatsDeltaBetween(matchId, 45, currentMinute),
            );
            break;
        }

        if (!row) return;
        const value = extractFromTimelineRow(row, rule);
        if (value !== null) result.set(rule.id, value);
      }),
    );
  }

  // ── ODDS: point-in-time odds snapshots ────────────────────────────────
  if (oddsRules.length > 0) {
    // Cache: targetMinute → Promise<odds | null>
    const oddsCache = new Map<number, Promise<Record<string, number> | null>>();

    const getOdds = (minute: number) => {
      if (!oddsCache.has(minute)) oddsCache.set(minute, getOddsAtMinute(matchId, minute));
      return oddsCache.get(minute)!;
    };

    await Promise.all(
      oddsRules.map(async (rule) => {
        const tf = rule.time_filter as TimeFilter;
        let targetMinute: number | null = null;

        switch (tf.mode) {
          case 'as_of_minute':
            targetMinute = tf.x;
            break;
          case 'x_minutes_ago': {
            const t = currentMinute - tf.x;
            if (t < 0) return;
            targetMinute = t;
            break;
          }
          case 'as_of_halftime':
            targetMinute = 45;
            break;
          default:
            return; // unsupported mode for ODDS
        }

        if (targetMinute === null) return;
        const odds = await getOdds(targetMinute);
        if (!odds) return;

        let value: number | null = null;
        if (!rule.team_scope) {
          value = odds[rule.metric] ?? null;
        } else {
          value = extractWithTeamScope(rule.metric, rule.team_scope, odds, match);
        }

        if (value !== null) result.set(rule.id, value);
      }),
    );
  }

  return result.size > 0 ? result : undefined;
}

/**
 * Evaluates a strategy against a match and triggers if it passes.
 */
async function evaluateAndTrigger(
  strategy: StrategyWithTelegram,
  match: MatchSnapshot,
  onTrigger: () => void,
): Promise<void> {
  try {
    // Skip if no rules
    if (strategy.rules.length === 0) {
      return;
    }

    // Skip if strategy has league filter and this match's league is not in the list
    const leagueIds = (strategy as StrategyWithTelegram & { league_ids?: number[] | null }).league_ids;
    if (leagueIds && leagueIds.length > 0 && match.leagueId !== undefined) {
      if (!leagueIds.includes(match.leagueId)) return;
    }

    // PHASE 6: Check Redis dedup FIRST (fast path)
    const isDuplicate = await isDuplicateTrigger(strategy.id, match.id);
    if (isDuplicate) {
      // Already processed - skip silently
      return;
    }

    // Pre-compute time-filtered values for rules that have a time_filter
    const timeFilteredValues = await resolveTimeFilteredValues(strategy.rules, match);

    // Evaluate using rule engine
    const result = evaluateStrategy(strategy, match, timeFilteredValues);

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
      triggerId,
      strategyName: strategy.name,
      match,
      result,
      telegramChatId: strategy.telegramChatId,
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
