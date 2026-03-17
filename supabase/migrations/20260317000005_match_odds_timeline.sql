CREATE TABLE IF NOT EXISTS match_odds_timeline (
  match_id    TEXT        NOT NULL,
  minute      SMALLINT    NOT NULL,
  odds        JSONB       NOT NULL DEFAULT '{}',
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (match_id, minute)
);

CREATE INDEX IF NOT EXISTS idx_match_odds_timeline_match_minute
  ON match_odds_timeline (match_id, minute DESC);
