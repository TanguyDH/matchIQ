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
  chatId?: string,
): Promise<void> {
  const targetChatId = chatId ?? config.telegram.chatId;

  if (!targetChatId) {
    console.warn(`[Telegram] No chat_id for strategy "${strategyName}" — alert skipped`);
    return;
  }

  try {
    const message = formatAlertMessage(strategyName, match, result);

    await bot.sendMessage(targetChatId, message, {
      parse_mode: 'Markdown',
    });

    console.log(`[Telegram] Alert sent for strategy "${strategyName}"`);
  } catch (error) {
    console.error('[Telegram] Failed to send alert:', error);
    throw error; // Re-throw so caller can handle retry logic
  }
}

/**
 * Escapes special Markdown characters for Telegram.
 * Telegram Markdown requires escaping: _ * [ ] ( ) ~ ` > # + - = | { } . !
 */
function escapeMarkdown(text: string): string {
  return text.replace(/([_*[\]()~`>#+=|{}.!-])/g, '\\$1');
}

/**
 * Converts country code to flag emoji.
 */
function getCountryFlag(countryCode?: string): string {
  const flags: Record<string, string> = {
    'GB': '🇬🇧',
    'ES': '🇪🇸',
    'DE': '🇩🇪',
    'IT': '🇮🇹',
    'FR': '🇫🇷',
    'PT': '🇵🇹',
    'NL': '🇳🇱',
    'BE': '🇧🇪',
  };
  return countryCode ? (flags[countryCode] || '🌍') : '🌍';
}

/**
 * Converts form array to emoji string.
 */
function formatForm(form?: string[]): string {
  if (!form || form.length === 0) return '';

  const formEmojis = form.map((result) => {
    if (result === 'W') return '🟩';
    if (result === 'D') return '🟨';
    if (result === 'L') return '🟥';
    return '⬜';
  });

  return formEmojis.join('');
}

/**
 * Formats an alert message for Telegram with rich statistics.
 */
function formatAlertMessage(
  strategyName: string,
  match: MatchSnapshot,
  result: EvaluationResult,
): string {
  const lines: string[] = [];
  const { inPlay } = match;

  // Header with emoji
  lines.push(`🔔 ${escapeMarkdown(strategyName)}`);
  lines.push('');

  // League info with flag and positions
  if (match.league) {
    const flag = getCountryFlag(match.leagueCountry);
    let leagueLine = `${flag} ${escapeMarkdown(match.league)}`;

    if (match.homePosition && match.awayPosition) {
      leagueLine += ` (${match.homePosition}th vs ${match.awayPosition}th)`;
    }

    lines.push(leagueLine);
  }

  // Match info with team names
  lines.push(`${escapeMarkdown(match.homeTeam)} vs ${escapeMarkdown(match.awayTeam)}`);

  // Form indicators
  if (match.homeForm || match.awayForm) {
    const homeFormStr = formatForm(match.homeForm);
    const awayFormStr = formatForm(match.awayForm);
    if (homeFormStr || awayFormStr) {
      lines.push(`${homeFormStr || '-----'} - ${awayFormStr || '-----'}`);
    }
  }

  lines.push('');

  // Timer
  lines.push(`Timer: ${match.minute}'`);

  // Last goal info
  if (match.lastGoal) {
    const teamName = match.lastGoal.team === 'home' ? 'Home' : 'Away';
    const minutesAgo = match.lastGoal.minutesAgo ?? 0;
    lines.push(`Last Goal: ${teamName} at ${match.lastGoal.minute}' (${minutesAgo} minutes ago)`);
  }

  lines.push('');

  // Scores
  lines.push(`Goals: ${match.homeScore} - ${match.awayScore}`);

  // xG (Expected Goals) - if available with Advanced plan
  if (inPlay.home_xg !== undefined && inPlay.away_xg !== undefined) {
    lines.push(`xG: ${inPlay.home_xg.toFixed(2)} - ${inPlay.away_xg.toFixed(2)}`);
  }

  // Detailed statistics (if available)
  if (inPlay) {
    const stats: string[] = [];

    // Corners
    if (inPlay.home_corners !== undefined && inPlay.away_corners !== undefined) {
      stats.push(`Corners: ${inPlay.home_corners} - ${inPlay.away_corners}`);
    }

    // Momentum
    if (inPlay.home_momentum !== undefined && inPlay.away_momentum !== undefined) {
      stats.push(`Momentum: ${inPlay.home_momentum} - ${inPlay.away_momentum}`);
    }

    // Shots on target
    if (inPlay.home_shots_on_target !== undefined && inPlay.away_shots_on_target !== undefined) {
      stats.push(`Shots On Target: ${inPlay.home_shots_on_target} - ${inPlay.away_shots_on_target}`);
    }

    // Shots off target
    if (inPlay.home_shots_off_target !== undefined && inPlay.away_shots_off_target !== undefined) {
      stats.push(`Shots Off Target: ${inPlay.home_shots_off_target} - ${inPlay.away_shots_off_target}`);
    }

    // Attacks
    if (inPlay.home_attacks !== undefined && inPlay.away_attacks !== undefined) {
      stats.push(`Attacks: ${inPlay.home_attacks} - ${inPlay.away_attacks}`);
    }

    // Dangerous attacks
    if (inPlay.home_dangerous_attacks !== undefined && inPlay.away_dangerous_attacks !== undefined) {
      stats.push(`Dangerous Attacks: ${inPlay.home_dangerous_attacks} - ${inPlay.away_dangerous_attacks}`);
    }

    // Big Chances
    if (inPlay.home_big_chances !== undefined && inPlay.away_big_chances !== undefined) {
      stats.push(`Big Chances Created: ${inPlay.home_big_chances} - ${inPlay.away_big_chances}`);
    }

    // Big Chances Missed
    if (inPlay.home_big_chances_missed !== undefined && inPlay.away_big_chances_missed !== undefined) {
      stats.push(`Big Chances Missed: ${inPlay.home_big_chances_missed} - ${inPlay.away_big_chances_missed}`);
    }

    // Yellow cards
    if (inPlay.home_yellow_cards !== undefined && inPlay.away_yellow_cards !== undefined) {
      stats.push(`Yellow Cards: ${inPlay.home_yellow_cards} - ${inPlay.away_yellow_cards}`);
    }

    // Red cards
    if (inPlay.home_red_cards !== undefined && inPlay.away_red_cards !== undefined) {
      stats.push(`Red Cards: ${inPlay.home_red_cards} - ${inPlay.away_red_cards}`);
    }

    // Key passes
    if (inPlay.home_key_passes !== undefined && inPlay.away_key_passes !== undefined) {
      stats.push(`Key Passes: ${inPlay.home_key_passes} - ${inPlay.away_key_passes}`);
    }

    // Crosses
    if (inPlay.home_crosses !== undefined && inPlay.away_crosses !== undefined) {
      stats.push(`Crosses: ${inPlay.home_crosses} - ${inPlay.away_crosses}`);
    }

    // Penalties
    if (inPlay.home_penalties !== undefined && inPlay.away_penalties !== undefined) {
      stats.push(`Penalties: ${inPlay.home_penalties} - ${inPlay.away_penalties}`);
    }

    // Substitutions (from events)
    if (inPlay.home_substitutions !== undefined && inPlay.away_substitutions !== undefined) {
      stats.push(`Substitutions: ${inPlay.home_substitutions} - ${inPlay.away_substitutions}`);
    }

    // Possession
    if (inPlay.home_possession !== undefined && inPlay.away_possession !== undefined) {
      stats.push(`Possession %: ${inPlay.home_possession} - ${inPlay.away_possession}`);
    }

    // Passing accuracy
    if (inPlay.home_passes_percentage !== undefined && inPlay.away_passes_percentage !== undefined) {
      stats.push(`Passing Accuracy %: ${inPlay.home_passes_percentage} - ${inPlay.away_passes_percentage}`);
    }

    // Crossing accuracy
    if (inPlay.home_crosses_accurate !== undefined && inPlay.away_crosses_accurate !== undefined &&
        inPlay.home_crosses !== undefined && inPlay.away_crosses !== undefined) {
      const homeAccuracy = inPlay.home_crosses > 0 ? Math.round((inPlay.home_crosses_accurate / inPlay.home_crosses) * 100) : 0;
      const awayAccuracy = inPlay.away_crosses > 0 ? Math.round((inPlay.away_crosses_accurate / inPlay.away_crosses) * 100) : 0;
      stats.push(`Crossing Accuracy %: ${homeAccuracy} - ${awayAccuracy}`);
    }

    // Interceptions
    if (inPlay.home_interceptions !== undefined && inPlay.away_interceptions !== undefined) {
      stats.push(`Interceptions: ${inPlay.home_interceptions} - ${inPlay.away_interceptions}`);
    }

    // Tackles
    if (inPlay.home_tackles !== undefined && inPlay.away_tackles !== undefined) {
      stats.push(`Tackles: ${inPlay.home_tackles} - ${inPlay.away_tackles}`);
    }

    // Successful dribbles
    if (inPlay.home_successful_dribbles !== undefined && inPlay.away_successful_dribbles !== undefined) {
      stats.push(`Successful Dribbles: ${inPlay.home_successful_dribbles} - ${inPlay.away_successful_dribbles}`);
    }

    if (stats.length > 0) {
      lines.push(...stats);
      lines.push('');
    }
  }

  // Odds (if available)
  if (match.odds && Object.keys(match.odds).length > 0) {
    // 1X2 Pre-Match Odds
    if (match.odds.prematch_home_win && match.odds.prematch_draw && match.odds.prematch_away_win) {
      lines.push('1X2 Pre-Match Odds:');
      lines.push(`${match.odds.prematch_home_win.toFixed(2)} ${match.odds.prematch_draw.toFixed(2)} ${match.odds.prematch_away_win.toFixed(2)}`);
    }

    // 1X2 Live Odds
    if (match.odds.live_home_win && match.odds.live_draw && match.odds.live_away_win) {
      lines.push('1X2 Live Odds:');
      lines.push(`${match.odds.live_home_win.toFixed(2)} ${match.odds.live_draw.toFixed(2)} ${match.odds.live_away_win.toFixed(2)}`);
    }

    // Over/Under 1.5 Odds
    if (match.odds.over_1_5 && match.odds.under_1_5) {
      lines.push('Over/Under 1.5 Odds:');
      lines.push(`${match.odds.over_1_5.toFixed(2)} ${match.odds.under_1_5.toFixed(2)}`);
    }

    lines.push('');
  }

  // Why it triggered
  lines.push('✅ *Matched Rules:*');
  for (const rule of result.matchedRules) {
    const actualValue = rule.actual !== null && rule.actual !== undefined ? rule.actual : 'N/A';
    lines.push(`  • ${escapeMarkdown(rule.metric)} ${escapeMarkdown(rule.comparator)} ${rule.target} (actual: ${actualValue})`);
  }

  // HT/FT Score (if available)
  if (match.halfTimeScore) {
    lines.push('');
    lines.push(`HT Score: ${match.halfTimeScore.home}-${match.halfTimeScore.away}`);
  }

  return lines.join('\n');
}

console.log('[Telegram] Bot initialized');
