CREATE TABLE IF NOT EXISTS match_stats_timeline (
  match_id                    TEXT        NOT NULL,
  minute                      SMALLINT    NOT NULL,
  home_score                  SMALLINT    NOT NULL DEFAULT 0,
  away_score                  SMALLINT    NOT NULL DEFAULT 0,
  -- Shots
  home_shots_total            SMALLINT,
  away_shots_total            SMALLINT,
  home_shots_on_target        SMALLINT,
  away_shots_on_target        SMALLINT,
  home_shots_off_target       SMALLINT,
  away_shots_off_target       SMALLINT,
  home_shots_inside_box       SMALLINT,
  away_shots_inside_box       SMALLINT,
  home_shots_outside_box      SMALLINT,
  away_shots_outside_box      SMALLINT,
  home_shots_blocked          SMALLINT,
  away_shots_blocked          SMALLINT,
  home_goal_attempts          SMALLINT,
  away_goal_attempts          SMALLINT,
  -- Corners
  home_corners                SMALLINT,
  away_corners                SMALLINT,
  -- Cards
  home_yellow_cards           SMALLINT,
  away_yellow_cards           SMALLINT,
  home_red_cards              SMALLINT,
  away_red_cards              SMALLINT,
  -- Possession & Passes
  home_possession             SMALLINT,
  away_possession             SMALLINT,
  home_passes_total           SMALLINT,
  away_passes_total           SMALLINT,
  home_passes_accurate        SMALLINT,
  away_passes_accurate        SMALLINT,
  home_passes_percentage      SMALLINT,
  away_passes_percentage      SMALLINT,
  home_long_passes            SMALLINT,
  away_long_passes            SMALLINT,
  home_long_passes_accurate   SMALLINT,
  away_long_passes_accurate   SMALLINT,
  home_long_passes_percentage SMALLINT,
  away_long_passes_percentage SMALLINT,
  home_key_passes             SMALLINT,
  away_key_passes             SMALLINT,
  -- Attacks
  home_attacks                SMALLINT,
  away_attacks                SMALLINT,
  home_dangerous_attacks      SMALLINT,
  away_dangerous_attacks      SMALLINT,
  home_counter_attacks        SMALLINT,
  away_counter_attacks        SMALLINT,
  home_big_chances            SMALLINT,
  away_big_chances            SMALLINT,
  home_big_chances_missed     SMALLINT,
  away_big_chances_missed     SMALLINT,
  -- Defending
  home_fouls                  SMALLINT,
  away_fouls                  SMALLINT,
  home_offsides               SMALLINT,
  away_offsides               SMALLINT,
  home_free_kicks             SMALLINT,
  away_free_kicks             SMALLINT,
  home_saves                  SMALLINT,
  away_saves                  SMALLINT,
  home_tackles                SMALLINT,
  away_tackles                SMALLINT,
  home_interceptions          SMALLINT,
  away_interceptions          SMALLINT,
  home_successful_headers     SMALLINT,
  away_successful_headers     SMALLINT,
  -- Dribbles
  home_successful_dribbles    SMALLINT,
  away_successful_dribbles    SMALLINT,
  home_dribbles_percentage    SMALLINT,
  away_dribbles_percentage    SMALLINT,
  -- Crosses
  home_crosses                SMALLINT,
  away_crosses                SMALLINT,
  home_crosses_accurate       SMALLINT,
  away_crosses_accurate       SMALLINT,
  -- Misc
  home_assists                SMALLINT,
  away_assists                SMALLINT,
  home_ball_safe              SMALLINT,
  away_ball_safe              SMALLINT,

  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (match_id, minute)
);

CREATE INDEX IF NOT EXISTS idx_match_stats_timeline_match_minute
  ON match_stats_timeline (match_id, minute DESC);

CREATE INDEX IF NOT EXISTS idx_match_stats_timeline_captured_at
  ON match_stats_timeline (captured_at);
