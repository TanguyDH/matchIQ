CREATE TABLE user_settings (
  user_id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_league_ids  INTEGER[],
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings: select own" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_settings: insert own" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_settings: update own" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
