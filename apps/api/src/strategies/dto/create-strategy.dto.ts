import { z } from 'zod';

export const CreateStrategySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  mode: z.enum(['EASY', 'ADVANCED']).default('EASY'),
  alert_type: z.enum(['IN_PLAY', 'PRE_MATCH']),
  desired_outcome: z.string().optional(),
});

export type CreateStrategyDto = z.infer<typeof CreateStrategySchema>;
