import { z } from 'zod';

export const PatchStrategySchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    mode: z.enum(['EASY', 'ADVANCED']).optional(),
    alert_type: z.enum(['IN_PLAY', 'PRE_MATCH']).optional(),
    desired_outcome: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type PatchStrategyDto = z.infer<typeof PatchStrategySchema>;
