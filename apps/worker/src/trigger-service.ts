import { supabase } from './supabase';

/**
 * Creates a trigger record in the database.
 * Enforces deduplication via DB unique constraint on (strategy_id, match_id).
 *
 * @param strategyId - The strategy ID
 * @param matchId - The match ID
 * @returns The created trigger ID, or null if duplicate
 */
export async function createTrigger(
  strategyId: string,
  matchId: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('triggers')
      .insert({
        strategy_id: strategyId,
        match_id: matchId,
        triggered_at: new Date().toISOString(),
        result: null, // Will be updated later when match ends
      })
      .select('id')
      .single();

    if (error) {
      // Check if it's a unique constraint violation
      if (error.code === '23505') {
        // PostgreSQL unique violation code
        console.log(
          `[TriggerService] Duplicate trigger skipped: strategy=${strategyId}, match=${matchId}`,
        );
        return null;
      }
      throw error;
    }

    console.log(
      `[TriggerService] Trigger created: id=${data.id}, strategy=${strategyId}, match=${matchId}`,
    );
    return data.id;
  } catch (error) {
    console.error('[TriggerService] Failed to create trigger:', error);
    throw error;
  }
}
