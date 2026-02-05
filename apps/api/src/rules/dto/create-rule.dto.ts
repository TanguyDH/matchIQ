import { z } from 'zod';

export const CreateRuleSchema = z.object({
  value_type: z.enum(['IN_PLAY', 'PRE_MATCH', 'ODDS']),
  metric: z.string().min(1),
  comparator: z.enum(['GTE', 'LTE', 'EQ', 'GT', 'LT', 'NEQ']),
  value: z.number().finite(),
  team_scope: z
    .enum(['HOME', 'AWAY', 'TOTAL', 'FAVOURITE', 'UNDERDOG', 'WINNING_TEAM', 'LOSING_TEAM', 'DIFFERENCE'])
    .optional(),
  // ADVANCED-mode only; internal shape defined in Phase 4 (rule-engine).
  time_filter: z.record(z.string(), z.unknown()).optional(),
});

export type CreateRuleDto = z.infer<typeof CreateRuleSchema>;
