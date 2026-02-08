# @matchiq/rule-engine

Pure rule evaluation engine for MatchIQ. Zero runtime dependencies, deterministic, side-effect free.

## Installation

This is a private workspace package. Import from other packages using:

```typescript
import { evaluateStrategy } from '@matchiq/rule-engine';
```

## Usage

```typescript
import { evaluateStrategy } from '@matchiq/rule-engine';
import type { StrategyWithRules, MatchSnapshot } from '@matchiq/shared-types';

// Load strategy with its rules
const strategy: StrategyWithRules = {
  id: 'strategy-1',
  name: 'High-scoring matches',
  rules: [
    {
      id: 'rule-1',
      metric: 'goals',
      team_scope: 'TOTAL',
      comparator: 'GTE',
      value: 3,
      value_type: 'IN_PLAY',
      // ... other fields
    },
  ],
  // ... other strategy fields
};

// Normalize match data into MatchSnapshot
const match: MatchSnapshot = {
  id: 'match-123',
  homeTeam: 'Team A',
  awayTeam: 'Team B',
  homeScore: 2,
  awayScore: 1,
  minute: 45,
  isLive: true,
  inPlay: {
    home_goals: 2,
    away_goals: 1,
    home_corners: 5,
    away_corners: 3,
  },
  preMatch: {},
  odds: {},
};

// Evaluate
const result = evaluateStrategy(strategy, match);

if (result.passed) {
  console.log('Strategy matched!');
  console.log('Matched rules:', result.matchedRules);
  // → Create trigger, send alert
} else {
  console.log('Strategy did not match');
  console.log('Failed at rule:', result.failedRuleId);
}
```

## API

### `evaluateStrategy(strategy, match)`

Evaluates a strategy against a match snapshot using AND logic (all rules must pass).

**Parameters:**
- `strategy: StrategyWithRules` - Strategy with its rules array
- `match: MatchSnapshot` - Normalized match data

**Returns:** `EvaluationResult`

```typescript
{
  passed: boolean;              // true if all rules passed
  failedRuleId?: string;        // ID of first failed rule (if any)
  matchedRules: Array<{         // Array of matched rules
    ruleId: string;
    metric: string;
    comparator: string;
    target: number;
    actual: number;             // Actual value from match
  }>;
}
```

## Comparators

| Comparator | Symbol | Description |
|------------|--------|-------------|
| `GTE` | `>=` | Greater than or equal |
| `LTE` | `<=` | Less than or equal |
| `EQ` | `=` | Equal |
| `GT` | `>` | Greater than |
| `LT` | `<` | Less than |
| `NEQ` | `!=` | Not equal |

## Team Scopes

Rules can specify a team scope to transform the metric value:

| Team Scope | Transformation |
|------------|----------------|
| `HOME` | Extract `home_{metric}` |
| `AWAY` | Extract `away_{metric}` |
| `TOTAL` | Sum `home_{metric} + away_{metric}` |
| `EITHER_TEAM` | Max of home and away |
| `EITHER_OPPONENT` | Min of home and away |
| `DIFFERENCE` | Absolute difference |
| `FAVOURITE` | Value of team with lower odds (proxy: higher score) |
| `FAVOURITE_HOME` | Favorite playing at home |
| `FAVOURITE_AWAY` | Favorite playing away |
| `UNDERDOG` | Value of team with higher odds (proxy: lower score) |
| `UNDERDOG_HOME` | Underdog playing at home |
| `UNDERDOG_AWAY` | Underdog playing away |
| `WINNING_TEAM` | Value of team currently winning |
| `LOSING_TEAM` | Value of team currently losing |

## Data Sources

Rules pull from different data sources based on `value_type`:

- `IN_PLAY` → `match.inPlay` (live statistics)
- `PRE_MATCH` → `match.preMatch` (historical/pre-match statistics)
- `ODDS` → `match.odds` (betting odds)

## Design Principles

1. **Pure functions** - No side effects, deterministic output
2. **Zero I/O** - No database access, no HTTP calls, no time reads
3. **Fail fast** - Evaluation stops at first failed rule
4. **Type safety** - Full TypeScript strict mode
5. **Testability** - Comprehensive unit tests (34 tests)

## Testing

```bash
npm test           # Run all tests
npm test:watch     # Watch mode
```

## Example: Multi-rule Strategy

```typescript
const strategy: StrategyWithRules = {
  id: 'strategy-1',
  name: 'Attacking Home Team',
  rules: [
    {
      id: 'rule-1',
      metric: 'goals',
      team_scope: 'HOME',
      comparator: 'GTE',
      value: 2,
      value_type: 'IN_PLAY',
    },
    {
      id: 'rule-2',
      metric: 'corners',
      team_scope: 'HOME',
      comparator: 'GT',
      value: 5,
      value_type: 'IN_PLAY',
    },
    {
      id: 'rule-3',
      metric: 'shots_on_target',
      team_scope: 'HOME',
      comparator: 'GTE',
      value: 8,
      value_type: 'IN_PLAY',
    },
  ],
  // ... other fields
};

const match: MatchSnapshot = {
  id: 'match-123',
  homeTeam: 'Team A',
  awayTeam: 'Team B',
  homeScore: 2,
  awayScore: 0,
  minute: 60,
  isLive: true,
  inPlay: {
    home_goals: 2,          // ✓ >= 2
    home_corners: 6,        // ✓ > 5
    home_shots_on_target: 9, // ✓ >= 8
  },
  preMatch: {},
  odds: {},
};

const result = evaluateStrategy(strategy, match);
// → result.passed === true
// → result.matchedRules.length === 3
```

## Phase 5 Integration

The worker will:
1. Poll live matches from provider API
2. Normalize provider data into `MatchSnapshot`
3. Load all active strategies from database
4. Call `evaluateStrategy()` for each strategy
5. If passed, create trigger and send Telegram alert
6. Use `matchedRules` to build alert message

## License

Private workspace package.
