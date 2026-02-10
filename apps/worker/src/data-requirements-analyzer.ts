import type { StrategyWithRules, RuleValueType } from '@matchiq/shared-types';

/**
 * Analysis result describing what data needs to be fetched.
 */
export interface DataRequirements {
  needsStats: boolean;        // Requires fixture statistics (IN_PLAY rules)
  needsOdds: boolean;         // Requires odds data (ODDS rules)
  needsPreMatch: boolean;     // Requires pre-match stats (PRE_MATCH rules)
  onlyBasicFixture: boolean;  // Only needs basic fixture data (no additional endpoints)
  ruleTypes: Set<RuleValueType>;
}

/**
 * Analyzes active strategies to determine what data needs to be fetched.
 * This prevents unnecessary API calls and respects rate limits.
 *
 * @param strategies - Active strategies with their rules
 * @returns Data requirements analysis
 */
export function analyzeDataRequirements(
  strategies: StrategyWithRules[],
): DataRequirements {
  const ruleTypes = new Set<RuleValueType>();

  // Collect all rule types across all strategies
  for (const strategy of strategies) {
    for (const rule of strategy.rules) {
      ruleTypes.add(rule.value_type);
    }
  }

  const needsStats = ruleTypes.has('IN_PLAY');
  const needsOdds = ruleTypes.has('ODDS');
  const needsPreMatch = ruleTypes.has('PRE_MATCH');
  const onlyBasicFixture = !needsStats && !needsOdds && !needsPreMatch;

  return {
    needsStats,
    needsOdds,
    needsPreMatch,
    onlyBasicFixture,
    ruleTypes,
  };
}

/**
 * Logs data requirements for debugging.
 */
export function logDataRequirements(requirements: DataRequirements): void {
  console.log('[DataAnalyzer] Requirements analysis:');
  console.log(`  Basic fixture data: always`);
  console.log(`  Statistics endpoint: ${requirements.needsStats ? 'YES' : 'NO'}`);
  console.log(`  Odds endpoint: ${requirements.needsOdds ? 'YES' : 'NO'}`);
  console.log(`  Pre-match endpoint: ${requirements.needsPreMatch ? 'YES' : 'NO'}`);
  console.log(`  Rule types: ${Array.from(requirements.ruleTypes).join(', ')}`);
}

/**
 * Estimates API calls for a scan cycle.
 *
 * @param fixtureCount - Number of fixtures to process
 * @param requirements - Data requirements
 * @returns Estimated API call count
 */
export function estimateApiCalls(
  fixtureCount: number,
  requirements: DataRequirements,
): number {
  let calls = 1; // fetchLiveFixtures()

  if (requirements.needsStats) {
    calls += fixtureCount; // fetchFixtureStats() per fixture
  }

  if (requirements.needsOdds) {
    calls += fixtureCount; // fetchFixtureOdds() per fixture
  }

  if (requirements.needsPreMatch) {
    calls += fixtureCount; // fetchPreMatchStats() per fixture
  }

  return calls;
}
