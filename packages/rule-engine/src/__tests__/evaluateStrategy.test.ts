import { evaluateStrategy } from '../index';
import type {
  MatchSnapshot,
  Rule,
  StrategyWithRules,
} from '@matchiq/shared-types';

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function createMockStrategy(rules: Rule[]): StrategyWithRules {
  return {
    id: 'strategy-1',
    user_id: 'user-1',
    name: 'Test Strategy',
    description: null,
    mode: 'EASY',
    alert_type: 'IN_PLAY',
    desired_outcome: null,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    rules,
  };
}

function createMockRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 'rule-1',
    strategy_id: 'strategy-1',
    value_type: 'IN_PLAY',
    metric: 'goals',
    comparator: 'GTE',
    value: 2,
    team_scope: null,
    time_filter: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function createMockMatch(overrides: Partial<MatchSnapshot> = {}): MatchSnapshot {
  return {
    id: 'match-1',
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    homeScore: 1,
    awayScore: 0,
    minute: 45,
    isLive: true,
    inPlay: {
      home_goals: 2,
      away_goals: 1,
      home_corners: 5,
      away_corners: 3,
      home_shots: 10,
      away_shots: 7,
    },
    preMatch: {},
    odds: {},
    ...overrides,
  };
}

// ─── Comparator Logic Tests ───────────────────────────────────────────────────

describe('Comparator Logic', () => {
  test('GTE (>=) should pass when actual >= target', () => {
    const rule = createMockRule({ comparator: 'GTE', value: 2 });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({ inPlay: { goals: 2 } });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
    expect(result.matchedRules).toHaveLength(1);
  });

  test('GTE (>=) should fail when actual < target', () => {
    const rule = createMockRule({ comparator: 'GTE', value: 3 });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({ inPlay: { goals: 2 } });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(false);
    expect(result.failedRuleId).toBe(rule.id);
  });

  test('LTE (<=) should pass when actual <= target', () => {
    const rule = createMockRule({ comparator: 'LTE', value: 2 });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({ inPlay: { goals: 1 } });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
  });

  test('LTE (<=) should fail when actual > target', () => {
    const rule = createMockRule({ comparator: 'LTE', value: 1 });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({ inPlay: { goals: 2 } });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(false);
  });

  test('EQ (=) should pass when actual === target', () => {
    const rule = createMockRule({ comparator: 'EQ', value: 2 });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({ inPlay: { goals: 2 } });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
  });

  test('EQ (=) should fail when actual !== target', () => {
    const rule = createMockRule({ comparator: 'EQ', value: 2 });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({ inPlay: { goals: 3 } });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(false);
  });

  test('GT (>) should pass when actual > target', () => {
    const rule = createMockRule({ comparator: 'GT', value: 2 });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({ inPlay: { goals: 3 } });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
  });

  test('GT (>) should fail when actual <= target', () => {
    const rule = createMockRule({ comparator: 'GT', value: 2 });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({ inPlay: { goals: 2 } });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(false);
  });

  test('LT (<) should pass when actual < target', () => {
    const rule = createMockRule({ comparator: 'LT', value: 3 });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({ inPlay: { goals: 2 } });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
  });

  test('LT (<) should fail when actual >= target', () => {
    const rule = createMockRule({ comparator: 'LT', value: 2 });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({ inPlay: { goals: 2 } });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(false);
  });

  test('NEQ (!=) should pass when actual !== target', () => {
    const rule = createMockRule({ comparator: 'NEQ', value: 2 });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({ inPlay: { goals: 3 } });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
  });

  test('NEQ (!=) should fail when actual === target', () => {
    const rule = createMockRule({ comparator: 'NEQ', value: 2 });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({ inPlay: { goals: 2 } });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(false);
  });
});

// ─── AND Rule Combination Tests ───────────────────────────────────────────────

describe('AND Rule Combination', () => {
  test('should pass when all rules match', () => {
    const rules = [
      createMockRule({ id: 'rule-1', metric: 'home_goals', comparator: 'GTE', value: 2 }),
      createMockRule({ id: 'rule-2', metric: 'away_goals', comparator: 'GTE', value: 1 }),
      createMockRule({ id: 'rule-3', metric: 'home_corners', comparator: 'GT', value: 4 }),
    ];
    const strategy = createMockStrategy(rules);
    const match = createMockMatch();

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
    expect(result.matchedRules).toHaveLength(3);
    expect(result.failedRuleId).toBeUndefined();
  });

  test('should fail when first rule fails', () => {
    const rules = [
      createMockRule({ id: 'rule-1', metric: 'home_goals', comparator: 'GTE', value: 5 }), // Fails
      createMockRule({ id: 'rule-2', metric: 'away_goals', comparator: 'GTE', value: 1 }),
    ];
    const strategy = createMockStrategy(rules);
    const match = createMockMatch();

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(false);
    expect(result.failedRuleId).toBe('rule-1');
    expect(result.matchedRules).toHaveLength(0);
  });

  test('should fail when middle rule fails', () => {
    const rules = [
      createMockRule({ id: 'rule-1', metric: 'home_goals', comparator: 'GTE', value: 2 }),
      createMockRule({ id: 'rule-2', metric: 'away_goals', comparator: 'GTE', value: 5 }), // Fails
      createMockRule({ id: 'rule-3', metric: 'home_corners', comparator: 'GT', value: 4 }),
    ];
    const strategy = createMockStrategy(rules);
    const match = createMockMatch();

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(false);
    expect(result.failedRuleId).toBe('rule-2');
    expect(result.matchedRules).toHaveLength(1); // Only first rule matched
  });

  test('should fail when last rule fails', () => {
    const rules = [
      createMockRule({ id: 'rule-1', metric: 'home_goals', comparator: 'GTE', value: 2 }),
      createMockRule({ id: 'rule-2', metric: 'away_goals', comparator: 'GTE', value: 1 }),
      createMockRule({ id: 'rule-3', metric: 'home_corners', comparator: 'GT', value: 10 }), // Fails
    ];
    const strategy = createMockStrategy(rules);
    const match = createMockMatch();

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(false);
    expect(result.failedRuleId).toBe('rule-3');
    expect(result.matchedRules).toHaveLength(2); // First two rules matched
  });

  test('should pass with single rule', () => {
    const rules = [createMockRule({ metric: 'home_goals', comparator: 'GTE', value: 2 })];
    const strategy = createMockStrategy(rules);
    const match = createMockMatch();

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
    expect(result.matchedRules).toHaveLength(1);
  });

  test('should pass with empty rules array', () => {
    const strategy = createMockStrategy([]);
    const match = createMockMatch();

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
    expect(result.matchedRules).toHaveLength(0);
  });

  test('should include correct metadata in matched rules', () => {
    const rules = [
      createMockRule({ id: 'rule-1', metric: 'home_goals', comparator: 'GTE', value: 2 }),
      createMockRule({ id: 'rule-2', metric: 'away_corners', comparator: 'EQ', value: 3 }),
    ];
    const strategy = createMockStrategy(rules);
    const match = createMockMatch();

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
    expect(result.matchedRules[0]).toEqual({
      ruleId: 'rule-1',
      metric: 'home_goals',
      comparator: 'GTE',
      target: 2,
      actual: 2,
    });
    expect(result.matchedRules[1]).toEqual({
      ruleId: 'rule-2',
      metric: 'away_corners',
      comparator: 'EQ',
      target: 3,
      actual: 3,
    });
  });
});

// ─── Team Scope Tests ─────────────────────────────────────────────────────────

describe('Team Scope Transformations', () => {
  test('HOME should extract home team value', () => {
    const rule = createMockRule({
      metric: 'goals',
      team_scope: 'HOME',
      comparator: 'GTE',
      value: 2,
    });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch();

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
    expect(result.matchedRules[0].actual).toBe(2); // home_goals
  });

  test('AWAY should extract away team value', () => {
    const rule = createMockRule({
      metric: 'goals',
      team_scope: 'AWAY',
      comparator: 'GTE',
      value: 1,
    });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch();

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
    expect(result.matchedRules[0].actual).toBe(1); // away_goals
  });

  test('TOTAL should sum home and away values', () => {
    const rule = createMockRule({
      metric: 'goals',
      team_scope: 'TOTAL',
      comparator: 'GTE',
      value: 3,
    });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch();

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
    expect(result.matchedRules[0].actual).toBe(3); // 2 + 1
  });

  test('EITHER_TEAM should return max of home and away', () => {
    const rule = createMockRule({
      metric: 'goals',
      team_scope: 'EITHER_TEAM',
      comparator: 'GTE',
      value: 2,
    });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch();

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
    expect(result.matchedRules[0].actual).toBe(2); // max(2, 1)
  });

  test('EITHER_OPPONENT should return min of home and away', () => {
    const rule = createMockRule({
      metric: 'goals',
      team_scope: 'EITHER_OPPONENT',
      comparator: 'GTE',
      value: 1,
    });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch();

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
    expect(result.matchedRules[0].actual).toBe(1); // min(2, 1)
  });

  test('DIFFERENCE should return absolute difference', () => {
    const rule = createMockRule({
      metric: 'goals',
      team_scope: 'DIFFERENCE',
      comparator: 'GTE',
      value: 1,
    });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch();

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
    expect(result.matchedRules[0].actual).toBe(1); // |2 - 1|
  });

  test('WINNING_TEAM should return value of team with higher score', () => {
    const rule = createMockRule({
      metric: 'shots',
      team_scope: 'WINNING_TEAM',
      comparator: 'GTE',
      value: 10,
    });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({ homeScore: 2, awayScore: 1 });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
    expect(result.matchedRules[0].actual).toBe(10); // home_shots (home is winning)
  });

  test('LOSING_TEAM should return value of team with lower score', () => {
    const rule = createMockRule({
      metric: 'shots',
      team_scope: 'LOSING_TEAM',
      comparator: 'GTE',
      value: 7,
    });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({ homeScore: 2, awayScore: 1 });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
    expect(result.matchedRules[0].actual).toBe(7); // away_shots (away is losing)
  });
});

// ─── Data Source Tests ────────────────────────────────────────────────────────

describe('Data Source Selection', () => {
  test('should use IN_PLAY data source for IN_PLAY rules', () => {
    const rule = createMockRule({
      value_type: 'IN_PLAY',
      metric: 'home_goals',
      comparator: 'GTE',
      value: 2,
    });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({
      inPlay: { home_goals: 2 },
      preMatch: { home_goals: 5 },
      odds: { home_goals: 10 },
    });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
    expect(result.matchedRules[0].actual).toBe(2); // From inPlay, not preMatch or odds
  });

  test('should use PRE_MATCH data source for PRE_MATCH rules', () => {
    const rule = createMockRule({
      value_type: 'PRE_MATCH',
      metric: 'home_goals',
      comparator: 'GTE',
      value: 5,
    });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({
      inPlay: { home_goals: 2 },
      preMatch: { home_goals: 5 },
      odds: { home_goals: 10 },
    });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
    expect(result.matchedRules[0].actual).toBe(5); // From preMatch
  });

  test('should use ODDS data source for ODDS rules', () => {
    const rule = createMockRule({
      value_type: 'ODDS',
      metric: 'home_win',
      comparator: 'LTE',
      value: 2.5,
    });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({
      inPlay: {},
      preMatch: {},
      odds: { home_win: 2.1 },
    });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
    expect(result.matchedRules[0].actual).toBe(2.1);
  });
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe('Edge Cases', () => {
  test('should fail when metric is missing from data source', () => {
    const rule = createMockRule({ metric: 'nonexistent_metric' });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch();

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(false);
    expect(result.failedRuleId).toBe(rule.id);
  });

  test('should handle zero values correctly', () => {
    const rule = createMockRule({
      metric: 'home_goals',
      comparator: 'EQ',
      value: 0,
    });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({ inPlay: { home_goals: 0 } });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
  });

  test('should handle negative values correctly', () => {
    const rule = createMockRule({
      metric: 'goal_difference',
      comparator: 'LT',
      value: 0,
    });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({ inPlay: { goal_difference: -1 } });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
  });

  test('should handle decimal values correctly', () => {
    const rule = createMockRule({
      metric: 'xg',
      comparator: 'GTE',
      value: 1.5,
    });
    const strategy = createMockStrategy([rule]);
    const match = createMockMatch({ inPlay: { xg: 1.8 } });

    const result = evaluateStrategy(strategy, match);
    expect(result.passed).toBe(true);
  });
});
