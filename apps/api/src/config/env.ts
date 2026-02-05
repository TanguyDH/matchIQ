import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  SUPABASE_URL: z.string(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  SUPABASE_JWT_SECRET: z.string(),
});

export type AppEnv = z.infer<typeof schema>;

/**
 * Validates process.env against the schema at startup.
 * Calls process.exit(1) on the first failure so nothing boots with missing config.
 */
export function validateEnv(raw: Record<string, string | undefined> = process.env): AppEnv {
  const result = schema.safeParse(raw);

  if (!result.success) {
    console.error('Environment validation failed:\n', JSON.stringify(result.error.issues, null, 2));
    process.exit(1);
  }

  return result.data;
}
