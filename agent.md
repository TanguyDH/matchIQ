# agent.md — Football Live Strategy Scanner (MVP) — **STRICT SPEC (Claude Code Optimized)**

> This document is the single source of truth.
> Claude Code must follow it literally.
> If anything is ambiguous, **do not guess**: add a TODO comment and propose the smallest assumption.

---

## 0) Product Goal (MVP)

Build a real-time football strategy scanner:

* Users create **Strategies** composed of multiple **Rules** (AND logic)
* A **Worker** continuously scans live matches via an external provider API
* When all rules match a live match, the system creates a **Trigger** and sends an **Alert**
* The system tracks **Performance** (triggers/hits/misses/hit rate)
* UI replicates the reference screens structure (Create Strategy, Add Rule, Strategy List)

MVP focus: **strategy creation → scanning → telegram alerts → dashboard tracking**.

---

## 1) Hard Constraints (Non-Negotiable)

### Separation of Responsibilities

1. **API must never run scanning loops.**
   No `setInterval` / cron / polling inside the API service.
2. **Worker must never expose public HTTP endpoints** (except optional healthcheck).
3. **Frontend must never use Supabase service role key.**
   Frontend uses anon key + user session only.
4. **All writes to sensitive tables must be server-side enforced** (RLS + server calls).
5. **No business logic in controllers** (API). Controllers only validate/route.
6. **Rule evaluation must be deterministic** and pure:

   * No random
   * No time-dependent behavior unless explicitly passed in
   * No external calls inside the evaluation function

### Data Integrity

7. **Dedup is mandatory:** the same `(strategyId, matchId)` must not trigger twice.
   Enforce with **DB unique constraint** + Redis key.
8. **Idempotency:** alerts must be safe to retry without duplicates.

### MVP Scope Discipline

9. No backtesting, no marketplace, no AI suggestions in MVP.
10. No “magical” inference of metrics: metric mapping must be explicit and typed.

---

## 2) Tech Stack (Strict)

### Frontend

* Ionic React + TypeScript
* TailwindCSS (desktop density)
* TanStack Table for strategy tables
* Supabase JS client (auth/session)

Targets:

* iOS (Capacitor)
* Android (Capacitor)
* Web/Desktop (PWA)

### Backend

* NestJS (TypeScript) for REST API
* Supabase Postgres for DB + Auth
* Redis for:

  * cache
  * dedup keys
  * queues (BullMQ)
* Worker: Node TS + BullMQ consumer (can be NestJS, but keep minimal)

---

## 3) Repo Layout (Monorepo)

```
/ (repo root)
  agent.md
  README.md

  apps/
    web/            # Ionic React app
    api/            # NestJS REST API
    worker/         # BullMQ worker service

  packages/
    shared-types/   # shared TS types, enums, DTO interfaces
    rule-engine/    # pure evaluation engine (no IO)

  infra/
    docker-compose.yml
    .env.example
```

Rules:

* `packages/rule-engine` must have **zero** runtime dependencies on NestJS/Supabase/Redis.
* `packages/shared-types` contains **only types** (no runtime logic).

---

## 4) UI Screens (Must Match Reference Flow)

### Screen A — Strategies Dashboard

Route: `/strategies`

Must show:

* Strategy Name / Outcome
* Picks (trigger count)
* Hit %
* Status toggle (ON/OFF)
* Controls dropdown (Edit / Duplicate / Delete)

### Screen B — Create Strategy

Route: `/strategies/create`

Fields:

* Strategy Name (required)
* Desired outcome / Auto-striking (optional dropdown)
* Alert Type (In-Play / Pre-Match toggle)
* Save / Cancel

### Screen C — Add Strategy Rule

Route: `/strategies/:id/rules/add`

Tabs:

* In-Play Stats
* Pre-Match Stats
* Odds

Fields:

* Value dropdown (searchable, grouped)
* Comparator dropdown (>=, <=, =, >, <, !=)
* Target Value input
* Save Rule
* Enable Advanced Mode

**Preview area** must show something like:
`Preview: <Metric> <Comparator> <Value>`

---

## 5) Domain Models (Strict)

### Strategy

* id (uuid)
* user_id
* name
* description?
* mode: `EASY | ADVANCED`
* alert_type: `IN_PLAY | PRE_MATCH`
* desired_outcome?: string
* is_active: boolean
* created_at

### Rule

* id
* strategy_id
* value_type: `IN_PLAY | PRE_MATCH | ODDS`
* metric: string (from an allowed enum list)
* comparator: `GTE | LTE | EQ | GT | LT | NEQ`
* value: number
* team_scope?: `HOME | AWAY | TOTAL | FAVOURITE | UNDERDOG | WINNING_TEAM | LOSING_TEAM | DIFFERENCE`
* time_filter?: optional object (ADVANCED only)

### Trigger

* id
* strategy_id
* match_id
* triggered_at
* result?: `HIT | MISS`

### Performance

* strategy_id (unique)
* total_triggers
* total_hits
* total_misses
* hit_rate

---

## 6) Database Requirements (Supabase Postgres + RLS)

### RLS

* User can only access their own strategies, rules, triggers, performance.

### Uniqueness (Dedup)

Add DB constraint:

* unique(strategy_id, match_id) on triggers

### Recommended Tables

* strategies
* rules
* triggers
* performance
* user_profiles (optional)
* alert_logs (optional but recommended)

---

## 7) Rule Engine Contract (Strict)

Location: `packages/rule-engine`

### Inputs

* `Strategy` (with rules)
* `MatchSnapshot` (provider data normalized to internal schema)

### Output

Must return a structured evaluation, not just boolean.

```ts
type EvaluationResult = {
  passed: boolean;
  failedRuleId?: string;
  matchedRules: Array<{
    ruleId: string;
    metric: string;
    comparator: string;
    target: number;
    actual: number;
  }>;
};
```

### Required Function Signature

```ts
evaluateStrategy(strategy: Strategy, match: MatchSnapshot): EvaluationResult
```

Rules:

* No DB access here.
* No HTTP calls here.
* No “current time” reads; if needed, time must be passed via `match`.

---

## 8) Worker Behavior (Strict)

Worker is responsible for all continuous operations.

### Mandatory responsibilities

1. Poll live matches (every X seconds)
2. Normalize provider data into `MatchSnapshot`
3. Load all active strategies for relevant alert type
4. Evaluate using `rule-engine`
5. If pass:

   * Create Trigger (DB)
   * Send Alert (Telegram)
   * Update Performance (DB)
6. Dedup enforcement:

   * check Redis key `dedup:<strategyId>:<matchId>`
   * enforce DB unique constraint as final gate

### Poll interval

Default: **15 seconds** (configurable via env)

### Queue Design (BullMQ)

* `scan-tick` job: triggers one scanning cycle
* `send-alert` job: sends Telegram message (retryable)

Worker must be able to run multiple instances.

---

## 9) Alerts (Telegram MVP)

### Telegram message must include:

* Strategy name
* Match (Home vs Away)
* Current score
* Minute
* Why it triggered (matchedRules summary)

Alerts must be retry-safe:

* if job retries, it must not duplicate the same alert for same trigger.

---

## 10) Build Order (Strict Execution Plan)

Claude Code must implement in this exact order:

### Phase 0 — Repo Setup

* Create monorepo layout
* Add tooling (TS config, lint, prettier)
* Add `.env.example`

### Phase 1 — Supabase Schema + RLS (minimal)

* Create tables: strategies, rules, triggers, performance
* RLS policies: user isolation
* unique(strategy_id, match_id) constraint

### Phase 2 — API (NestJS) CRUD only

* Auth validation (Supabase JWT)
* Endpoints:

  * POST /strategies
  * GET /strategies
  * GET /strategies/:id
  * PATCH /strategies/:id
  * POST /strategies/:id/rules
  * GET /strategies/:id/rules
  * DELETE /rules/:id
* No scanning logic, no queues yet.

### Phase 3 — Web App (Ionic) UI only

* Strategies Dashboard
* Create Strategy page
* Add Rule page (tabs + searchable grouped dropdown + comparator + preview)
* Wire to API endpoints

### Phase 4 — Rule Engine package

* Implement evaluation contract
* Unit tests for comparator + metrics mapping

### Phase 5 — Worker MVP

* Poll provider mock (temporary)
* Evaluate strategies
* Create triggers
* Send Telegram alerts
* Dedup via DB unique constraint

### Phase 6 — Redis + BullMQ

* Move scanning to queue tick
* Add send-alert queue with retries
* Add Redis dedup keys + TTL

---

## 11) Coding Standards (Strict)

* TypeScript strict everywhere
* No `any` allowed (except in narrow provider parsing with explicit runtime validation)
* Controllers are thin
* Services own logic
* Use runtime validation for external API payloads (e.g., zod)
* All env values are validated at startup

---

## 12) “Do Not” List (Strict)

* Do not put scanning logic in API
* Do not store provider payload raw without normalization
* Do not implement “advanced features” outside MVP scope
* Do not skip dedup requirement
* Do not hardcode metrics lists in multiple places (single source in shared-types)
* Do not bypass RLS policies

---

## 13) Open Questions (If Unknown, Mark TODO)

If any of these are not specified, add TODO and implement minimal placeholder:

* Exact provider (API-Football vs API-Sports)
* Exact odds markets list for MVP
* “Desired outcome” hit logic timing (when to mark HIT/MISS)

---

## Final Acceptance Criteria (MVP)

✅ User can sign in, create a strategy, add multiple rules
✅ Worker scans live matches and triggers **exactly once** per match
✅ Telegram alert is sent with clear “why it triggered”
✅ Dashboard shows strategies, status toggle, picks count, hit %
✅ Code is modular, scalable, and follows all hard constraints
