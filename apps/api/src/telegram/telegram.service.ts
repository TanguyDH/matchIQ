import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { SupabaseService } from '../supabase/supabase.service';

const LINK_TOKEN_TTL_MINUTES = 15;

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly supabase: SupabaseService) {}

  // ── Public API endpoints ──────────────────────────────────────────────────

  async getLinkUrl(userId: string): Promise<{ url: string }> {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MINUTES * 60 * 1000).toISOString();
    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'MatchIQBot';

    // Check if a row already exists for this user
    const { data: existing } = await this.supabase.client
      .from('user_telegram')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Only refresh the link token — never touch chat_id or linked_at
      const { error } = await this.supabase.client
        .from('user_telegram')
        .update({ link_token: token, link_token_expires_at: expiresAt })
        .eq('user_id', userId);

      if (error) {
        this.logger.error(error.message);
        throw new Error('Failed to refresh link token');
      }
    } else {
      const { error } = await this.supabase.client
        .from('user_telegram')
        .insert({ user_id: userId, link_token: token, link_token_expires_at: expiresAt });

      if (error) {
        this.logger.error(error.message);
        throw new Error('Failed to create link token');
      }
    }

    return { url: `https://t.me/${botUsername}?start=${token}` };
  }

  async getStatus(userId: string): Promise<{ linked: boolean; linkedAt?: string }> {
    const { data } = await this.supabase.client
      .from('user_telegram')
      .select('linked_at')
      .eq('user_id', userId)
      .single();

    if (!data || !data.linked_at) {
      return { linked: false };
    }

    return { linked: true, linkedAt: data.linked_at as string };
  }

  async disconnect(userId: string): Promise<void> {
    await this.supabase.client
      .from('user_telegram')
      .update({ chat_id: null, linked_at: null })
      .eq('user_id', userId);
  }

  // ── Webhook (called by Telegram) ──────────────────────────────────────────

  async handleWebhook(body: Record<string, unknown>): Promise<void> {
    const message = body?.message as Record<string, unknown> | undefined;
    if (!message) return;

    const text = String(message?.text ?? '');
    const chat = message?.chat as Record<string, unknown> | undefined;
    const chatId = chat?.id as number | undefined;

    if (!text.startsWith('/start') || !chatId) return;

    const token = text.split(' ')[1];
    if (!token) {
      await this.sendMessage(chatId, 'Veuillez utiliser le lien de connexion depuis l\'application MatchIQ.');
      return;
    }

    const { data, error } = await this.supabase.client
      .from('user_telegram')
      .select('user_id, link_token_expires_at')
      .eq('link_token', token)
      .single();

    if (error || !data) {
      await this.sendMessage(chatId, 'Lien invalide. Générez un nouveau lien depuis l\'application MatchIQ.');
      return;
    }

    if (new Date(data.link_token_expires_at as string) < new Date()) {
      await this.sendMessage(chatId, 'Lien expiré. Générez un nouveau lien depuis l\'application MatchIQ.');
      return;
    }

    const { error: updateError } = await this.supabase.client
      .from('user_telegram')
      .update({
        chat_id: String(chatId),
        linked_at: new Date().toISOString(),
        link_token: null,
        link_token_expires_at: null,
      })
      .eq('user_id', data.user_id);

    if (updateError) {
      this.logger.error(updateError.message);
      await this.sendMessage(chatId, 'Erreur lors de la connexion. Réessayez.');
      return;
    }

    await this.sendMessage(chatId, '✅ Compte MatchIQ connecté ! Vous recevrez vos alertes de stratégies ici.');
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private async sendMessage(chatId: number, text: string): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return;

    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    } catch (err) {
      this.logger.error('Failed to send Telegram message:', err);
    }
  }
}
