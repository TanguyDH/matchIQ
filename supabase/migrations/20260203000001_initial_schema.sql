-- ─────────────────────────────────────────────────────────────────────────────
-- Migration  : 20260203000001_initial_schema
-- Phase      : 1 — Supabase Postgres schema + RLS
-- Tables     : strategies, rules, triggers, performance
-- Constraints: unique(strategy_id, match_id) on triggers  (dedup — §1.7)
-- RLS        : single-user isolation via auth.uid()        (§6)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE strategy_mode   AS ENUM ('EASY', 'ADVANCED');
CREATE TYPE alert_type      AS ENUM ('IN_PLAY', 'PRE_MATCH');
CREATE TYPE rule_value_type AS ENUM ('IN_PLAY', 'PRE_MATCH', 'ODDS');
CREATE TYPE comparator      AS ENUM ('GTE', 'LTE', 'EQ', 'GT', 'LT', 'NEQ');
CREATE TYPE team_scope      AS ENUM (
  'HOME',
  'AWAY',
  'TOTAL',
  'FAVOURITE',
  'UNDERDOG',
  'WINNING_TEAM',
  'LOSING_TEAM',
  'DIFFERENCE'
);
CREATE TYPE trigger_result  AS ENUM ('HIT', 'MISS');

-- ─── strategies ──────────────────────────────────────────────────────────────

CREATE TABLE strategies (
  id              uuid           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid           NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name            text           NOT NULL,
  description     text,
  mode            strategy_mode  NOT NULL DEFAULT 'EASY',
  alert_type      alert_type     NOT NULL,
  desired_outcome text,                                         -- nullable; see §13 TODO
  is_active       boolean        NOT NULL DEFAULT true,
  created_at      timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX strategies_user_id_idx ON strategies (user_id);

-- ─── rules ───────────────────────────────────────────────────────────────────

CREATE TABLE rules (
  id          uuid            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id uuid            NOT NULL REFERENCES strategies (id) ON DELETE CASCADE,
  value_type  rule_value_type NOT NULL,
  metric      text            NOT NULL,                         -- allowed values enforced at app layer (§1.10, §11)
  comparator  comparator      NOT NULL,
  value       double precision NOT NULL,
  team_scope  team_scope,                                       -- nullable; optional per §5
  time_filter jsonb,                                            -- ADVANCED mode only; shape defined in Phase 4
  created_at  timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX rules_strategy_id_idx ON rules (strategy_id);

-- ─── triggers ────────────────────────────────────────────────────────────────

CREATE TABLE triggers (
  id           uuid           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id  uuid           NOT NULL REFERENCES strategies (id) ON DELETE CASCADE,
  match_id     text           NOT NULL,                         -- external provider ID; type=text until provider confirmed (§13)
  triggered_at timestamptz    NOT NULL DEFAULT now(),
  result       trigger_result                                   -- TODO §13: HIT/MISS resolution timing — populated by worker
);

-- Dedup gate: one trigger per (strategy, match).
-- Worker also checks a Redis key first; this constraint is the final hard gate (§1.7).
CREATE UNIQUE INDEX triggers_dedup_idx ON triggers (strategy_id, match_id);

-- ─── performance ─────────────────────────────────────────────────────────────

CREATE TABLE performance (
  strategy_id    uuid         NOT NULL PRIMARY KEY REFERENCES strategies (id) ON DELETE CASCADE,
  total_triggers integer      NOT NULL DEFAULT 0,
  total_hits     integer      NOT NULL DEFAULT 0,
  total_misses   integer      NOT NULL DEFAULT 0,
  hit_rate       numeric(5,2) NOT NULL DEFAULT 0                -- recalculated by worker; stored for fast dashboard reads
);

-- TODO §6: alert_logs table — recommended for §1.8 alert-level idempotency.
-- Planned addition: (id, trigger_id, channel, sent_at, idempotency_key).

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- All policies enforce single-user isolation via auth.uid().
--
-- strategies / rules  →  full CRUD policies  (user-facing, written via API)
-- triggers / performance  →  SELECT only     (writes are worker-only; worker
--                                             uses the service-role key which
--                                             bypasses RLS entirely)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── strategies ───────────────────────────────────────────────────────────────

ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY strategies_select
  ON strategies FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY strategies_insert
  ON strategies FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY strategies_update
  ON strategies FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY strategies_delete
  ON strategies FOR DELETE
  USING (user_id = auth.uid());

-- ── rules  (ownership resolved through strategies.user_id) ──────────────────

ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY rules_select
  ON rules FOR SELECT
  USING (strategy_id IN (SELECT id FROM strategies WHERE user_id = auth.uid()));

CREATE POLICY rules_insert
  ON rules FOR INSERT
  WITH CHECK (strategy_id IN (SELECT id FROM strategies WHERE user_id = auth.uid()));

CREATE POLICY rules_update
  ON rules FOR UPDATE
  USING (strategy_id IN (SELECT id FROM strategies WHERE user_id = auth.uid()));

CREATE POLICY rules_delete
  ON rules FOR DELETE
  USING (strategy_id IN (SELECT id FROM strategies WHERE user_id = auth.uid()));

-- ── triggers  (SELECT only — INSERTs come from worker via service-role key) ──

ALTER TABLE triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY triggers_select
  ON triggers FOR SELECT
  USING (strategy_id IN (SELECT id FROM strategies WHERE user_id = auth.uid()));

-- ── performance  (SELECT only — mutations come from worker via service-role key) ─

ALTER TABLE performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY performance_select
  ON performance FOR SELECT
  USING (strategy_id IN (SELECT id FROM strategies WHERE user_id = auth.uid()));
