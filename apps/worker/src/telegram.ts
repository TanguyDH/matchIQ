import TelegramBot from 'node-telegram-bot-api';
import { config } from './config';
import type { EvaluationResult, MatchSnapshot } from '@matchiq/shared-types';

/**
 * Telegram bot instance.
 */
const bot = new TelegramBot(config.telegram.botToken, { polling: false });

/**
 * Sends a Telegram alert when a strategy triggers.
 *
 * @param strategyName - Name of the triggered strategy
 * @param match - The match snapshot
 * @param result - The evaluation result with matched rules
 */
export async function sendAlert(
  strategyName: string,
  match: MatchSnapshot,
  result: EvaluationResult,
): Promise<void> {
  try {
    const message = formatAlertMessage(strategyName, match, result);

    await bot.sendMessage(config.telegram.chatId, message, {
      parse_mode: 'Markdown',
    });

    console.log(`[Telegram] Alert sent for strategy "${strategyName}"`);
  } catch (error) {
    console.error('[Telegram] Failed to send alert:', error);
    throw error; // Re-throw so caller can handle retry logic
  }
}

/**
 * Formats an alert message for Telegram.
 */
function formatAlertMessage(
  strategyName: string,
  match: MatchSnapshot,
  result: EvaluationResult,
): string {
  const lines: string[] = [];

  // Header
  lines.push(`🚨 *Strategy Triggered: ${strategyName}*`);
  lines.push('');

  // Match info
  lines.push(`⚽ *Match:* ${match.homeTeam} vs ${match.awayTeam}`);
  lines.push(`📊 *Score:* ${match.homeScore} - ${match.awayScore}`);
  lines.push(`⏱ *Minute:* ${match.minute}'`);
  lines.push('');

  // Why it triggered
  lines.push('✅ *Matched Rules:*');
  for (const rule of result.matchedRules) {
    lines.push(
      `  • ${rule.metric} ${rule.comparator} ${rule.target} (actual: ${rule.actual})`,
    );
  }

  return lines.join('\n');
}

console.log('[Telegram] Bot initialized');
