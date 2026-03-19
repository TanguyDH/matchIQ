-- Add expression columns to rules table for math operations feature
ALTER TABLE rules
  ADD COLUMN IF NOT EXISTS lhs_json JSONB,
  ADD COLUMN IF NOT EXISTS rhs_json JSONB;
