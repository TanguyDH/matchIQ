import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';

import { StrategiesService } from '../strategies/strategies.service';
import { SupabaseService, assertNoError } from '../supabase/supabase.service';
import { CreateRuleDto } from './dto/create-rule.dto';

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly strategies: StrategiesService,
  ) {}

  // ── queries ────────────────────────────────────────────────────────────────

  async findByStrategy(userId: string, strategyId: string) {
    // Ownership gate — throws 404 if strategy doesn't belong to this user.
    await this.strategies.findOne(userId, strategyId);

    const { data, error } = await this.supabase.client
      .from('rules')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException();
    }

    return data ?? [];
  }

  // ── mutations ──────────────────────────────────────────────────────────────

  async create(userId: string, strategyId: string, dto: CreateRuleDto) {
    // Ownership gate.
    await this.strategies.findOne(userId, strategyId);

    const { data, error } = await this.supabase.client
      .from('rules')
      .insert({ ...dto, strategy_id: strategyId })
      .select()
      .single();

    if (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException();
    }

    if (!data) throw new InternalServerErrorException();

    return data;
  }

  async remove(userId: string, id: string) {
    // 1. Resolve the rule → get its strategy_id.
    const { data: rule, error: findError } = await this.supabase.client.from('rules').select('strategy_id').eq('id', id).single();

    if (findError) {
      if (findError.code === 'PGRST116') throw new NotFoundException(`Rule ${id} not found`);
      this.logger.error(findError.message);
      throw new InternalServerErrorException();
    }

    if (!rule) throw new NotFoundException(`Rule ${id} not found`);

    // 2. Ownership gate — ensures the rule belongs to the caller's strategy.
    await this.strategies.findOne(userId, rule.strategy_id);

    // 3. Delete.
    assertNoError(await this.supabase.client.from('rules').delete().eq('id', id), RulesService.name);
  }
}
