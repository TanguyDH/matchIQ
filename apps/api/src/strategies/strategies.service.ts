import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';

import { SupabaseService, unwrap } from '../supabase/supabase.service';
import type { Database } from '../supabase/database.types';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { PatchStrategyDto } from './dto/patch-strategy.dto';

type StrategyRow = Database['public']['Tables']['strategies']['Row'];
type RuleRow = Database['public']['Tables']['rules']['Row'];

@Injectable()
export class StrategiesService {
  private readonly logger = new Logger(StrategiesService.name);

  constructor(private readonly supabase: SupabaseService) {}

  // ── queries ────────────────────────────────────────────────────────────────

  async findAll(userId: string) {
    const strategies = unwrap(
      await this.supabase.client.from('strategies').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      StrategiesService.name,
    ) as StrategyRow[];

    if (strategies.length === 0) return [];

    const { data: perfRows } = await this.supabase.client
      .from('performance')
      .select('strategy_id, total_triggers, hit_rate')
      .in('strategy_id', strategies.map((s) => s.id));

    const perfMap = new Map((perfRows ?? []).map((p) => [p.strategy_id, p]));

    return strategies.map((s) => ({
      ...s,
      total_triggers: perfMap.get(s.id)?.total_triggers ?? 0,
      hit_rate: perfMap.get(s.id)?.hit_rate ?? '0.00',
    }));
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

  async findTriggers(userId: string, id: string, page: number, pageSize: number) {
    // Ownership gate
    await this.findOne(userId, id);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await this.supabase.client
      .from('triggers')
      .select('*', { count: 'exact' })
      .eq('strategy_id', id)
      .order('triggered_at', { ascending: false })
      .range(from, to);

    if (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException();
    }

    return { data: data ?? [], total: count ?? 0, page, pageSize };
  }

  // ── gallery ─────────────────────────────────────────────────────────────────

  async findGallery() {
    const { data: strategies, error: sErr } = await this.supabase.client
      .from('strategies')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (sErr) {
      this.logger.error(sErr.message);
      throw new InternalServerErrorException();
    }

    const rows = (strategies ?? []) as StrategyRow[];
    if (rows.length === 0) return [];

    const { data: rules } = await this.supabase.client
      .from('rules')
      .select('*')
      .in('strategy_id', rows.map((s) => s.id))
      .order('created_at', { ascending: true });

    const rulesMap = new Map<string, RuleRow[]>();
    for (const rule of (rules ?? []) as RuleRow[]) {
      if (!rulesMap.has(rule.strategy_id)) rulesMap.set(rule.strategy_id, []);
      rulesMap.get(rule.strategy_id)!.push(rule);
    }

    return rows.map((s) => ({ ...s, rules: rulesMap.get(s.id) ?? [] }));
  }

  async importFromGallery(userId: string, galleryStrategyId: string) {
    const { data: sourceRaw, error: sErr } = await this.supabase.client
      .from('strategies')
      .select('*')
      .eq('id', galleryStrategyId)
      .eq('is_public', true)
      .single();

    if (sErr || !sourceRaw) throw new NotFoundException(`Gallery strategy ${galleryStrategyId} not found`);
    const source = sourceRaw as StrategyRow;

    const { data: rulesRaw } = await this.supabase.client
      .from('rules')
      .select('*')
      .eq('strategy_id', galleryStrategyId)
      .order('created_at', { ascending: true });
    const rules = (rulesRaw ?? []) as RuleRow[];

    const { data: newStrategyRaw, error: createErr } = await this.supabase.client
      .from('strategies')
      .insert({
        user_id: userId,
        name: source.name,
        description: source.description,
        mode: source.mode,
        alert_type: source.alert_type,
        desired_outcome: source.desired_outcome,
        is_active: true,
        league_ids: source.league_ids,
      })
      .select()
      .single();

    if (createErr || !newStrategyRaw) {
      this.logger.error(createErr?.message);
      throw new InternalServerErrorException();
    }
    const newStrategy = newStrategyRaw as StrategyRow;

    if (rules.length > 0) {
      const { error: rulesErr } = await this.supabase.client.from('rules').insert(
        rules.map((r) => ({
          strategy_id: newStrategy.id,
          value_type: r.value_type,
          metric: r.metric,
          comparator: r.comparator,
          value: r.value,
          team_scope: r.team_scope,
          time_filter: r.time_filter,
          lhs_json: r.lhs_json,
          rhs_json: r.rhs_json,
        })),
      );

      if (rulesErr) {
        this.logger.error(rulesErr.message);
        await this.supabase.client.from('strategies').delete().eq('id', newStrategy.id);
        throw new InternalServerErrorException();
      }
    }

    return newStrategy;
  }

  async delete(userId: string, id: string) {
    // Ownership gate — throws 404 if the strategy doesn't belong to this user.
    await this.findOne(userId, id);

    const { error } = await this.supabase.client.from('strategies').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException();
    }
  }
}
