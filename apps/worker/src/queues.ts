import { Queue, Worker } from 'bullmq';
import { redis } from './redis';
import { config } from './config';
import { scanMatches } from './scanner';
import { sendAlert } from './telegram';
import type { EvaluationResult, MatchSnapshot } from '@matchiq/shared-types';

// ─── Queue Definitions ────────────────────────────────────────────────────────

/**
 * scan-tick queue: triggers periodic scanning cycles
 */
export const scanTickQueue = new Queue('scan-tick', {
  connection: redis,
});

/**
 * send-alert queue: sends Telegram alerts with retry logic
 */
export const sendAlertQueue = new Queue('send-alert', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s delay
    },
  },
});

// ─── Workers ──────────────────────────────────────────────────────────────────

/**
 * scan-tick worker: processes scanning jobs
 */
export const scanTickWorker = new Worker(
  'scan-tick',
  async () => {
    console.log('[ScanTickWorker] Processing scan job...');
    await scanMatches();
  },
  {
    connection: redis,
    concurrency: 1, // Process one scan at a time
  },
);

scanTickWorker.on('completed', (job) => {
  console.log(`[ScanTickWorker] Job ${job.id} completed`);
});

scanTickWorker.on('failed', (job, err) => {
  console.error(`[ScanTickWorker] Job ${job?.id} failed:`, err);
});

/**
 * send-alert worker: processes alert sending jobs with retries
 */
export const sendAlertWorker = new Worker<{
  strategyName: string;
  match: MatchSnapshot;
  result: EvaluationResult;
}>(
  'send-alert',
  async (job) => {
    const { strategyName, match, result } = job.data;
    console.log(
      `[SendAlertWorker] Sending alert for strategy "${strategyName}" (attempt ${job.attemptsMade + 1})`,
    );
    await sendAlert(strategyName, match, result);
  },
  {
    connection: redis,
    concurrency: 5, // Process up to 5 alerts concurrently
  },
);

sendAlertWorker.on('completed', (job) => {
  console.log(`[SendAlertWorker] Alert sent: ${job.id}`);
});

sendAlertWorker.on('failed', (job, err) => {
  console.error(`[SendAlertWorker] Alert failed: ${job?.id}`, err);
  if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
    console.error(
      `[SendAlertWorker] Alert permanently failed after ${job.attemptsMade} attempts`,
    );
  }
});

// ─── Queue Management ─────────────────────────────────────────────────────────

/**
 * Starts the periodic scan tick job.
 * Adds a repeatable job that runs every POLL_INTERVAL ms.
 */
export async function startScanTicker(): Promise<void> {
  // Remove any existing repeatable jobs first
  const repeatableJobs = await scanTickQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await scanTickQueue.removeRepeatableByKey(job.key);
  }

  // Add new repeatable job
  await scanTickQueue.add(
    'scan',
    {},
    {
      repeat: {
        every: config.pollInterval,
      },
    },
  );

  console.log(`[Queue] Scan ticker started (every ${config.pollInterval}ms)`);
}

/**
 * Gracefully closes all queues and workers.
 */
export async function closeQueues(): Promise<void> {
  console.log('[Queue] Closing queues and workers...');
  await scanTickWorker.close();
  await sendAlertWorker.close();
  await scanTickQueue.close();
  await sendAlertQueue.close();
  console.log('[Queue] All queues closed');
}
