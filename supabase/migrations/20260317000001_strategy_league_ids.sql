-- Add league_ids filter to strategies.
-- NULL = all leagues (default behaviour).
-- Non-null = only trigger for matches in the listed league IDs.

ALTER TABLE strategies ADD COLUMN league_ids INTEGER[];
