import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Worker configuration with validation.
 * Throws if required environment variables are missing.
 */
export const config = {
  supabase: {
    url: requireEnv('SUPABASE_URL'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
  telegram: {
    botToken: requireEnv('TELEGRAM_BOT_TOKEN'),
    chatId: requireEnv('TELEGRAM_CHAT_ID'),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  sportmonks: {
    key: requireEnv('SPORTMONKS_API_KEY'),
    baseUrl: process.env.SPORTMONKS_BASE_URL || 'https://api.sportmonks.com/v3/football',
  },
  pollInterval: parseInt(process.env.POLL_INTERVAL || '15000', 10),
  dedupTTL: parseInt(process.env.DEDUP_TTL || '7200', 10),
  snapshotMode: process.env.SNAPSHOT_MODE === 'true',
  fixtureLimit: parseInt(process.env.SNAPSHOT_FIXTURE_LIMIT || '5', 10),
  workerMode: (process.env.WORKER_MODE || 'live') as 'live' | 'replay',
  dryRun: process.env.DRY_RUN === 'true',
  useMockData: process.env.USE_MOCK_DATA === 'true',
};

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Log config on startup (mask sensitive values)
console.log('[Config] Worker configuration loaded:');
console.log(`  Mode: ${config.workerMode.toUpperCase()}${config.dryRun ? ' (DRY RUN)' : ''}`);
console.log(`  Supabase URL: ${config.supabase.url}`);
console.log(`  Telegram Bot: ${maskToken(config.telegram.botToken)}`);
console.log(`  Redis: ${config.redis.host}:${config.redis.port} (db ${config.redis.db})`);
console.log(`  Poll Interval: ${config.pollInterval}ms`);
console.log(`  Dedup TTL: ${config.dedupTTL}s`);
console.log(`  Data Source: ${config.useMockData ? 'MOCK (mock-fixtures.json)' : 'SportMonks API'}`);

function maskToken(token: string): string {
  if (token.length <= 8) return '***';
  return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
}
