// Pure rule-engine — zero runtime deps on NestJS / Supabase / Redis.
// Evaluation contract implemented in Phase 4.

import type {
  Comparator,
  EvaluationResult,
  MatchSnapshot,
  MathOp,
  Rule,
  RuleExpression,
  RuleValue,
  StrategyWithRules,
  TeamScope,
} from '@matchiq/shared-types';
import { extractInPlayMetric, extractPreMatchMetric } from './metrics-logic';

// Export for testing and external use
export { extractInPlayMetric, extractPreMatchMetric } from './metrics-logic';
export { extractWithTeamScope };

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
  timeFilteredValues?: Map<string, number>,
): EvaluationResult {
  const matchedRules: EvaluationResult['matchedRules'] = [];

  // AND logic: all rules must pass
  for (const rule of strategy.rules) {
    const actual = rule.lhs_json
      ? evaluateExpression(rule.lhs_json, match, timeFilteredValues)
      : extractMetricValue(rule, match, timeFilteredValues);

    // If we can't extract the value, the rule fails
    if (actual === null) {
      return {
        passed: false,
        failedRuleId: rule.id,
        matchedRules,
      };
    }

    const target = rule.rhs_json
      ? (evaluateExpression(rule.rhs_json, match, timeFilteredValues) ?? rule.value)
      : rule.value;

    const passed = evaluateComparator(rule.comparator, actual, target);

    if (passed) {
      matchedRules.push({
        ruleId: rule.id,
        metric: rule.metric,
        comparator: rule.comparator,
        target,
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
function extractMetricValue(
  rule: Rule,
  match: MatchSnapshot,
  timeFilteredValues?: Map<string, number>,
): number | null {
  // Use dedicated logic for IN_PLAY metrics
  if (rule.value_type === 'IN_PLAY') {
    // If a time_filter is active, use the pre-computed value from the scanner
    if (rule.time_filter && rule.time_filter.mode !== 'off') {
      if (timeFilteredValues?.has(rule.id)) {
        return timeFilteredValues.get(rule.id)!;
      }
      // time_filter configured but no pre-computed value available → fail
      return null;
    }
    return extractInPlayMetric(rule, match);
  }

  // Use dedicated logic for PRE_MATCH metrics
  if (rule.value_type === 'PRE_MATCH') {
    return extractPreMatchMetric(rule, match);
  }

  // Fallback for ODDS (generic extraction)
  if (rule.value_type === 'ODDS') {
    // If a time_filter is active, use the pre-computed value from the scanner
    if (rule.time_filter && rule.time_filter.mode !== 'off') {
      if (timeFilteredValues?.has(rule.id)) {
        return timeFilteredValues.get(rule.id)!;
      }
      // time_filter configured but no pre-computed value available → fail
      return null;
    }

    const dataSource = match.odds;

    // If no team scope, return the metric value directly
    if (!rule.team_scope) {
      return dataSource[rule.metric] ?? null;
    }

    // Handle team scope transformations
    return extractWithTeamScope(rule.metric, rule.team_scope, dataSource, match);
  }

  return null;
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
      // Favourite = team with lower pre-match 1X2 odds (higher probability)
      const homeValue = dataSource[homeKey];
      const awayValue = dataSource[awayKey];
      if (homeValue === undefined || awayValue === undefined) return null;
      const homeOddsVal = match.odds['home_pm_odds_1x2'];
      const awayOddsVal = match.odds['away_pm_odds_1x2'];
      if (homeOddsVal !== undefined && awayOddsVal !== undefined) {
        return homeOddsVal <= awayOddsVal ? homeValue : awayValue;
      }
      // Fallback: home team is conventional favourite
      return homeValue;
    }

    case 'FAVOURITE_HOME': {
      // Favourite playing at home — return homeValue only if home is the favourite
      const homeValue = dataSource[homeKey];
      if (homeValue === undefined) return null;
      const homeOddsVal = match.odds['home_pm_odds_1x2'];
      const awayOddsVal = match.odds['away_pm_odds_1x2'];
      if (homeOddsVal !== undefined && awayOddsVal !== undefined) {
        return homeOddsVal <= awayOddsVal ? homeValue : 0;
      }
      return homeValue; // fallback: home is conventional favourite
    }

    case 'FAVOURITE_AWAY': {
      // Favourite playing away — return awayValue only if away is the favourite
      const awayValue = dataSource[awayKey];
      if (awayValue === undefined) return null;
      const homeOddsVal = match.odds['home_pm_odds_1x2'];
      const awayOddsVal = match.odds['away_pm_odds_1x2'];
      if (homeOddsVal !== undefined && awayOddsVal !== undefined) {
        return awayOddsVal <= homeOddsVal ? awayValue : 0;
      }
      return 0; // fallback: away is not conventional favourite
    }

    case 'UNDERDOG': {
      // Underdog = team with higher pre-match 1X2 odds (lower probability)
      const homeValue = dataSource[homeKey];
      const awayValue = dataSource[awayKey];
      if (homeValue === undefined || awayValue === undefined) return null;
      const homeOddsVal = match.odds['home_pm_odds_1x2'];
      const awayOddsVal = match.odds['away_pm_odds_1x2'];
      if (homeOddsVal !== undefined && awayOddsVal !== undefined) {
        return homeOddsVal > awayOddsVal ? homeValue : awayValue;
      }
      // Fallback: away team is conventional underdog
      return awayValue;
    }

    case 'UNDERDOG_HOME': {
      // Underdog playing at home — return homeValue only if home is the underdog
      const homeValue = dataSource[homeKey];
      if (homeValue === undefined) return null;
      const homeOddsVal = match.odds['home_pm_odds_1x2'];
      const awayOddsVal = match.odds['away_pm_odds_1x2'];
      if (homeOddsVal !== undefined && awayOddsVal !== undefined) {
        return homeOddsVal > awayOddsVal ? homeValue : 0;
      }
      return 0; // fallback: home is not conventional underdog
    }

    case 'UNDERDOG_AWAY': {
      // Underdog playing away — return awayValue only if away is the underdog
      const awayValue = dataSource[awayKey];
      if (awayValue === undefined) return null;
      const homeOddsVal = match.odds['home_pm_odds_1x2'];
      const awayOddsVal = match.odds['away_pm_odds_1x2'];
      if (homeOddsVal !== undefined && awayOddsVal !== undefined) {
        return awayOddsVal > homeOddsVal ? awayValue : 0;
      }
      return awayValue; // fallback: away is conventional underdog
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
 * Evaluates a single RuleValue to a number.
 */
function evaluateRuleValue(
  rv: RuleValue,
  match: MatchSnapshot,
  timeFilteredValues?: Map<string, number>,
): number | null {
  if (rv.kind === 'number') return rv.number ?? null;
  if (rv.kind === 'metric' && rv.metric && rv.value_type) {
    const pseudoRule: Rule = {
      id: '',
      strategy_id: '',
      value_type: rv.value_type,
      metric: rv.metric,
      comparator: 'GTE',
      value: 0,
      team_scope: rv.team_scope ?? null,
      time_filter: rv.time_filter ?? null,
      created_at: '',
    };
    return extractMetricValue(pseudoRule, match, timeFilteredValues);
  }
  return null;
}

/**
 * Evaluates a RuleExpression to a number.
 */
function evaluateExpression(
  expr: RuleExpression,
  match: MatchSnapshot,
  timeFilteredValues?: Map<string, number>,
): number | null {
  const leftVal = evaluateRuleValue(expr.left, match, timeFilteredValues);
  if (leftVal === null) return null;
  if (!expr.op || !expr.right) return leftVal;

  const rightVal = evaluateRuleValue(expr.right, match, timeFilteredValues);
  if (rightVal === null) return null;

  switch (expr.op) {
    case '+':
      return leftVal + rightVal;
    case '-':
      return leftVal - rightVal;
    case '*':
      return leftVal * rightVal;
    case '/':
      return rightVal === 0 ? null : leftVal / rightVal;
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
