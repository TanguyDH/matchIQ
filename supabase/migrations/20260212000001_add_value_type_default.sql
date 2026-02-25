-- ─────────────────────────────────────────────────────────────────────────────
-- Migration  : 20260212000001_add_value_type_default
-- Purpose    : Add default value for rules.value_type to prevent undefined values
-- ─────────────────────────────────────────────────────────────────────────────

-- Add default value 'IN_PLAY' to value_type column
ALTER TABLE rules
  ALTER COLUMN value_type SET DEFAULT 'IN_PLAY'::rule_value_type;

-- Update any existing NULL values to IN_PLAY (safety check)
-- This should not affect any rows if NOT NULL constraint is enforced
UPDATE rules
SET value_type = 'IN_PLAY'::rule_value_type
WHERE value_type IS NULL;
