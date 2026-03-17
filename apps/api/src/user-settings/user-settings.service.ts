import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UserSettingsService {
  private readonly logger = new Logger(UserSettingsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async getSettings(userId: string): Promise<{ default_league_ids: number[] | null }> {
    const { data } = await this.supabase.client
      .from('user_settings')
      .select('default_league_ids')
      .eq('user_id', userId)
      .single();

    return { default_league_ids: (data?.default_league_ids as number[] | null) ?? null };
  }

  async updateSettings(
    userId: string,
    defaultLeagueIds: number[] | null,
  ): Promise<{ default_league_ids: number[] | null }> {
    const { data: existing } = await this.supabase.client
      .from('user_settings')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      await this.supabase.client
        .from('user_settings')
        .update({ default_league_ids: defaultLeagueIds })
        .eq('user_id', userId);
    } else {
      await this.supabase.client
        .from('user_settings')
        .insert({ user_id: userId, default_league_ids: defaultLeagueIds });
    }

    return { default_league_ids: defaultLeagueIds };
  }
}
