-- ─────────────────────────────────────────────────────────────────────────────
-- Migration  : 20260209000001_add_trigger_evidence
-- Purpose    : Store evidence data when triggers occur (no continuous snapshots)
-- Critical   : Store data ONLY when a trigger happens (agent.md constraint)
-- ─────────────────────────────────────────────────────────────────────────────

-- Add evidence columns to triggers table
ALTER TABLE triggers
  ADD COLUMN minute INT,
  ADD COLUMN home_team VARCHAR(255),
  ADD COLUMN away_team VARCHAR(255),
  ADD COLUMN score_home INT,
  ADD COLUMN score_away INT,
  ADD COLUMN league_id INT,
  ADD COLUMN fixture_timestamp TIMESTAMPTZ,
  ADD COLUMN evidence_json JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Add index on evidence_json for querying
CREATE INDEX triggers_evidence_json_idx ON triggers USING gin (evidence_json);

-- Add comment explaining evidence_json structure
COMMENT ON COLUMN triggers.evidence_json IS 'Evidence captured at trigger time. Contains: strategyId, matchId/fixtureId, matchedRules array (ruleId, metric, comparator, target, actual), optional odds/stats used, capturedAt timestamp';

-- Example evidence_json structure:
-- {
--   "strategyId": "uuid",
--   "fixtureId": "12345",
--   "matchedRules": [
--     {
--       "ruleId": "uuid",
--       "metric": "home_goals",
--       "comparator": "GTE",
--       "target": 2,
--       "actual": 2
--     }
--   ],
--   "odds": {
--     "home_win": 2.1,
--     "away_win": 3.5,
--     "draw": 3.2,
--     "bookmaker": "Bet365"
--   },
--   "capturedAt": "2024-01-01T12:00:00Z"
-- }
