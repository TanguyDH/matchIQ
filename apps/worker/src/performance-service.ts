import { supabase } from './supabase';

/**
 * Records a HIT or MISS for a strategy and recalculates hit_rate.
 */
export async function recordOutcome(strategyId: string, result: 'HIT' | 'MISS'): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('performance')
      .select('*')
      .eq('strategy_id', strategyId)
      .single();

    if (!existing) return; // Should not happen — incrementTriggerCount creates the row

    const newHits = result === 'HIT' ? existing.total_hits + 1 : existing.total_hits;
    const newMisses = result === 'MISS' ? existing.total_misses + 1 : existing.total_misses;
    const hitRate = existing.total_triggers > 0
      ? ((newHits / existing.total_triggers) * 100).toFixed(2)
      : '0.00';

    const { error } = await supabase
      .from('performance')
      .update({ total_hits: newHits, total_misses: newMisses, hit_rate: hitRate })
      .eq('strategy_id', strategyId);

    if (error) throw error;

    console.log(
      `[PerformanceService] ${result}: strategy=${strategyId}, hits=${newHits}, misses=${newMisses}, rate=${hitRate}%`,
    );
  } catch (error) {
    console.error('[PerformanceService] Failed to record outcome:', error);
  }
}

/**
 * Updates performance stats for a strategy after a trigger is created.
 * Uses upsert to handle first-time initialization.
 *
 * @param strategyId - The strategy ID
 */
export async function incrementTriggerCount(strategyId: string): Promise<void> {
  try {
    // Fetch current performance or initialize
    const { data: existing } = await supabase
      .from('performance')
      .select('*')
      .eq('strategy_id', strategyId)
      .single();

    if (existing) {
      // Update existing performance
      const newTriggers = existing.total_triggers + 1;
      const hitRate =
        newTriggers > 0
          ? ((existing.total_hits / newTriggers) * 100).toFixed(2)
          : '0.00';

      const { error } = await supabase
        .from('performance')
        .update({
          total_triggers: newTriggers,
          hit_rate: hitRate,
        })
        .eq('strategy_id', strategyId);

      if (error) throw error;

      console.log(
        `[PerformanceService] Updated: strategy=${strategyId}, triggers=${newTriggers}`,
      );
    } else {
      // Initialize performance record
      const { error } = await supabase.from('performance').insert({
        strategy_id: strategyId,
        total_triggers: 1,
        total_hits: 0,
        total_misses: 0,
        hit_rate: '0.00',
      });

      if (error) throw error;

      console.log(
        `[PerformanceService] Initialized: strategy=${strategyId}, triggers=1`,
      );
    }
  } catch (error) {
    console.error('[PerformanceService] Failed to update performance:', error);
    throw error;
  }
}
