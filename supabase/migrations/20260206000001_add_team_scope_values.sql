-- Add new team_scope enum values for more granular team selection
-- Migration created: 2026-02-06

-- Add new values to team_scope enum
ALTER TYPE team_scope ADD VALUE IF NOT EXISTS 'EITHER_TEAM';
ALTER TYPE team_scope ADD VALUE IF NOT EXISTS 'EITHER_OPPONENT';
ALTER TYPE team_scope ADD VALUE IF NOT EXISTS 'FAVOURITE_HOME';
ALTER TYPE team_scope ADD VALUE IF NOT EXISTS 'FAVOURITE_AWAY';
ALTER TYPE team_scope ADD VALUE IF NOT EXISTS 'UNDERDOG_HOME';
ALTER TYPE team_scope ADD VALUE IF NOT EXISTS 'UNDERDOG_AWAY';

-- Note: The order of enum values cannot be changed after creation.
-- New values will be appended to the end of the enum list.
