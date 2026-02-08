// Pure rule-engine — zero runtime deps on NestJS / Supabase / Redis.
// Evaluation contract implemented in Phase 4.

import type {
  Comparator,
  EvaluationResult,
  MatchSnapshot,
  Rule,
  StrategyWithRules,
  TeamScope,
} from '@matchiq/shared-types';

/**
 * Evaluates a strategy against a match snapshot.
 * Pure function with no side effects.
 *
 * @param strategy - Strategy with its rules
 * @param match - Normalized match snapshot
 * @returns Structured evaluation result
 */
export function evaluateStrategy(
  strategy: StrategyWithRules,
  match: MatchSnapshot,
): EvaluationResult {
  const matchedRules: EvaluationResult['matchedRules'] = [];

  // AND logic: all rules must pass
  for (const rule of strategy.rules) {
    const actual = extractMetricValue(rule, match);

    // If we can't extract the value, the rule fails
    if (actual === null) {
      return {
        passed: false,
        failedRuleId: rule.id,
        matchedRules,
      };
    }

    const passed = evaluateComparator(rule.comparator, actual, rule.value);

    if (passed) {
      matchedRules.push({
        ruleId: rule.id,
        metric: rule.metric,
        comparator: rule.comparator,
        target: rule.value,
        actual,
      });
    } else {
      // First failed rule stops evaluation (AND logic)
      return {
        passed: false,
        failedRuleId: rule.id,
        matchedRules,
      };
    }
  }

  // All rules passed
  return {
    passed: true,
    matchedRules,
  };
}

/**
 * Extracts the metric value from the match snapshot based on the rule.
 * Handles team scope transformations.
 *
 * @param rule - The rule to extract value for
 * @param match - The match snapshot
 * @returns The extracted value, or null if not found
 */
function extractMetricValue(rule: Rule, match: MatchSnapshot): number | null {
  let dataSource: Record<string, number>;

  // Select the correct data source based on value_type
  switch (rule.value_type) {
    case 'IN_PLAY':
      dataSource = match.inPlay;
      break;
    case 'PRE_MATCH':
      dataSource = match.preMatch;
      break;
    case 'ODDS':
      dataSource = match.odds;
      break;
    default:
      return null;
  }

  // If no team scope, return the metric value directly
  if (!rule.team_scope) {
    return dataSource[rule.metric] ?? null;
  }

  // Handle team scope transformations
  return extractWithTeamScope(rule.metric, rule.team_scope, dataSource, match);
}

/**
 * Extracts a metric value with team scope transformation.
 *
 * @param metric - The base metric name
 * @param teamScope - The team scope to apply
 * @param dataSource - The data source (inPlay, preMatch, or odds)
 * @param match - The match snapshot (for score-based team scopes)
 * @returns The extracted value, or null if not found
 */
function extractWithTeamScope(
  metric: string,
  teamScope: TeamScope,
  dataSource: Record<string, number>,
  match: MatchSnapshot,
): number | null {
  const homeKey = `home_${metric}`;
  const awayKey = `away_${metric}`;

  switch (teamScope) {
    case 'HOME':
      return dataSource[homeKey] ?? null;

    case 'AWAY':
      return dataSource[awayKey] ?? null;

    case 'TOTAL': {
      const homeValue = dataSource[homeKey];
      const awayValue = dataSource[awayKey];
      if (homeValue === undefined || awayValue === undefined) return null;
      return homeValue + awayValue;
    }

    case 'EITHER_TEAM': {
      const homeValue = dataSource[homeKey];
      const awayValue = dataSource[awayKey];
      if (homeValue === undefined || awayValue === undefined) return null;
      return Math.max(homeValue, awayValue);
    }

    case 'EITHER_OPPONENT': {
      const homeValue = dataSource[homeKey];
      const awayValue = dataSource[awayKey];
      if (homeValue === undefined || awayValue === undefined) return null;
      return Math.min(homeValue, awayValue);
    }

    case 'DIFFERENCE': {
      const homeValue = dataSource[homeKey];
      const awayValue = dataSource[awayKey];
      if (homeValue === undefined || awayValue === undefined) return null;
      return Math.abs(homeValue - awayValue);
    }

    case 'FAVOURITE': {
      // Favorite is the team with lower odds (higher probability)
      // TODO: This requires odds data - for now, use score as proxy
      const homeValue = dataSource[homeKey];
      const awayValue = dataSource[awayKey];
      if (homeValue === undefined || awayValue === undefined) return null;
      return match.homeScore >= match.awayScore ? homeValue : awayValue;
    }

    case 'FAVOURITE_HOME': {
      // Favorite playing at home
      const homeValue = dataSource[homeKey];
      if (homeValue === undefined) return null;
      return match.homeScore >= match.awayScore ? homeValue : 0;
    }

    case 'FAVOURITE_AWAY': {
      // Favorite playing away
      const awayValue = dataSource[awayKey];
      if (awayValue === undefined) return null;
      return match.awayScore > match.homeScore ? awayValue : 0;
    }

    case 'UNDERDOG': {
      // Underdog is the team with higher odds (lower probability)
      const homeValue = dataSource[homeKey];
      const awayValue = dataSource[awayKey];
      if (homeValue === undefined || awayValue === undefined) return null;
      return match.homeScore < match.awayScore ? homeValue : awayValue;
    }

    case 'UNDERDOG_HOME': {
      // Underdog playing at home
      const homeValue = dataSource[homeKey];
      if (homeValue === undefined) return null;
      return match.homeScore < match.awayScore ? homeValue : 0;
    }

    case 'UNDERDOG_AWAY': {
      // Underdog playing away
      const awayValue = dataSource[awayKey];
      if (awayValue === undefined) return null;
      return match.awayScore >= match.homeScore ? awayValue : 0;
    }

    case 'WINNING_TEAM': {
      const homeValue = dataSource[homeKey];
      const awayValue = dataSource[awayKey];
      if (homeValue === undefined || awayValue === undefined) return null;
      if (match.homeScore > match.awayScore) return homeValue;
      if (match.awayScore > match.homeScore) return awayValue;
      return 0; // Draw
    }

    case 'LOSING_TEAM': {
      const homeValue = dataSource[homeKey];
      const awayValue = dataSource[awayKey];
      if (homeValue === undefined || awayValue === undefined) return null;
      if (match.homeScore < match.awayScore) return homeValue;
      if (match.awayScore < match.homeScore) return awayValue;
      return 0; // Draw
    }

    default:
      return null;
  }
}

/**
 * Evaluates a comparator against two values.
 *
 * @param comparator - The comparison operator
 * @param actual - The actual value from the match
 * @param target - The target value from the rule
 * @returns True if the comparison passes
 */
function evaluateComparator(
  comparator: Comparator,
  actual: number,
  target: number,
): boolean {
  switch (comparator) {
    case 'GTE':
      return actual >= target;
    case 'LTE':
      return actual <= target;
    case 'EQ':
      return actual === target;
    case 'GT':
      return actual > target;
    case 'LT':
      return actual < target;
    case 'NEQ':
      return actual !== target;
    default:
      return false;
  }
}
