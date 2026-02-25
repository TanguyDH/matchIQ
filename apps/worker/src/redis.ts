import Redis from 'ioredis';
import { config } from './config';

/**
 * Redis client for dedup keys and BullMQ queues.
 */
export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});

/**
 * Checks if a trigger already exists (dedup check).
 * Uses Redis with TTL for fast lookups.
 *
 * @param strategyId - Strategy ID
 * @param matchId - Match ID
 * @returns true if trigger already exists (duplicate)
 */
export async function isDuplicateTrigger(
  strategyId: string,
  matchId: string,
): Promise<boolean> {
  const key = `dedup:${strategyId}:${matchId}`;
  const exists = await redis.exists(key);
  return exists === 1;
}

/**
 * Marks a trigger as processed in Redis with TTL.
 *
 * @param strategyId - Strategy ID
 * @param matchId - Match ID
 */
export async function markTriggerProcessed(
  strategyId: string,
  matchId: string,
): Promise<void> {
  const key = `dedup:${strategyId}:${matchId}`;
  await redis.setex(key, config.dedupTTL, '1');
  console.log(`[Redis] Dedup key set: ${key} (TTL: ${config.dedupTTL}s)`);
}
