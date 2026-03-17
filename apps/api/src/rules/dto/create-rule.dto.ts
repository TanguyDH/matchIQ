import { z } from 'zod';

const TimeFilterSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('off') }),
  z.object({ mode: z.literal('as_of_minute'), x: z.number().int().min(0).max(120) }),
  z.object({ mode: z.literal('x_minutes_ago'), x: z.number().int().min(1).max(90) }),
  z.object({ mode: z.literal('between'), x: z.number().int().min(0), y: z.number().int().min(0) }),
  z.object({ mode: z.literal('past_x'), x: z.number().int().min(1).max(90) }),
  z.object({ mode: z.literal('since_minute'), x: z.number().int().min(0).max(120) }),
  z.object({ mode: z.literal('during_2nd_half') }),
  z.object({ mode: z.literal('as_of_halftime') }),
]);

export const CreateRuleSchema = z.object({
  value_type: z.enum(['IN_PLAY', 'PRE_MATCH', 'ODDS']).default('IN_PLAY'),
  metric: z.string().min(1),
  comparator: z.enum(['GTE', 'LTE', 'EQ', 'GT', 'LT', 'NEQ']),
  value: z.number().finite(),
  team_scope: z
    .enum([
      'HOME',
      'AWAY',
      'TOTAL',
      'EITHER_TEAM',
      'EITHER_OPPONENT',
      'DIFFERENCE',
      'FAVOURITE',
      'FAVOURITE_HOME',
      'FAVOURITE_AWAY',
      'UNDERDOG',
      'UNDERDOG_HOME',
      'UNDERDOG_AWAY',
      'WINNING_TEAM',
      'LOSING_TEAM',
    ])
    .optional(),
  time_filter: TimeFilterSchema.optional(),
});

export type CreateRuleDto = z.infer<typeof CreateRuleSchema>;
