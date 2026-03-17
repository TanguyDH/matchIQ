-- Time-series of live match statistics, captured every ~minute per live match.
-- One row per (match_id, minute) — upserted by the worker on each scan cycle.
-- Used by result-resolver to reconstruct stats at any point in the match
-- (e.g. corners at minute 45 = 1st-half total, enabling CORNERS_1H outcomes).

CREATE TABLE IF NOT EXISTS match_stats_timeline (
  match_id    TEXT        NOT NULL,
  minute      SMALLINT    NOT NULL,  -- match minute (0-120+)
  home_score  SMALLINT    NOT NULL DEFAULT 0,
  away_score  SMALLINT    NOT NULL DEFAULT 0,
  -- Full inPlay stats dict: { home_corners: 3, away_corners: 2, home_yellow_cards: 1, ... }
  inplay      JSONB       NOT NULL DEFAULT '{}',
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (match_id, minute)
);

-- Index for fast lookup of a match's history ordered by minute
CREATE INDEX IF NOT EXISTS idx_match_stats_timeline_match_minute
  ON match_stats_timeline (match_id, minute DESC);

-- Index for cleanup job (delete rows older than 14 days)
CREATE INDEX IF NOT EXISTS idx_match_stats_timeline_captured_at
  ON match_stats_timeline (captured_at);
