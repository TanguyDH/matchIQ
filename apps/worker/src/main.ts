// MatchIQ Worker — Phase 6 (Redis + BullMQ)
// Queue-based scanning with retries and horizontal scaling support.

import { config } from './config';
import { redis } from './redis';
import { startScanTicker, closeQueues } from './queues';

console.log('');
console.log('='.repeat(60));
console.log('🚀 MatchIQ Worker Starting (Phase 6 - Queue-based)...');
console.log('='.repeat(60));
console.log('');

/**
 * Main entry point.
 * Starts BullMQ workers and periodic scan ticker.
 * If SNAPSHOT_MODE=true, runs once and exits.
 */
async function start(): Promise<void> {
  try {
    // Wait for Redis connection
    await redis.ping();
    console.log('[Worker] Redis connection verified');

    if (config.snapshotMode) {
      // SNAPSHOT MODE: Run once and exit
      console.log('[Worker] SNAPSHOT MODE: Running single scan...');
      const { scanMatches } = await import('./scanner');
      await scanMatches();
      console.log('[Worker] Snapshot complete. Exiting...');
      await shutdown();
    } else {
      // CONTINUOUS MODE: Start periodic scanning
      await startScanTicker();

      console.log('');
      console.log('[Worker] All systems operational');
      console.log('[Worker] Workers are processing jobs in the background');
      console.log('[Worker] Press Ctrl+C to stop');
      console.log('');
    }
  } catch (error) {
    console.error('[Worker] Failed to start:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler.
 */
async function shutdown(): Promise<void> {
  console.log('');
  console.log('[Worker] Shutting down gracefully...');

  try {
    await closeQueues();
    await redis.quit();
    console.log('[Worker] Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('[Worker] Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

/**
 * Error handler.
 */
process.on('unhandledRejection', (error) => {
  console.error('[Worker] Unhandled rejection:', error);
  // Don't exit - let the worker continue
});

// Start the worker
start();
