import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';

import { SupabaseService, unwrap } from '../supabase/supabase.service';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { PatchStrategyDto } from './dto/patch-strategy.dto';

@Injectable()
export class StrategiesService {
  private readonly logger = new Logger(StrategiesService.name);

  constructor(private readonly supabase: SupabaseService) {}

  // ── queries ────────────────────────────────────────────────────────────────

  async findAll(userId: string) {
    return unwrap(
      await this.supabase.client.from('strategies').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      StrategiesService.name,
    );
  }

  /**
   * Returns the strategy if it belongs to the caller, otherwise 404.
   * Used internally by RulesService to verify ownership before mutating rules.
   */
  async findOne(userId: string, id: string) {
    const { data, error } = await this.supabase.client.from('strategies').select('*').eq('id', id).eq('user_id', userId).single();

    if (error) {
      // PGRST116 = "Requested a single object, but got no rows."
      if (error.code === 'PGRST116') throw new NotFoundException(`Strategy ${id} not found`);

      this.logger.error(error.message);
      throw new InternalServerErrorException();
    }

    if (!data) throw new NotFoundException(`Strategy ${id} not found`);

    return data;
  }

  // ── mutations ──────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateStrategyDto) {
    return unwrap(
      await this.supabase.client.from('strategies').insert({ ...dto, user_id: userId }).select().single(),
      StrategiesService.name,
    );
  }

  async update(userId: string, id: string, dto: PatchStrategyDto) {
    // Ownership gate — throws 404 if the strategy doesn't belong to this user.
    await this.findOne(userId, id);

    return unwrap(
      await this.supabase.client.from('strategies').update(dto).eq('id', id).eq('user_id', userId).select().single(),
      StrategiesService.name,
    );
  }
}
