-- ─── user_telegram ───────────────────────────────────────────────────────────
-- Stores the Telegram connection per user.
-- chat_id: the Telegram private chat ID (set after successful /start handshake)
-- link_token: temporary UUID used during the linking flow (expires after 15 min)

CREATE TABLE user_telegram (
  user_id                UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id                TEXT,
  link_token             UUID        UNIQUE,
  link_token_expires_at  TIMESTAMPTZ,
  linked_at              TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_telegram ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_telegram: select own"
  ON user_telegram FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_telegram: insert own"
  ON user_telegram FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_telegram: update own"
  ON user_telegram FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "user_telegram: delete own"
  ON user_telegram FOR DELETE
  USING (auth.uid() = user_id);
