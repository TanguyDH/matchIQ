# agent.md — MatchIQ Football Strategy Scanner

> Single source of truth for architecture and conventions.
> Follow literally. Any deviation is a bug.

---

## 0) Current State

**Fully implemented and operational:**

✅ Monorepo (npm workspaces)
✅ Next.js 15 Web App (App Router)
✅ NestJS REST API
✅ Supabase schema with RLS
✅ Worker with BullMQ + Redis
✅ Telegram alerts
✅ SportMonks API integration (Advanced Plan + Premium Odds)
✅ Rule engine — 26 IN_PLAY metrics
✅ Rule engine — 402 PRE_MATCH metrics
✅ Rule engine — 412 ODDS metrics (pm + live)
✅ Deduplication (Redis + DB unique constraint)
✅ Live stats time-series (`match_stats_timeline` — all stats, every minute, every match)
✅ HIT/MISS resolution after match finish (`result-resolver.ts` + `outcome-evaluator.ts`)
✅ Per-user Telegram notifications
✅ Per-strategy league filter + global default league selection
✅ Math expression rules (LHS/RHS can combine two values with +, -, ×, ÷)

---

## 1) Architecture Laws (Immutable)

1. **API never scans.** No polling, no background jobs in API.
2. **Worker never exposes public HTTP endpoints.** Only optional healthcheck.
3. **rule-engine never performs IO.** Pure evaluation function only.
4. **shared-types is the single source of truth for metrics.** No metric defined elsewhere.
5. **No provider raw payload inside rule-engine.** Normalize to MatchSnapshot first.
6. **No metric in UI without being defined in shared-types.**
7. **Dedup enforced at two levels:**
   - Redis key with TTL (soft dedup, 2h)
   - DB unique constraint `(strategy_id, match_id)` (hard dedup)

---

## 2) Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS |
| Backend | NestJS (TypeScript), Supabase Postgres + Auth + RLS |
| Worker | Node.js, BullMQ, Redis |
| Data | SportMonks API v3 (Football Advanced + Premium Odds) |
| Alerts | Telegram Bot |

---

## 3) Repo Layout

```
/
├── agent.md
├── package.json              # npm workspaces root
├── tsconfig.base.json
│
├── apps/
│   ├── web/                  # Next.js 15
│   │   ├── app/
│   │   │   ├── (auth)/       # login, signup
│   │   │   └── (app)/        # strategies, live (auth-guarded)
│   │   └── src/
│   │       ├── components/   # NavBar, Toggle, MetricDropdown, RuleChip, ExpressionEditor
│   │       ├── context/      # AuthContext
│   │       ├── api/          # client.ts
│   │       └── supabase.ts
│   │
│   ├── api/                  # NestJS REST API
│   │   └── src/
│   │       ├── strategies/
│   │       ├── rules/
│   │       ├── live-matches/
│   │       ├── supabase/
│   │       ├── auth/
│   │       └── config/
│   │
│   └── worker/               # Background scanner
│       └── src/
│           ├── main.ts                    # Entry point + polling loop
│           ├── config.ts                  # Env config
│           ├── scanner.ts                 # Core scan cycle
│           ├── provider-service.ts        # SportMonks → MatchSnapshot
│           ├── prematch-calculator.ts     # PRE_MATCH metrics computation
│           ├── metrics-catalog.ts         # IN_PLAY metric type_id mapping
│           ├── standings-cache.ts         # League standings cache
│           ├── data-requirements-analyzer.ts
│           ├── trigger-service.ts
│           ├── performance-service.ts
│           ├── telegram.ts
│           ├── queues.ts
│           ├── redis.ts
│           ├── supabase.ts
│           ├── replay.ts
│           ├── replay-mode.ts
│           ├── mock-provider.ts
│           ├── stats-timeline.ts          # Upsert/query match_stats_timeline
│           ├── result-resolver.ts         # HIT/MISS resolution at match end
│           ├── outcome-evaluator.ts       # Pure function — evaluates desired_outcome
│           └── halftime-snapshot.ts       # (replaced by stats-timeline)
│
├── packages/
│   ├── shared-types/         # All types + metric definitions
│   │   └── src/index.ts
│   │
│   └── rule-engine/          # Pure evaluation engine
│       └── src/
│           ├── index.ts      # evaluateStrategy()
│           └── metrics-logic.ts  # All metric extractors
│
└── supabase/
    └── migrations/
```

---

## 4) Metric System

**Location:** `packages/shared-types/src/index.ts` → `METRICS_BY_TYPE`

### Counts
| Type | Count | Status |
|---|---|---|
| IN_PLAY | 26 | ✅ Operational |
| PRE_MATCH | 402 | ✅ Operational |
| ODDS | 412 | ✅ Operational |

### IN_PLAY — SportMonks type_id mapping (in `metrics-catalog.ts`)
Attacks (43), Dangerous Attacks (44), Shots (42), Shots On Target (86), Shots Off Target (41), Corners (34), Possession (45), Passes Accuracy (82), Crosses (98), Key Passes (117), Offsides (51), Saves (57), Free Kicks (55), Fouls (56), Yellow Cards (84), Red Cards (83), Shots Blocked (58) + calculated: momentum, crossing_accuracy_pct, goals, penalties, substitutions, injuries, match_timer, minutes_since_last_goal, league_position.

### PRE_MATCH — Computed from last 5/10 matches (in `prematch-calculator.ts`)
Goals averages, win/draw/loss %, BTTS %, clean sheet %, over/under %, half-time metrics, corners, shots — all with L5/L10 × home/away/all variants.

### ODDS — Extracted from SportMonks (in `provider-service.ts`)
- **Pre-match** (`fixture.odds`): 1X2, HT Result, Goals O/U, 1H Goals O/U, BTTS, Odd/Even, Corners O/U, 1H Corners O/U
- **Live** (`fixture.inplayodds`): 1X2, HT Result, Goals O/U, 1H Goals, BTTS (FT/1H/2H), Odd/Even, Corners O/U, 1H Corners O/U

---

## 5) MatchSnapshot Contract

```typescript
interface MatchSnapshot {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number | null;
  isLive: boolean;
  league: string;
  inPlay: Record<string, number>;    // IN_PLAY metrics
  preMatch: Record<string, number>;  // PRE_MATCH metrics (home_* / away_*)
  odds: Record<string, number>;      // ODDS (home_pm_odds_1x2, live_odds_btts_yes, ...)
  // + homeForm, awayForm, lastGoal, halfTimeScore, homePosition, awayPosition
}
```

**Rules:**
- `inPlay` keys: `home_*`, `away_*`, or metric name directly (match-level)
- `preMatch` keys: always `home_*` / `away_*`
- `odds` keys: `home_pm_odds_1x2`, `away_pm_odds_1x2`, `pm_odds_1x2_draw`, `home_live_odds_1x2`, `pm_odds_btts_yes`, `live_odds_corners_over_9_5`, etc.

---

## 6) Rule Engine

**Location:** `packages/rule-engine/src/index.ts`

```typescript
evaluateStrategy(strategy: StrategyWithRules, match: MatchSnapshot): EvaluationResult
```

Pure function. No IO. No randomness. Deterministic.

### Comparators
`GTE` `LTE` `EQ` `GT` `LT` `NEQ` — no implicit coercion.

### Team Scopes
`HOME` `AWAY` `TOTAL` `DIFFERENCE` `FAVOURITE` `UNDERDOG` `FAVOURITE_HOME` `FAVOURITE_AWAY` `UNDERDOG_HOME` `UNDERDOG_AWAY` `WINNING_TEAM` `LOSING_TEAM` `EITHER_TEAM` `EITHER_OPPONENT`

FAVOURITE/UNDERDOG resolved via `home_pm_odds_1x2` / `away_pm_odds_1x2`.

---

## 7) Scan Cycle

1. Load active strategies from DB
2. Analyze data requirements
3. Fetch live fixtures (`/livescores/inplay?include=state;scores;participants;statistics.type;league;events;participants.latest.scores;participants.latest.statistics;odds;inplayOdds`)
4. Normalize each fixture → MatchSnapshot
5. **Upsert all live stats into `match_stats_timeline`** (one row per match per minute)
6. Evaluate each strategy via rule-engine
7. On pass: check Redis dedup → DB insert → Telegram alert

---

## 7b) match_stats_timeline — Live Stats Time-Series

**Table:** `match_stats_timeline`
**Primary Key:** `(match_id, minute)`
**Written by:** worker on every scan cycle (~30s), upsert — one row per minute per match.
**Purpose:** Reconstruct stats at any point in a match (e.g. corners at minute 45 = 1H total).

**All columns available (NULL when not provided by SportMonks for that match):**

| Category | Columns (home_* / away_*) |
|---|---|
| Score | `home_score`, `away_score` |
| Shots | `shots_total`, `shots_on_target`, `shots_off_target`, `shots_inside_box`, `shots_outside_box`, `shots_blocked`, `goal_attempts` |
| Corners | `corners` |
| Cards | `yellow_cards`, `red_cards` |
| Possession & Passes | `possession`, `passes_total`, `passes_accurate`, `passes_percentage`, `long_passes`, `long_passes_accurate`, `long_passes_percentage`, `key_passes` |
| Attacks | `attacks`, `dangerous_attacks`, `counter_attacks`, `big_chances`, `big_chances_missed` |
| Defending | `fouls`, `offsides`, `free_kicks`, `saves`, `tackles`, `interceptions`, `successful_headers` |
| Dribbles | `successful_dribbles`, `dribbles_percentage` |
| Crosses | `crosses`, `crosses_accurate` |
| Misc | `assists`, `ball_safe` |

**Typical queries:**
```sql
-- Corners in 1st half (stats at minute ≤ 45)
SELECT home_corners, away_corners FROM match_stats_timeline
WHERE match_id = '...' AND minute <= 45
ORDER BY minute DESC LIMIT 1;

-- Shots between minute 20 and 50 (cumulative delta)
SELECT MAX(home_shots_total) - MIN(home_shots_total) AS home_shots_in_range
FROM match_stats_timeline
WHERE match_id = '...' AND minute BETWEEN 20 AND 50;

-- Yellow cards in 2nd half
SELECT MAX(home_yellow_cards) - MIN(home_yellow_cards) AS home_cards_2h
FROM match_stats_timeline
WHERE match_id = '...' AND minute > 45;
```

**Cleanup:** rows older than 14 days deleted via `cleanupOldStats()` in `stats-timeline.ts`.

---

## 8) SportMonks API

- **Base URL:** `https://api.sportmonks.com/v3/football`
- **Plan:** Advanced + Premium Odds
- **Rate Limit:** 3000 req/hour
- **Pre-match odds:** `fixture.odds` (flat array, market_id, label, value, total, created_at)
- **Live odds:** `fixture.inplayodds` (market_id, label, value, total, bookmaker_id, latest_bookmaker_update)

Key market IDs:
| Market | ID | Labels |
|---|---|---|
| 1X2 (PM) | 1 | Home / Draw / Away |
| Goals O/U (PM) | 80 | Over / Under + total |
| HT Result (PM) | 31 | Home / Draw / Away |
| 1H Goals (PM) | 28 | Over / Under + total |
| BTTS (PM) | 14 | Yes / No |
| BTTS 1H (PM) | 15 | Yes / No |
| Odd/Even (PM) | 44 | Odd / Even |
| Corners (PM) | 67 | Over / Under + total |
| 1H Corners (PM) | 70 | Over / Under + total |
| 1X2 (Live) | 1 | 1 / X / 2 |
| Goals O/U (Live) | 4, 7 | Over / Under + total |
| HT Result (Live) | 31 | 1 / X / 2 |
| 1H Goals (Live) | 28 | Over / Under + total |
| BTTS (Live) | 14 | Yes / No |
| BTTS 1H (Live) | 15 | Yes / No |
| BTTS 2H (Live) | 16 | Yes / No |
| Odd/Even (Live) | 12 | Odd / Even |
| Corners (Live) | 68 | Over / Under + total |
| 1H Corners (Live) | 70 | Over / Under + total |

---

## 9) Environment Variables

### apps/worker/.env
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
SPORTMONKS_API_KEY=
SPORTMONKS_BASE_URL=https://api.sportmonks.com/v3/football
POLL_INTERVAL=15000
DEDUP_TTL=7200
USE_MOCK_DATA=false
SNAPSHOT_FIXTURE_LIMIT=999
```

### apps/web/.env
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### infra/.env (loaded by API)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
REDIS_URL=redis://localhost:6379
API_PORT=3000
```

---

## 10) Math Expression Rules

Rules support combining two values with a math operator on either side of the comparator.

### Data Model

```typescript
type MathOp = '+' | '-' | '*' | '/';

interface RuleValue {
  kind: 'metric' | 'number';
  // if kind === 'metric':
  value_type?: RuleValueType;
  metric?: string;
  team_scope?: TeamScope | null;
  time_filter?: TimeFilter | null;
  // if kind === 'number':
  number?: number;
}

interface RuleExpression {
  left: RuleValue;
  op?: MathOp;         // present only when combining two values
  right?: RuleValue;   // present only when op is set
}
```

New nullable columns on `rules` table: `lhs_json JSONB`, `rhs_json JSONB`.

### Backward Compatibility

- Old rules (no `lhs_json`/`rhs_json`): rule engine uses `metric` + `value` fields.
- New rules: `lhs_json`/`rhs_json` always set. `metric` = primary metric (or `'__expr__'`), `value` = RHS number (or `0`).
- Rule engine: if `lhs_json` present → evaluate expression; else fall back to `metric` + `team_scope` + `time_filter`.

### Rule Engine Evaluation

```
actual = evaluateExpression(rule.lhs_json) or extractMetricValue(rule)
target = evaluateExpression(rule.rhs_json) ?? rule.value
passed = evaluateComparator(rule.comparator, actual, target)
```

`evaluateExpression()` resolves each `RuleValue` (metric lookup or plain number) then applies `op`.
Division by zero → rule fails (returns `null`).

### UI

**Component:** `apps/web/src/components/ExpressionEditor.tsx`
- `ExpressionEditor` — renders one side (LHS or RHS)
- `RuleValueEditor` — inner component: kind toggle (Metric/Number), metric dropdown, team scope, time filter
- Exports: `ExprDraft`, `RuleValueDraft`, `ExpressionEditor`, `makeDefaultExpr`

**Page:** `apps/web/app/(app)/strategies/[id]/rules/add/page.tsx`
- 3-step layout: `[LHS expr] [comparator] [RHS expr]`
- Always saves `lhs_json` + `rhs_json`; also sets legacy fields for backward compat

### Files Modified
| File | Change |
|---|---|
| `packages/shared-types/src/index.ts` | Added `MathOp`, `RuleValue`, `RuleExpression`; extended `Rule` + `CreateRulePayload` |
| `packages/rule-engine/src/index.ts` | `evaluateRuleValue()`, `evaluateExpression()`, updated `evaluateStrategy()` |
| `apps/api/src/rules/dto/create-rule.dto.ts` | `lhs_json`, `rhs_json` optional fields |
| `supabase/migrations/20260319000001_rules_expression.sql` | ALTER TABLE rules ADD lhs_json, rhs_json |
| `apps/web/src/components/ExpressionEditor.tsx` | New component |
| `apps/web/app/(app)/strategies/[id]/rules/add/page.tsx` | Rewritten with 3-step builder |
| `apps/web/src/components/RuleChip.tsx` | Expression display |
| `apps/web/app/(app)/strategies/page.tsx` | `formatRule()` expression support |

---

## 11) Known Limitations

- **xG**: Requires "Advanced xG" add-on (403 Forbidden without it)
- **Exchange Matched Amount**: Requires Betfair API (not integrated)
- **Live odds coverage**: Depends on match — only matches with `has_premium_odds: true` have `fixture.inplayodds`
- **PRE_MATCH data**: Requires `participants.latest` — unavailable for knockout rounds (empty array)
