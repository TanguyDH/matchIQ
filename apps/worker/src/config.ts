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
  pollInterval: parseInt(process.env.POLL_INTERVAL || '15000', 10),
  dedupTTL: parseInt(process.env.DEDUP_TTL || '7200', 10),
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
console.log(`  Supabase URL: ${config.supabase.url}`);
console.log(`  Telegram Bot: ${maskToken(config.telegram.botToken)}`);
console.log(`  Redis: ${config.redis.host}:${config.redis.port} (db ${config.redis.db})`);
console.log(`  Poll Interval: ${config.pollInterval}ms`);
console.log(`  Dedup TTL: ${config.dedupTTL}s`);

function maskToken(token: string): string {
  if (token.length <= 8) return '***';
  return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
}
