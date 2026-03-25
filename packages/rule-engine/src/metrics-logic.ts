/**
 * ════════════════════════════════════════════════════════════════════════════
 * LOGIQUE DES MÉTRIQUES IN_PLAY
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Ce fichier gère TOUTE la logique d'extraction et d'évaluation des métriques
 * IN_PLAY pour le rule engine.
 *
 * Structure:
 * 1. Liste de toutes les métriques supportées
 * 2. Fonction d'extraction pour chaque métrique
 * 3. Logique des team scopes (HOME, AWAY, TOTAL, etc.)
 */

import type { Rule, MatchSnapshot, TeamScope } from '@matchiq/shared-types';

// ════════════════════════════════════════════════════════════════════════════
// 1. DÉFINITION DES MÉTRIQUES IN_PLAY
// ════════════════════════════════════════════════════════════════════════════

/**
 * Toutes les métriques IN_PLAY supportées.
 * Chaque métrique définit comment l'extraire du MatchSnapshot.
 */
export const IN_PLAY_METRIC_EXTRACTORS: Record<
  string,
  (inPlay: Record<string, number>) => { home: number | null; away: number | null }
> = {
  // ──────────────────────────────────────────────────────────────────────────
  // CONTEXTE DU MATCH
  // ──────────────────────────────────────────────────────────────────────────

  match_timer: (inPlay) => ({
    home: inPlay.match_timer ?? null,
    away: inPlay.match_timer ?? null, // Same value for both (match-level metric)
  }),

  minutes_since_last_goal: (inPlay) => ({
    home: inPlay.minutes_since_last_goal ?? null,
    away: inPlay.minutes_since_last_goal ?? null, // Same value for both (match-level metric)
  }),

  league_position: (inPlay) => ({
    home: inPlay.home_league_position ?? null,
    away: inPlay.away_league_position ?? null,
  }),

  // exchange_matched_amount: (inPlay) => ({
  //   home: inPlay.exchange_matched_amount ?? null,
  //   away: inPlay.exchange_matched_amount ?? null, // Same value for both (match-level metric)
  // }),
  // TODO: Exchange Matched Amount requires Betfair/Betdaq API integration

  // ──────────────────────────────────────────────────────────────────────────
  // SCORE & BUTS
  // ──────────────────────────────────────────────────────────────────────────

  goals: (inPlay) => ({
    home: inPlay.home_goals ?? null,
    away: inPlay.away_goals ?? null,
  }),

  penalties: (inPlay) => ({
    home: inPlay.home_penalties ?? null,
    away: inPlay.away_penalties ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // TIRS (SHOTS)
  // ──────────────────────────────────────────────────────────────────────────

  shots_total: (inPlay) => ({
    home: inPlay.home_shots_total ?? null,
    away: inPlay.away_shots_total ?? null,
  }),

  shots_on_target: (inPlay) => ({
    home: inPlay.home_shots_on_target ?? null,
    away: inPlay.away_shots_on_target ?? null,
  }),

  shots_off_target: (inPlay) => ({
    home: inPlay.home_shots_off_target ?? null,
    away: inPlay.away_shots_off_target ?? null,
  }),

  shots_blocked: (inPlay) => ({
    home: inPlay.home_shots_blocked ?? null,
    away: inPlay.away_shots_blocked ?? null,
  }),

  shots_inside_box: (inPlay) => ({
    home: inPlay.home_shots_inside_box ?? null,
    away: inPlay.away_shots_inside_box ?? null,
  }),

  shots_outside_box: (inPlay) => ({
    home: inPlay.home_shots_outside_box ?? null,
    away: inPlay.away_shots_outside_box ?? null,
  }),

  // Alias pour compatibilité avec l'UI
  shots: (inPlay) => ({
    home: inPlay.home_shots_total ?? null,
    away: inPlay.away_shots_total ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // ATTACKING PLAY
  // ──────────────────────────────────────────────────────────────────────────

  attacks: (inPlay) => ({
    home: inPlay.home_attacks ?? null,
    away: inPlay.away_attacks ?? null,
  }),

  dangerous_attacks: (inPlay) => ({
    home: inPlay.home_dangerous_attacks ?? null,
    away: inPlay.away_dangerous_attacks ?? null,
  }),

  crosses: (inPlay) => ({
    home: inPlay.home_crosses ?? null,
    away: inPlay.away_crosses ?? null,
  }),

  key_passes: (inPlay) => ({
    home: inPlay.home_key_passes ?? null,
    away: inPlay.away_key_passes ?? null,
  }),

  momentum: (inPlay) => ({
    home: inPlay.home_momentum ?? null,
    away: inPlay.away_momentum ?? null,
  }),

  // xg: (inPlay) => ({
  //   home: inPlay.home_xg ?? null,
  //   away: inPlay.away_xg ?? null,
  // }),
  // TODO: xG requires Advanced xG add-on - API returns 403 Forbidden without subscription

  // ──────────────────────────────────────────────────────────────────────────
  // COUPS DE PIED ARRÊTÉS
  // ──────────────────────────────────────────────────────────────────────────

  corners: (inPlay) => ({
    home: inPlay.home_corners ?? null,
    away: inPlay.away_corners ?? null,
  }),

  free_kicks: (inPlay) => ({
    home: inPlay.home_free_kicks ?? null,
    away: inPlay.away_free_kicks ?? null,
  }),

  offsides: (inPlay) => ({
    home: inPlay.home_offsides ?? null,
    away: inPlay.away_offsides ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // POSSESSION & PASSES
  // ──────────────────────────────────────────────────────────────────────────

  possession: (inPlay) => ({
    home: inPlay.home_possession ?? null,
    away: inPlay.away_possession ?? null,
  }),

  passes_total: (inPlay) => ({
    home: inPlay.home_passes_total ?? null,
    away: inPlay.away_passes_total ?? null,
  }),

  passes_accurate: (inPlay) => ({
    home: inPlay.home_passes_accurate ?? null,
    away: inPlay.away_passes_accurate ?? null,
  }),

  passes_percentage: (inPlay) => ({
    home: inPlay.home_passes_percentage ?? null,
    away: inPlay.away_passes_percentage ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // POSSESSION & BUILD-UP (avec suffixe _pct pour l'UI)
  // ──────────────────────────────────────────────────────────────────────────

  passing_accuracy_pct: (inPlay) => ({
    home: inPlay.home_passes_percentage ?? null,
    away: inPlay.away_passes_percentage ?? null,
  }),

  crossing_accuracy_pct: (inPlay) => {
    // Calcul: (crosses_accurate / crosses) * 100
    const homeAccuracy = inPlay.home_crosses && inPlay.home_crosses > 0
      ? Math.round((inPlay.home_crosses_accurate ?? 0) / inPlay.home_crosses * 100)
      : null;
    const awayAccuracy = inPlay.away_crosses && inPlay.away_crosses > 0
      ? Math.round((inPlay.away_crosses_accurate ?? 0) / inPlay.away_crosses * 100)
      : null;

    return {
      home: homeAccuracy,
      away: awayAccuracy,
    };
  },

  ball_possession_pct: (inPlay) => ({
    home: inPlay.home_possession ?? null,
    away: inPlay.away_possession ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // DISCIPLINE (CARTONS & FAUTES)
  // ──────────────────────────────────────────────────────────────────────────

  yellow_cards: (inPlay) => ({
    home: inPlay.home_yellow_cards ?? null,
    away: inPlay.away_yellow_cards ?? null,
  }),

  red_cards: (inPlay) => ({
    home: inPlay.home_red_cards ?? null,
    away: inPlay.away_red_cards ?? null,
  }),

  fouls: (inPlay) => ({
    home: inPlay.home_fouls ?? null,
    away: inPlay.away_fouls ?? null,
  }),

  substitutions: (inPlay) => ({
    home: inPlay.home_substitutions ?? null,
    away: inPlay.away_substitutions ?? null,
  }),

  injuries: (inPlay) => ({
    home: inPlay.home_injuries ?? null,
    away: inPlay.away_injuries ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // GARDIEN DE BUT
  // ──────────────────────────────────────────────────────────────────────────

  saves: (inPlay) => ({
    home: inPlay.home_saves ?? null,
    away: inPlay.away_saves ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // STATISTIQUES AVANCÉES
  // ──────────────────────────────────────────────────────────────────────────

  expected_goals: (inPlay) => ({
    home: inPlay.home_expected_goals ?? null,
    away: inPlay.away_expected_goals ?? null,
  }),
};

// ════════════════════════════════════════════════════════════════════════════
// 2. EXTRACTION DE MÉTRIQUE AVEC TEAM SCOPE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Extrait la valeur d'une métrique IN_PLAY en appliquant le team scope.
 *
 * @param rule - La règle contenant la métrique et le team_scope
 * @param match - Le snapshot du match avec les données inPlay
 * @returns La valeur calculée, ou null si indisponible
 *
 * @example
 * // Règle: goals (HOME) >= 2
 * extractInPlayMetric(rule, match) // → 2 (home_goals)
 *
 * // Règle: corners (TOTAL) > 10
 * extractInPlayMetric(rule, match) // → 14 (home_corners + away_corners)
 *
 * // Règle: shots_total (EITHER_TEAM) >= 15
 * extractInPlayMetric(rule, match) // → 18 (max des deux)
 */
export function extractInPlayMetric(rule: Rule, match: MatchSnapshot): number | null {
  const metric = rule.metric;

  // Vérifie que la métrique existe
  const extractor = IN_PLAY_METRIC_EXTRACTORS[metric];
  if (!extractor) {
    console.warn(`[MetricsLogic] Unknown IN_PLAY metric: ${metric}`);
    return null;
  }

  // Extrait les valeurs home/away
  const { home, away } = extractor(match.inPlay);

  // Si pas de team_scope, retourne la valeur brute (pour compatibilité)
  if (!rule.team_scope) {
    // Comportement par défaut: retourne home si disponible, sinon null
    return home;
  }

  // Applique le team scope
  return applyTeamScope(rule.team_scope, home, away, match);
}

// ════════════════════════════════════════════════════════════════════════════
// 3. LOGIQUE DES TEAM SCOPES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Applique un team scope sur les valeurs home/away d'une métrique.
 *
 * @param teamScope - Le scope à appliquer (HOME, AWAY, TOTAL, etc.)
 * @param homeValue - Valeur pour l'équipe à domicile
 * @param awayValue - Valeur pour l'équipe à l'extérieur
 * @param match - Le match snapshot (utilisé pour FAVOURITE, UNDERDOG, etc.)
 * @returns La valeur calculée selon le scope
 *
 * SCOPES SUPPORTÉS:
 * ─────────────────────────────────────────────────────────────────────────
 * HOME              → Équipe à domicile uniquement
 * AWAY              → Équipe à l'extérieur uniquement
 * TOTAL             → Somme des deux équipes
 * EITHER_TEAM       → Maximum des deux (au moins une équipe)
 * EITHER_OPPONENT   → Minimum des deux (les deux équipes)
 * DIFFERENCE        → Différence absolue entre les deux
 * WINNING_TEAM      → L'équipe qui gagne actuellement
 * LOSING_TEAM       → L'équipe qui perd actuellement
 * FAVOURITE         → L'équipe favorite (score plus élevé ou égal)
 * UNDERDOG          → L'équipe moins favorite (score plus bas)
 * FAVOURITE_HOME    → Favorite jouant à domicile
 * FAVOURITE_AWAY    → Favorite jouant à l'extérieur
 * UNDERDOG_HOME     → Underdog jouant à domicile
 * UNDERDOG_AWAY     → Underdog jouant à l'extérieur
 */
function applyTeamScope(
  teamScope: TeamScope,
  homeValue: number | null,
  awayValue: number | null,
  match: MatchSnapshot,
): number | null {
  // Si une valeur manque, la plupart des scopes ne peuvent pas calculer
  const bothAvailable = homeValue !== null && awayValue !== null;

  switch (teamScope) {
    // ────────────────────────────────────────────────────────────────────────
    // SCOPES SIMPLES (une seule équipe)
    // ────────────────────────────────────────────────────────────────────────

    case 'HOME':
      return homeValue;

    case 'AWAY':
      return awayValue;

    // ────────────────────────────────────────────────────────────────────────
    // SCOPES COMBINÉS (deux équipes)
    // ────────────────────────────────────────────────────────────────────────

    case 'TOTAL':
      // Somme: home_goals + away_goals
      if (!bothAvailable) return null;
      return homeValue! + awayValue!;

    case 'EITHER_TEAM':
      // Maximum: au moins une équipe a cette valeur
      // Exemple: EITHER_TEAM goals >= 2 → une équipe a marqué au moins 2 buts
      if (!bothAvailable) return null;
      return Math.max(homeValue!, awayValue!);

    case 'EITHER_OPPONENT':
      // Minimum: les deux équipes ont au moins cette valeur
      // Exemple: EITHER_OPPONENT shots >= 10 → les deux équipes ont au moins 10 tirs
      if (!bothAvailable) return null;
      return Math.min(homeValue!, awayValue!);

    case 'DIFFERENCE':
      // Différence absolue
      // Exemple: DIFFERENCE possession > 20 → écart de possession > 20%
      if (!bothAvailable) return null;
      return Math.abs(homeValue! - awayValue!);

    // ────────────────────────────────────────────────────────────────────────
    // SCOPES BASÉS SUR LE SCORE
    // ────────────────────────────────────────────────────────────────────────

    case 'WINNING_TEAM':
      // L'équipe qui gagne actuellement
      if (!bothAvailable) return null;
      if (match.homeScore > match.awayScore) return homeValue!;
      if (match.awayScore > match.homeScore) return awayValue!;
      return 0; // Match nul → retourne 0

    case 'LOSING_TEAM':
      // L'équipe qui perd actuellement
      if (!bothAvailable) return null;
      if (match.homeScore < match.awayScore) return homeValue!;
      if (match.awayScore < match.homeScore) return awayValue!;
      return 0; // Match nul → retourne 0

    case 'FAVOURITE':
      // Équipe favorite = celle avec la cote la plus BASSE
      // Cote plus basse = plus probable de gagner selon les bookmakers
      if (!bothAvailable) return null;

      // Récupérer les cotes pré-match (ou live en fallback)
      const homeOdds = match.odds?.home_pm_odds_1x2 ?? match.odds?.home_live_odds_1x2;
      const awayOdds = match.odds?.away_pm_odds_1x2 ?? match.odds?.away_live_odds_1x2;

      // Si pas de cotes disponibles, impossible de déterminer le favori
      if (!homeOdds || !awayOdds) return null;

      // Favorite = cote la plus basse
      return homeOdds <= awayOdds ? homeValue! : awayValue!;

    case 'UNDERDOG':
      // Équipe underdog = celle avec la cote la plus HAUTE
      if (!bothAvailable) return null;

      const homeOddsUnderdog = match.odds?.home_pm_odds_1x2 ?? match.odds?.home_live_odds_1x2;
      const awayOddsUnderdog = match.odds?.away_pm_odds_1x2 ?? match.odds?.away_live_odds_1x2;

      // Si pas de cotes disponibles, impossible de déterminer l'underdog
      if (!homeOddsUnderdog || !awayOddsUnderdog) return null;

      // Underdog = cote la plus haute
      return homeOddsUnderdog > awayOddsUnderdog ? homeValue! : awayValue!;

    case 'FAVOURITE_HOME':
      // Favorite jouant à domicile
      // Si home est favorite (cote <= away), retourne homeValue, sinon 0
      if (homeValue === null) return null;

      const homeOddsFavHome = match.odds?.home_pm_odds_1x2 ?? match.odds?.home_live_odds_1x2;
      const awayOddsFavHome = match.odds?.away_pm_odds_1x2 ?? match.odds?.away_live_odds_1x2;

      if (!homeOddsFavHome || !awayOddsFavHome) return null;

      return homeOddsFavHome <= awayOddsFavHome ? homeValue : 0;

    case 'FAVOURITE_AWAY':
      // Favorite jouant à l'extérieur
      // Si away est favorite (cote < home), retourne awayValue, sinon 0
      if (awayValue === null) return null;

      const homeOddsFavAway = match.odds?.home_pm_odds_1x2 ?? match.odds?.home_live_odds_1x2;
      const awayOddsFavAway = match.odds?.away_pm_odds_1x2 ?? match.odds?.away_live_odds_1x2;

      if (!homeOddsFavAway || !awayOddsFavAway) return null;

      return awayOddsFavAway < homeOddsFavAway ? awayValue : 0;

    case 'UNDERDOG_HOME':
      // Underdog jouant à domicile
      // Si home est underdog (cote > away), retourne homeValue, sinon 0
      if (homeValue === null) return null;

      const homeOddsUnderdogHome = match.odds?.home_pm_odds_1x2 ?? match.odds?.home_live_odds_1x2;
      const awayOddsUnderdogHome = match.odds?.away_pm_odds_1x2 ?? match.odds?.away_live_odds_1x2;

      if (!homeOddsUnderdogHome || !awayOddsUnderdogHome) return null;

      return homeOddsUnderdogHome > awayOddsUnderdogHome ? homeValue : 0;

    case 'UNDERDOG_AWAY':
      // Underdog jouant à l'extérieur
      // Si away est underdog (cote > home), retourne awayValue, sinon 0
      if (awayValue === null) return null;

      const homeOddsUnderdogAway = match.odds?.home_pm_odds_1x2 ?? match.odds?.home_live_odds_1x2;
      const awayOddsUnderdogAway = match.odds?.away_pm_odds_1x2 ?? match.odds?.away_live_odds_1x2;

      if (!homeOddsUnderdogAway || !awayOddsUnderdogAway) return null;

      return awayOddsUnderdogAway > homeOddsUnderdogAway ? awayValue : 0;

    // ────────────────────────────────────────────────────────────────────────
    // SCOPE INCONNU
    // ────────────────────────────────────────────────────────────────────────

    default:
      console.warn(`[MetricsLogic] Unknown team scope: ${teamScope}`);
      return null;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 4. UTILITAIRES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Vérifie si une métrique est supportée pour le type IN_PLAY.
 */
export function isValidInPlayMetric(metric: string): boolean {
  return metric in IN_PLAY_METRIC_EXTRACTORS;
}

/**
 * Liste toutes les métriques IN_PLAY supportées.
 */
export function listInPlayMetrics(): string[] {
  return Object.keys(IN_PLAY_METRIC_EXTRACTORS);
}

// ════════════════════════════════════════════════════════════════════════════
// EXEMPLES D'UTILISATION
// ════════════════════════════════════════════════════════════════════════════

/*

EXEMPLE 1: Règle simple
─────────────────────────────────────────────────────────────────────────────
Règle: goals (HOME) >= 2

Données match:
  inPlay: { home_goals: 2, away_goals: 1 }

Extraction:
  1. extractor = IN_PLAY_METRIC_EXTRACTORS['goals']
  2. { home: 2, away: 1 } = extractor(match.inPlay)
  3. applyTeamScope('HOME', 2, 1, match) → 2
  4. Comparaison: 2 >= 2 → TRUE ✓

─────────────────────────────────────────────────────────────────────────────

EXEMPLE 2: Règle avec TOTAL
─────────────────────────────────────────────────────────────────────────────
Règle: corners (TOTAL) > 10

Données match:
  inPlay: { home_corners: 6, away_corners: 5 }

Extraction:
  1. extractor = IN_PLAY_METRIC_EXTRACTORS['corners']
  2. { home: 6, away: 5 } = extractor(match.inPlay)
  3. applyTeamScope('TOTAL', 6, 5, match) → 6 + 5 = 11
  4. Comparaison: 11 > 10 → TRUE ✓

─────────────────────────────────────────────────────────────────────────────

EXEMPLE 3: Règle avec EITHER_TEAM
─────────────────────────────────────────────────────────────────────────────
Règle: shots_total (EITHER_TEAM) >= 15

Données match:
  inPlay: { home_shots_total: 18, away_shots_total: 12 }

Extraction:
  1. extractor = IN_PLAY_METRIC_EXTRACTORS['shots_total']
  2. { home: 18, away: 12 } = extractor(match.inPlay)
  3. applyTeamScope('EITHER_TEAM', 18, 12, match) → max(18, 12) = 18
  4. Comparaison: 18 >= 15 → TRUE ✓

─────────────────────────────────────────────────────────────────────────────

EXEMPLE 4: Règle avec WINNING_TEAM
─────────────────────────────────────────────────────────────────────────────
Règle: possession (WINNING_TEAM) > 55

Données match:
  homeScore: 2, awayScore: 1 (home gagne)
  inPlay: { home_possession: 58, away_possession: 42 }

Extraction:
  1. extractor = IN_PLAY_METRIC_EXTRACTORS['possession']
  2. { home: 58, away: 42 } = extractor(match.inPlay)
  3. applyTeamScope('WINNING_TEAM', 58, 42, match)
     → homeScore (2) > awayScore (1) → retourne homeValue (58)
  4. Comparaison: 58 > 55 → TRUE ✓

─────────────────────────────────────────────────────────────────────────────

EXEMPLE 5: Règle avec DIFFERENCE
─────────────────────────────────────────────────────────────────────────────
Règle: possession (DIFFERENCE) > 20

Données match:
  inPlay: { home_possession: 65, away_possession: 35 }

Extraction:
  1. extractor = IN_PLAY_METRIC_EXTRACTORS['possession']
  2. { home: 65, away: 35 } = extractor(match.inPlay)
  3. applyTeamScope('DIFFERENCE', 65, 35, match) → |65 - 35| = 30
  4. Comparaison: 30 > 20 → TRUE ✓

*/

// ════════════════════════════════════════════════════════════════════════════
// PRE-MATCH METRICS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Extractors for PRE_MATCH metrics.
 * Similar to IN_PLAY_METRIC_EXTRACTORS but for pre-match statistics.
 *
 * Batch 1: 8 Essential Metrics
 */
export const PRE_MATCH_METRIC_EXTRACTORS: Record<
  string,
  (preMatch: Record<string, number>) => { home: number | null; away: number | null }
> = {
  // ──────────────────────────────────────────────────────────────────────────
  // GOAL AVERAGES (Last 5 matches)
  // ──────────────────────────────────────────────────────────────────────────

  avg_match_goals_l5: (preMatch) => ({
    home: preMatch.home_avg_match_goals_l5 ?? null,
    away: preMatch.away_avg_match_goals_l5 ?? null,
  }),

  avg_goals_scored_l5: (preMatch) => ({
    home: preMatch.home_avg_goals_scored_l5 ?? null,
    away: preMatch.away_avg_goals_scored_l5 ?? null,
  }),

  avg_goals_conceded_l5: (preMatch) => ({
    home: preMatch.home_avg_goals_conceded_l5 ?? null,
    away: preMatch.away_avg_goals_conceded_l5 ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // WIN/BTTS/CLEAN SHEET PERCENTAGES (Last 5 matches)
  // ──────────────────────────────────────────────────────────────────────────

  win_pct_l5: (preMatch) => ({
    home: preMatch.home_win_pct_l5 ?? null,
    away: preMatch.away_win_pct_l5 ?? null,
  }),

  btts_pct_l5: (preMatch) => ({
    home: preMatch.home_btts_pct_l5 ?? null,
    away: preMatch.away_btts_pct_l5 ?? null,
  }),

  clean_sheet_pct_l5: (preMatch) => ({
    home: preMatch.home_clean_sheet_pct_l5 ?? null,
    away: preMatch.away_clean_sheet_pct_l5 ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // OVER/UNDER PERCENTAGES (Last 5 matches)
  // ──────────────────────────────────────────────────────────────────────────

  over_1_5_match_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_over_1_5_match_goals_pct_l5 ?? null,
    away: preMatch.away_over_1_5_match_goals_pct_l5 ?? null,
  }),

  over_2_5_match_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_over_2_5_match_goals_pct_l5 ?? null,
    away: preMatch.away_over_2_5_match_goals_pct_l5 ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // BATCH 2: Additional Over/Under + Results
  // ──────────────────────────────────────────────────────────────────────────

  over_0_5_match_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_over_0_5_match_goals_pct_l5 ?? null,
    away: preMatch.away_over_0_5_match_goals_pct_l5 ?? null,
  }),

  over_3_5_match_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_over_3_5_match_goals_pct_l5 ?? null,
    away: preMatch.away_over_3_5_match_goals_pct_l5 ?? null,
  }),

  over_4_5_match_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_over_4_5_match_goals_pct_l5 ?? null,
    away: preMatch.away_over_4_5_match_goals_pct_l5 ?? null,
  }),

  draw_pct_l5: (preMatch) => ({
    home: preMatch.home_draw_pct_l5 ?? null,
    away: preMatch.away_draw_pct_l5 ?? null,
  }),

  loss_pct_l5: (preMatch) => ({
    home: preMatch.home_loss_pct_l5 ?? null,
    away: preMatch.away_loss_pct_l5 ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // BATCH 3: HOME VARIANTS (Last 5 home matches only)
  // ──────────────────────────────────────────────────────────────────────────

  avg_match_goals_l5h: (preMatch) => ({
    home: preMatch.home_avg_match_goals_l5h ?? null,
    away: preMatch.away_avg_match_goals_l5h ?? null,
  }),

  avg_goals_scored_l5h: (preMatch) => ({
    home: preMatch.home_avg_goals_scored_l5h ?? null,
    away: preMatch.away_avg_goals_scored_l5h ?? null,
  }),

  avg_goals_conceded_l5h: (preMatch) => ({
    home: preMatch.home_avg_goals_conceded_l5h ?? null,
    away: preMatch.away_avg_goals_conceded_l5h ?? null,
  }),

  win_pct_l5h: (preMatch) => ({
    home: preMatch.home_win_pct_l5h ?? null,
    away: preMatch.away_win_pct_l5h ?? null,
  }),

  btts_pct_l5h: (preMatch) => ({
    home: preMatch.home_btts_pct_l5h ?? null,
    away: preMatch.away_btts_pct_l5h ?? null,
  }),

  clean_sheet_pct_l5h: (preMatch) => ({
    home: preMatch.home_clean_sheet_pct_l5h ?? null,
    away: preMatch.away_clean_sheet_pct_l5h ?? null,
  }),

  over_1_5_match_goals_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_1_5_match_goals_pct_l5h ?? null,
    away: preMatch.away_over_1_5_match_goals_pct_l5h ?? null,
  }),

  over_2_5_match_goals_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_2_5_match_goals_pct_l5h ?? null,
    away: preMatch.away_over_2_5_match_goals_pct_l5h ?? null,
  }),

  over_0_5_match_goals_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_0_5_match_goals_pct_l5h ?? null,
    away: preMatch.away_over_0_5_match_goals_pct_l5h ?? null,
  }),

  over_3_5_match_goals_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_3_5_match_goals_pct_l5h ?? null,
    away: preMatch.away_over_3_5_match_goals_pct_l5h ?? null,
  }),

  over_4_5_match_goals_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_4_5_match_goals_pct_l5h ?? null,
    away: preMatch.away_over_4_5_match_goals_pct_l5h ?? null,
  }),

  draw_pct_l5h: (preMatch) => ({
    home: preMatch.home_draw_pct_l5h ?? null,
    away: preMatch.away_draw_pct_l5h ?? null,
  }),

  loss_pct_l5h: (preMatch) => ({
    home: preMatch.home_loss_pct_l5h ?? null,
    away: preMatch.away_loss_pct_l5h ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // BATCH 3: AWAY VARIANTS (Last 5 away matches only)
  // ──────────────────────────────────────────────────────────────────────────

  avg_match_goals_l5a: (preMatch) => ({
    home: preMatch.home_avg_match_goals_l5a ?? null,
    away: preMatch.away_avg_match_goals_l5a ?? null,
  }),

  avg_goals_scored_l5a: (preMatch) => ({
    home: preMatch.home_avg_goals_scored_l5a ?? null,
    away: preMatch.away_avg_goals_scored_l5a ?? null,
  }),

  avg_goals_conceded_l5a: (preMatch) => ({
    home: preMatch.home_avg_goals_conceded_l5a ?? null,
    away: preMatch.away_avg_goals_conceded_l5a ?? null,
  }),

  win_pct_l5a: (preMatch) => ({
    home: preMatch.home_win_pct_l5a ?? null,
    away: preMatch.away_win_pct_l5a ?? null,
  }),

  btts_pct_l5a: (preMatch) => ({
    home: preMatch.home_btts_pct_l5a ?? null,
    away: preMatch.away_btts_pct_l5a ?? null,
  }),

  clean_sheet_pct_l5a: (preMatch) => ({
    home: preMatch.home_clean_sheet_pct_l5a ?? null,
    away: preMatch.away_clean_sheet_pct_l5a ?? null,
  }),

  over_1_5_match_goals_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_1_5_match_goals_pct_l5a ?? null,
    away: preMatch.away_over_1_5_match_goals_pct_l5a ?? null,
  }),

  over_2_5_match_goals_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_2_5_match_goals_pct_l5a ?? null,
    away: preMatch.away_over_2_5_match_goals_pct_l5a ?? null,
  }),

  over_0_5_match_goals_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_0_5_match_goals_pct_l5a ?? null,
    away: preMatch.away_over_0_5_match_goals_pct_l5a ?? null,
  }),

  over_3_5_match_goals_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_3_5_match_goals_pct_l5a ?? null,
    away: preMatch.away_over_3_5_match_goals_pct_l5a ?? null,
  }),

  over_4_5_match_goals_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_4_5_match_goals_pct_l5a ?? null,
    away: preMatch.away_over_4_5_match_goals_pct_l5a ?? null,
  }),

  draw_pct_l5a: (preMatch) => ({
    home: preMatch.home_draw_pct_l5a ?? null,
    away: preMatch.away_draw_pct_l5a ?? null,
  }),

  loss_pct_l5a: (preMatch) => ({
    home: preMatch.home_loss_pct_l5a ?? null,
    away: preMatch.away_loss_pct_l5a ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // BATCH 4: HALF TIME & SECOND HALF METRICS (All matches)
  // ──────────────────────────────────────────────────────────────────────────

  // Half Time - Goal Averages
  avg_1h_goals_l5: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_l5 ?? null,
    away: preMatch.away_avg_1h_goals_l5 ?? null,
  }),

  avg_1h_goals_scored_l5: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_scored_l5 ?? null,
    away: preMatch.away_avg_1h_goals_scored_l5 ?? null,
  }),

  avg_1h_goals_conceded_l5: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_conceded_l5 ?? null,
    away: preMatch.away_avg_1h_goals_conceded_l5 ?? null,
  }),

  // Half Time - Results
  ht_win_pct_l5: (preMatch) => ({
    home: preMatch.home_ht_win_pct_l5 ?? null,
    away: preMatch.away_ht_win_pct_l5 ?? null,
  }),

  ht_draw_pct_l5: (preMatch) => ({
    home: preMatch.home_ht_draw_pct_l5 ?? null,
    away: preMatch.away_ht_draw_pct_l5 ?? null,
  }),

  ht_loss_pct_l5: (preMatch) => ({
    home: preMatch.home_ht_loss_pct_l5 ?? null,
    away: preMatch.away_ht_loss_pct_l5 ?? null,
  }),

  ht_btts_pct_l5: (preMatch) => ({
    home: preMatch.home_ht_btts_pct_l5 ?? null,
    away: preMatch.away_ht_btts_pct_l5 ?? null,
  }),

  // Half Time - Over/Under
  over_0_5_ht_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_over_0_5_ht_goals_pct_l5 ?? null,
    away: preMatch.away_over_0_5_ht_goals_pct_l5 ?? null,
  }),

  over_1_5_ht_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_over_1_5_ht_goals_pct_l5 ?? null,
    away: preMatch.away_over_1_5_ht_goals_pct_l5 ?? null,
  }),

  over_2_5_ht_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_over_2_5_ht_goals_pct_l5 ?? null,
    away: preMatch.away_over_2_5_ht_goals_pct_l5 ?? null,
  }),

  over_3_5_ht_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_over_3_5_ht_goals_pct_l5 ?? null,
    away: preMatch.away_over_3_5_ht_goals_pct_l5 ?? null,
  }),

  over_4_5_ht_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_over_4_5_ht_goals_pct_l5 ?? null,
    away: preMatch.away_over_4_5_ht_goals_pct_l5 ?? null,
  }),

  // Second Half - Goal Averages
  avg_2h_goals_l5: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_l5 ?? null,
    away: preMatch.away_avg_2h_goals_l5 ?? null,
  }),

  avg_2h_goals_scored_l5: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_scored_l5 ?? null,
    away: preMatch.away_avg_2h_goals_scored_l5 ?? null,
  }),

  avg_2h_goals_conceded_l5: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_conceded_l5 ?? null,
    away: preMatch.away_avg_2h_goals_conceded_l5 ?? null,
  }),

  // Second Half - Results
  '2h_win_pct_l5': (preMatch) => ({
    home: preMatch['home_2h_win_pct_l5'] ?? null,
    away: preMatch['away_2h_win_pct_l5'] ?? null,
  }),

  '2h_draw_pct_l5': (preMatch) => ({
    home: preMatch['home_2h_draw_pct_l5'] ?? null,
    away: preMatch['away_2h_draw_pct_l5'] ?? null,
  }),

  '2h_loss_pct_l5': (preMatch) => ({
    home: preMatch['home_2h_loss_pct_l5'] ?? null,
    away: preMatch['away_2h_loss_pct_l5'] ?? null,
  }),

  '2h_btts_pct_l5': (preMatch) => ({
    home: preMatch['home_2h_btts_pct_l5'] ?? null,
    away: preMatch['away_2h_btts_pct_l5'] ?? null,
  }),

  // Second Half - Over/Under
  over_0_5_2h_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_over_0_5_2h_goals_pct_l5 ?? null,
    away: preMatch.away_over_0_5_2h_goals_pct_l5 ?? null,
  }),

  over_1_5_2h_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_over_1_5_2h_goals_pct_l5 ?? null,
    away: preMatch.away_over_1_5_2h_goals_pct_l5 ?? null,
  }),

  over_2_5_2h_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_over_2_5_2h_goals_pct_l5 ?? null,
    away: preMatch.away_over_2_5_2h_goals_pct_l5 ?? null,
  }),

  over_3_5_2h_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_over_3_5_2h_goals_pct_l5 ?? null,
    away: preMatch.away_over_3_5_2h_goals_pct_l5 ?? null,
  }),

  over_4_5_2h_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_over_4_5_2h_goals_pct_l5 ?? null,
    away: preMatch.away_over_4_5_2h_goals_pct_l5 ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // BATCH 4: HALF TIME & SECOND HALF - HOME VARIANTS
  // ──────────────────────────────────────────────────────────────────────────

  // Half Time - Home - Goal Averages
  avg_1h_goals_l5h: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_l5h ?? null,
    away: preMatch.away_avg_1h_goals_l5h ?? null,
  }),

  avg_1h_goals_scored_l5h: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_scored_l5h ?? null,
    away: preMatch.away_avg_1h_goals_scored_l5h ?? null,
  }),

  avg_1h_goals_conceded_l5h: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_conceded_l5h ?? null,
    away: preMatch.away_avg_1h_goals_conceded_l5h ?? null,
  }),

  // Half Time - Home - Results
  ht_win_pct_l5h: (preMatch) => ({
    home: preMatch.home_ht_win_pct_l5h ?? null,
    away: preMatch.away_ht_win_pct_l5h ?? null,
  }),

  ht_draw_pct_l5h: (preMatch) => ({
    home: preMatch.home_ht_draw_pct_l5h ?? null,
    away: preMatch.away_ht_draw_pct_l5h ?? null,
  }),

  ht_loss_pct_l5h: (preMatch) => ({
    home: preMatch.home_ht_loss_pct_l5h ?? null,
    away: preMatch.away_ht_loss_pct_l5h ?? null,
  }),

  ht_btts_pct_l5h: (preMatch) => ({
    home: preMatch.home_ht_btts_pct_l5h ?? null,
    away: preMatch.away_ht_btts_pct_l5h ?? null,
  }),

  // Half Time - Home - Over/Under
  over_0_5_ht_goals_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_0_5_ht_goals_pct_l5h ?? null,
    away: preMatch.away_over_0_5_ht_goals_pct_l5h ?? null,
  }),

  over_1_5_ht_goals_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_1_5_ht_goals_pct_l5h ?? null,
    away: preMatch.away_over_1_5_ht_goals_pct_l5h ?? null,
  }),

  over_2_5_ht_goals_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_2_5_ht_goals_pct_l5h ?? null,
    away: preMatch.away_over_2_5_ht_goals_pct_l5h ?? null,
  }),

  over_3_5_ht_goals_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_3_5_ht_goals_pct_l5h ?? null,
    away: preMatch.away_over_3_5_ht_goals_pct_l5h ?? null,
  }),

  over_4_5_ht_goals_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_4_5_ht_goals_pct_l5h ?? null,
    away: preMatch.away_over_4_5_ht_goals_pct_l5h ?? null,
  }),

  // Second Half - Home - Goal Averages
  avg_2h_goals_l5h: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_l5h ?? null,
    away: preMatch.away_avg_2h_goals_l5h ?? null,
  }),

  avg_2h_goals_scored_l5h: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_scored_l5h ?? null,
    away: preMatch.away_avg_2h_goals_scored_l5h ?? null,
  }),

  avg_2h_goals_conceded_l5h: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_conceded_l5h ?? null,
    away: preMatch.away_avg_2h_goals_conceded_l5h ?? null,
  }),

  // Second Half - Home - Results
  '2h_win_pct_l5h': (preMatch) => ({
    home: preMatch['home_2h_win_pct_l5h'] ?? null,
    away: preMatch['away_2h_win_pct_l5h'] ?? null,
  }),

  '2h_draw_pct_l5h': (preMatch) => ({
    home: preMatch['home_2h_draw_pct_l5h'] ?? null,
    away: preMatch['away_2h_draw_pct_l5h'] ?? null,
  }),

  '2h_loss_pct_l5h': (preMatch) => ({
    home: preMatch['home_2h_loss_pct_l5h'] ?? null,
    away: preMatch['away_2h_loss_pct_l5h'] ?? null,
  }),

  '2h_btts_pct_l5h': (preMatch) => ({
    home: preMatch['home_2h_btts_pct_l5h'] ?? null,
    away: preMatch['away_2h_btts_pct_l5h'] ?? null,
  }),

  // Second Half - Home - Over/Under
  over_0_5_2h_goals_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_0_5_2h_goals_pct_l5h ?? null,
    away: preMatch.away_over_0_5_2h_goals_pct_l5h ?? null,
  }),

  over_1_5_2h_goals_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_1_5_2h_goals_pct_l5h ?? null,
    away: preMatch.away_over_1_5_2h_goals_pct_l5h ?? null,
  }),

  over_2_5_2h_goals_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_2_5_2h_goals_pct_l5h ?? null,
    away: preMatch.away_over_2_5_2h_goals_pct_l5h ?? null,
  }),

  over_3_5_2h_goals_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_3_5_2h_goals_pct_l5h ?? null,
    away: preMatch.away_over_3_5_2h_goals_pct_l5h ?? null,
  }),

  over_4_5_2h_goals_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_4_5_2h_goals_pct_l5h ?? null,
    away: preMatch.away_over_4_5_2h_goals_pct_l5h ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // BATCH 4: HALF TIME & SECOND HALF - AWAY VARIANTS
  // ──────────────────────────────────────────────────────────────────────────

  // Half Time - Away - Goal Averages
  avg_1h_goals_l5a: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_l5a ?? null,
    away: preMatch.away_avg_1h_goals_l5a ?? null,
  }),

  avg_1h_goals_scored_l5a: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_scored_l5a ?? null,
    away: preMatch.away_avg_1h_goals_scored_l5a ?? null,
  }),

  avg_1h_goals_conceded_l5a: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_conceded_l5a ?? null,
    away: preMatch.away_avg_1h_goals_conceded_l5a ?? null,
  }),

  // Half Time - Away - Results
  ht_win_pct_l5a: (preMatch) => ({
    home: preMatch.home_ht_win_pct_l5a ?? null,
    away: preMatch.away_ht_win_pct_l5a ?? null,
  }),

  ht_draw_pct_l5a: (preMatch) => ({
    home: preMatch.home_ht_draw_pct_l5a ?? null,
    away: preMatch.away_ht_draw_pct_l5a ?? null,
  }),

  ht_loss_pct_l5a: (preMatch) => ({
    home: preMatch.home_ht_loss_pct_l5a ?? null,
    away: preMatch.away_ht_loss_pct_l5a ?? null,
  }),

  ht_btts_pct_l5a: (preMatch) => ({
    home: preMatch.home_ht_btts_pct_l5a ?? null,
    away: preMatch.away_ht_btts_pct_l5a ?? null,
  }),

  // Half Time - Away - Over/Under
  over_0_5_ht_goals_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_0_5_ht_goals_pct_l5a ?? null,
    away: preMatch.away_over_0_5_ht_goals_pct_l5a ?? null,
  }),

  over_1_5_ht_goals_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_1_5_ht_goals_pct_l5a ?? null,
    away: preMatch.away_over_1_5_ht_goals_pct_l5a ?? null,
  }),

  over_2_5_ht_goals_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_2_5_ht_goals_pct_l5a ?? null,
    away: preMatch.away_over_2_5_ht_goals_pct_l5a ?? null,
  }),

  over_3_5_ht_goals_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_3_5_ht_goals_pct_l5a ?? null,
    away: preMatch.away_over_3_5_ht_goals_pct_l5a ?? null,
  }),

  over_4_5_ht_goals_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_4_5_ht_goals_pct_l5a ?? null,
    away: preMatch.away_over_4_5_ht_goals_pct_l5a ?? null,
  }),

  // Second Half - Away - Goal Averages
  avg_2h_goals_l5a: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_l5a ?? null,
    away: preMatch.away_avg_2h_goals_l5a ?? null,
  }),

  avg_2h_goals_scored_l5a: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_scored_l5a ?? null,
    away: preMatch.away_avg_2h_goals_scored_l5a ?? null,
  }),

  avg_2h_goals_conceded_l5a: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_conceded_l5a ?? null,
    away: preMatch.away_avg_2h_goals_conceded_l5a ?? null,
  }),

  // Second Half - Away - Results
  '2h_win_pct_l5a': (preMatch) => ({
    home: preMatch['home_2h_win_pct_l5a'] ?? null,
    away: preMatch['away_2h_win_pct_l5a'] ?? null,
  }),

  '2h_draw_pct_l5a': (preMatch) => ({
    home: preMatch['home_2h_draw_pct_l5a'] ?? null,
    away: preMatch['away_2h_draw_pct_l5a'] ?? null,
  }),

  '2h_loss_pct_l5a': (preMatch) => ({
    home: preMatch['home_2h_loss_pct_l5a'] ?? null,
    away: preMatch['away_2h_loss_pct_l5a'] ?? null,
  }),

  '2h_btts_pct_l5a': (preMatch) => ({
    home: preMatch['home_2h_btts_pct_l5a'] ?? null,
    away: preMatch['away_2h_btts_pct_l5a'] ?? null,
  }),

  // Second Half - Away - Over/Under
  over_0_5_2h_goals_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_0_5_2h_goals_pct_l5a ?? null,
    away: preMatch.away_over_0_5_2h_goals_pct_l5a ?? null,
  }),

  over_1_5_2h_goals_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_1_5_2h_goals_pct_l5a ?? null,
    away: preMatch.away_over_1_5_2h_goals_pct_l5a ?? null,
  }),

  over_2_5_2h_goals_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_2_5_2h_goals_pct_l5a ?? null,
    away: preMatch.away_over_2_5_2h_goals_pct_l5a ?? null,
  }),

  over_3_5_2h_goals_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_3_5_2h_goals_pct_l5a ?? null,
    away: preMatch.away_over_3_5_2h_goals_pct_l5a ?? null,
  }),

  over_4_5_2h_goals_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_4_5_2h_goals_pct_l5a ?? null,
    away: preMatch.away_over_4_5_2h_goals_pct_l5a ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // BATCH 5: GOALS SCORED / CONCEDED VARIANTS (All matches)
  // ──────────────────────────────────────────────────────────────────────────

  // Goals Scored - Over X
  over_0_5_goals_scored_pct_l5: (preMatch) => ({
    home: preMatch.home_over_0_5_goals_scored_pct_l5 ?? null,
    away: preMatch.away_over_0_5_goals_scored_pct_l5 ?? null,
  }),

  over_1_5_goals_scored_pct_l5: (preMatch) => ({
    home: preMatch.home_over_1_5_goals_scored_pct_l5 ?? null,
    away: preMatch.away_over_1_5_goals_scored_pct_l5 ?? null,
  }),

  over_2_5_goals_scored_pct_l5: (preMatch) => ({
    home: preMatch.home_over_2_5_goals_scored_pct_l5 ?? null,
    away: preMatch.away_over_2_5_goals_scored_pct_l5 ?? null,
  }),

  over_3_5_goals_scored_pct_l5: (preMatch) => ({
    home: preMatch.home_over_3_5_goals_scored_pct_l5 ?? null,
    away: preMatch.away_over_3_5_goals_scored_pct_l5 ?? null,
  }),

  over_4_5_goals_scored_pct_l5: (preMatch) => ({
    home: preMatch.home_over_4_5_goals_scored_pct_l5 ?? null,
    away: preMatch.away_over_4_5_goals_scored_pct_l5 ?? null,
  }),

  failed_to_score_pct_l5: (preMatch) => ({
    home: preMatch.home_failed_to_score_pct_l5 ?? null,
    away: preMatch.away_failed_to_score_pct_l5 ?? null,
  }),

  // Goals Conceded - Over X
  over_0_5_goals_conceded_pct_l5: (preMatch) => ({
    home: preMatch.home_over_0_5_goals_conceded_pct_l5 ?? null,
    away: preMatch.away_over_0_5_goals_conceded_pct_l5 ?? null,
  }),

  over_1_5_goals_conceded_pct_l5: (preMatch) => ({
    home: preMatch.home_over_1_5_goals_conceded_pct_l5 ?? null,
    away: preMatch.away_over_1_5_goals_conceded_pct_l5 ?? null,
  }),

  over_2_5_goals_conceded_pct_l5: (preMatch) => ({
    home: preMatch.home_over_2_5_goals_conceded_pct_l5 ?? null,
    away: preMatch.away_over_2_5_goals_conceded_pct_l5 ?? null,
  }),

  over_3_5_goals_conceded_pct_l5: (preMatch) => ({
    home: preMatch.home_over_3_5_goals_conceded_pct_l5 ?? null,
    away: preMatch.away_over_3_5_goals_conceded_pct_l5 ?? null,
  }),

  over_4_5_goals_conceded_pct_l5: (preMatch) => ({
    home: preMatch.home_over_4_5_goals_conceded_pct_l5 ?? null,
    away: preMatch.away_over_4_5_goals_conceded_pct_l5 ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // BATCH 5: HOME VARIANTS
  // ──────────────────────────────────────────────────────────────────────────

  // Goals Scored - Home - Over X
  over_0_5_goals_scored_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_0_5_goals_scored_pct_l5h ?? null,
    away: preMatch.away_over_0_5_goals_scored_pct_l5h ?? null,
  }),

  over_1_5_goals_scored_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_1_5_goals_scored_pct_l5h ?? null,
    away: preMatch.away_over_1_5_goals_scored_pct_l5h ?? null,
  }),

  over_2_5_goals_scored_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_2_5_goals_scored_pct_l5h ?? null,
    away: preMatch.away_over_2_5_goals_scored_pct_l5h ?? null,
  }),

  over_3_5_goals_scored_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_3_5_goals_scored_pct_l5h ?? null,
    away: preMatch.away_over_3_5_goals_scored_pct_l5h ?? null,
  }),

  over_4_5_goals_scored_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_4_5_goals_scored_pct_l5h ?? null,
    away: preMatch.away_over_4_5_goals_scored_pct_l5h ?? null,
  }),

  failed_to_score_pct_l5h: (preMatch) => ({
    home: preMatch.home_failed_to_score_pct_l5h ?? null,
    away: preMatch.away_failed_to_score_pct_l5h ?? null,
  }),

  // Goals Conceded - Home - Over X
  over_0_5_goals_conceded_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_0_5_goals_conceded_pct_l5h ?? null,
    away: preMatch.away_over_0_5_goals_conceded_pct_l5h ?? null,
  }),

  over_1_5_goals_conceded_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_1_5_goals_conceded_pct_l5h ?? null,
    away: preMatch.away_over_1_5_goals_conceded_pct_l5h ?? null,
  }),

  over_2_5_goals_conceded_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_2_5_goals_conceded_pct_l5h ?? null,
    away: preMatch.away_over_2_5_goals_conceded_pct_l5h ?? null,
  }),

  over_3_5_goals_conceded_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_3_5_goals_conceded_pct_l5h ?? null,
    away: preMatch.away_over_3_5_goals_conceded_pct_l5h ?? null,
  }),

  over_4_5_goals_conceded_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_4_5_goals_conceded_pct_l5h ?? null,
    away: preMatch.away_over_4_5_goals_conceded_pct_l5h ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // BATCH 5: AWAY VARIANTS
  // ──────────────────────────────────────────────────────────────────────────

  // Goals Scored - Away - Over X
  over_0_5_goals_scored_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_0_5_goals_scored_pct_l5a ?? null,
    away: preMatch.away_over_0_5_goals_scored_pct_l5a ?? null,
  }),

  over_1_5_goals_scored_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_1_5_goals_scored_pct_l5a ?? null,
    away: preMatch.away_over_1_5_goals_scored_pct_l5a ?? null,
  }),

  over_2_5_goals_scored_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_2_5_goals_scored_pct_l5a ?? null,
    away: preMatch.away_over_2_5_goals_scored_pct_l5a ?? null,
  }),

  over_3_5_goals_scored_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_3_5_goals_scored_pct_l5a ?? null,
    away: preMatch.away_over_3_5_goals_scored_pct_l5a ?? null,
  }),

  over_4_5_goals_scored_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_4_5_goals_scored_pct_l5a ?? null,
    away: preMatch.away_over_4_5_goals_scored_pct_l5a ?? null,
  }),

  failed_to_score_pct_l5a: (preMatch) => ({
    home: preMatch.home_failed_to_score_pct_l5a ?? null,
    away: preMatch.away_failed_to_score_pct_l5a ?? null,
  }),

  // Goals Conceded - Away - Over X
  over_0_5_goals_conceded_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_0_5_goals_conceded_pct_l5a ?? null,
    away: preMatch.away_over_0_5_goals_conceded_pct_l5a ?? null,
  }),

  over_1_5_goals_conceded_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_1_5_goals_conceded_pct_l5a ?? null,
    away: preMatch.away_over_1_5_goals_conceded_pct_l5a ?? null,
  }),

  over_2_5_goals_conceded_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_2_5_goals_conceded_pct_l5a ?? null,
    away: preMatch.away_over_2_5_goals_conceded_pct_l5a ?? null,
  }),

  over_3_5_goals_conceded_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_3_5_goals_conceded_pct_l5a ?? null,
    away: preMatch.away_over_3_5_goals_conceded_pct_l5a ?? null,
  }),

  over_4_5_goals_conceded_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_4_5_goals_conceded_pct_l5a ?? null,
    away: preMatch.away_over_4_5_goals_conceded_pct_l5a ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // BATCH 6 - CORNERS
  // ──────────────────────────────────────────────────────────────────────────

  // All matches
  avg_corners_l5: (preMatch) => ({
    home: preMatch.home_avg_corners_l5 ?? null,
    away: preMatch.away_avg_corners_l5 ?? null,
  }),

  avg_corners_for_l5: (preMatch) => ({
    home: preMatch.home_avg_corners_for_l5 ?? null,
    away: preMatch.away_avg_corners_for_l5 ?? null,
  }),

  avg_corners_against_l5: (preMatch) => ({
    home: preMatch.home_avg_corners_against_l5 ?? null,
    away: preMatch.away_avg_corners_against_l5 ?? null,
  }),

  over_10_corners_pct_l5: (preMatch) => ({
    home: preMatch.home_over_10_corners_pct_l5 ?? null,
    away: preMatch.away_over_10_corners_pct_l5 ?? null,
  }),

  // Home matches only
  avg_corners_l5h: (preMatch) => ({
    home: preMatch.home_avg_corners_l5h ?? null,
    away: preMatch.away_avg_corners_l5h ?? null,
  }),

  avg_corners_for_l5h: (preMatch) => ({
    home: preMatch.home_avg_corners_for_l5h ?? null,
    away: preMatch.away_avg_corners_for_l5h ?? null,
  }),

  avg_corners_against_l5h: (preMatch) => ({
    home: preMatch.home_avg_corners_against_l5h ?? null,
    away: preMatch.away_avg_corners_against_l5h ?? null,
  }),

  over_10_corners_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_10_corners_pct_l5h ?? null,
    away: preMatch.away_over_10_corners_pct_l5h ?? null,
  }),

  // Away matches only
  avg_corners_l5a: (preMatch) => ({
    home: preMatch.home_avg_corners_l5a ?? null,
    away: preMatch.away_avg_corners_l5a ?? null,
  }),

  avg_corners_for_l5a: (preMatch) => ({
    home: preMatch.home_avg_corners_for_l5a ?? null,
    away: preMatch.away_avg_corners_for_l5a ?? null,
  }),

  avg_corners_against_l5a: (preMatch) => ({
    home: preMatch.home_avg_corners_against_l5a ?? null,
    away: preMatch.away_avg_corners_against_l5a ?? null,
  }),

  over_10_corners_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_10_corners_pct_l5a ?? null,
    away: preMatch.away_over_10_corners_pct_l5a ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // BATCH 7 - SHOTS
  // ──────────────────────────────────────────────────────────────────────────

  // All matches
  avg_shots_l5: (preMatch) => ({
    home: preMatch.home_avg_shots_l5 ?? null,
    away: preMatch.away_avg_shots_l5 ?? null,
  }),

  avg_shots_for_l5: (preMatch) => ({
    home: preMatch.home_avg_shots_for_l5 ?? null,
    away: preMatch.away_avg_shots_for_l5 ?? null,
  }),

  avg_shots_against_l5: (preMatch) => ({
    home: preMatch.home_avg_shots_against_l5 ?? null,
    away: preMatch.away_avg_shots_against_l5 ?? null,
  }),

  avg_shots_on_target_l5: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_l5 ?? null,
    away: preMatch.away_avg_shots_on_target_l5 ?? null,
  }),

  avg_shots_on_target_for_l5: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_for_l5 ?? null,
    away: preMatch.away_avg_shots_on_target_for_l5 ?? null,
  }),

  avg_shots_on_target_against_l5: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_against_l5 ?? null,
    away: preMatch.away_avg_shots_on_target_against_l5 ?? null,
  }),

  over_15_shots_pct_l5: (preMatch) => ({
    home: preMatch.home_over_15_shots_pct_l5 ?? null,
    away: preMatch.away_over_15_shots_pct_l5 ?? null,
  }),

  over_5_shots_on_target_pct_l5: (preMatch) => ({
    home: preMatch.home_over_5_shots_on_target_pct_l5 ?? null,
    away: preMatch.away_over_5_shots_on_target_pct_l5 ?? null,
  }),

  // Home matches only
  avg_shots_l5h: (preMatch) => ({
    home: preMatch.home_avg_shots_l5h ?? null,
    away: preMatch.away_avg_shots_l5h ?? null,
  }),

  avg_shots_for_l5h: (preMatch) => ({
    home: preMatch.home_avg_shots_for_l5h ?? null,
    away: preMatch.away_avg_shots_for_l5h ?? null,
  }),

  avg_shots_against_l5h: (preMatch) => ({
    home: preMatch.home_avg_shots_against_l5h ?? null,
    away: preMatch.away_avg_shots_against_l5h ?? null,
  }),

  avg_shots_on_target_l5h: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_l5h ?? null,
    away: preMatch.away_avg_shots_on_target_l5h ?? null,
  }),

  avg_shots_on_target_for_l5h: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_for_l5h ?? null,
    away: preMatch.away_avg_shots_on_target_for_l5h ?? null,
  }),

  avg_shots_on_target_against_l5h: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_against_l5h ?? null,
    away: preMatch.away_avg_shots_on_target_against_l5h ?? null,
  }),

  over_15_shots_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_15_shots_pct_l5h ?? null,
    away: preMatch.away_over_15_shots_pct_l5h ?? null,
  }),

  over_5_shots_on_target_pct_l5h: (preMatch) => ({
    home: preMatch.home_over_5_shots_on_target_pct_l5h ?? null,
    away: preMatch.away_over_5_shots_on_target_pct_l5h ?? null,
  }),

  // Away matches only
  avg_shots_l5a: (preMatch) => ({
    home: preMatch.home_avg_shots_l5a ?? null,
    away: preMatch.away_avg_shots_l5a ?? null,
  }),

  avg_shots_for_l5a: (preMatch) => ({
    home: preMatch.home_avg_shots_for_l5a ?? null,
    away: preMatch.away_avg_shots_for_l5a ?? null,
  }),

  avg_shots_against_l5a: (preMatch) => ({
    home: preMatch.home_avg_shots_against_l5a ?? null,
    away: preMatch.away_avg_shots_against_l5a ?? null,
  }),

  avg_shots_on_target_l5a: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_l5a ?? null,
    away: preMatch.away_avg_shots_on_target_l5a ?? null,
  }),

  avg_shots_on_target_for_l5a: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_for_l5a ?? null,
    away: preMatch.away_avg_shots_on_target_for_l5a ?? null,
  }),

  avg_shots_on_target_against_l5a: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_against_l5a ?? null,
    away: preMatch.away_avg_shots_on_target_against_l5a ?? null,
  }),

  over_15_shots_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_15_shots_pct_l5a ?? null,
    away: preMatch.away_over_15_shots_pct_l5a ?? null,
  }),

  over_5_shots_on_target_pct_l5a: (preMatch) => ({
    home: preMatch.home_over_5_shots_on_target_pct_l5a ?? null,
    away: preMatch.away_over_5_shots_on_target_pct_l5a ?? null,
  }),

  // ──────────────────────────────────────────────────────────────────────────
  // BATCH 8 - SHOTS OFF TARGET
  // ──────────────────────────────────────────────────────────────────────────

  // All matches
  avg_shots_off_target_l5: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_l5 ?? null,
    away: preMatch.away_avg_shots_off_target_l5 ?? null,
  }),

  avg_shots_off_target_for_l5: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_for_l5 ?? null,
    away: preMatch.away_avg_shots_off_target_for_l5 ?? null,
  }),

  avg_shots_off_target_against_l5: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_against_l5 ?? null,
    away: preMatch.away_avg_shots_off_target_against_l5 ?? null,
  }),

  // Home matches only
  avg_shots_off_target_l5h: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_l5h ?? null,
    away: preMatch.away_avg_shots_off_target_l5h ?? null,
  }),

  avg_shots_off_target_for_l5h: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_for_l5h ?? null,
    away: preMatch.away_avg_shots_off_target_for_l5h ?? null,
  }),

  avg_shots_off_target_against_l5h: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_against_l5h ?? null,
    away: preMatch.away_avg_shots_off_target_against_l5h ?? null,
  }),

  // Away matches only
  avg_shots_off_target_l5a: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_l5a ?? null,
    away: preMatch.away_avg_shots_off_target_l5a ?? null,
  }),

  avg_shots_off_target_for_l5a: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_for_l5a ?? null,
    away: preMatch.away_avg_shots_off_target_for_l5a ?? null,
  }),

  avg_shots_off_target_against_l5a: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_against_l5a ?? null,
    away: preMatch.away_avg_shots_off_target_against_l5a ?? null,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 9 - LAST 10 MATCHES
  // ═══════════════════════════════════════════════════════════════════════════

  avg_match_goals_l10: (preMatch) => ({
    home: preMatch.home_avg_match_goals_l10 ?? null,
    away: preMatch.away_avg_match_goals_l10 ?? null,
  }),

  avg_goals_scored_l10: (preMatch) => ({
    home: preMatch.home_avg_goals_scored_l10 ?? null,
    away: preMatch.away_avg_goals_scored_l10 ?? null,
  }),

  avg_goals_conceded_l10: (preMatch) => ({
    home: preMatch.home_avg_goals_conceded_l10 ?? null,
    away: preMatch.away_avg_goals_conceded_l10 ?? null,
  }),

  win_pct_l10: (preMatch) => ({
    home: preMatch.home_win_pct_l10 ?? null,
    away: preMatch.away_win_pct_l10 ?? null,
  }),

  draw_pct_l10: (preMatch) => ({
    home: preMatch.home_draw_pct_l10 ?? null,
    away: preMatch.away_draw_pct_l10 ?? null,
  }),

  loss_pct_l10: (preMatch) => ({
    home: preMatch.home_loss_pct_l10 ?? null,
    away: preMatch.away_loss_pct_l10 ?? null,
  }),

  btts_pct_l10: (preMatch) => ({
    home: preMatch.home_btts_pct_l10 ?? null,
    away: preMatch.away_btts_pct_l10 ?? null,
  }),

  clean_sheet_pct_l10: (preMatch) => ({
    home: preMatch.home_clean_sheet_pct_l10 ?? null,
    away: preMatch.away_clean_sheet_pct_l10 ?? null,
  }),

  failed_to_score_pct_l10: (preMatch) => ({
    home: preMatch.home_failed_to_score_pct_l10 ?? null,
    away: preMatch.away_failed_to_score_pct_l10 ?? null,
  }),

  over_0_5_match_goals_pct_l10: (preMatch) => ({
    home: preMatch.home_over_0_5_match_goals_pct_l10 ?? null,
    away: preMatch.away_over_0_5_match_goals_pct_l10 ?? null,
  }),

  over_1_5_match_goals_pct_l10: (preMatch) => ({
    home: preMatch.home_over_1_5_match_goals_pct_l10 ?? null,
    away: preMatch.away_over_1_5_match_goals_pct_l10 ?? null,
  }),

  over_2_5_match_goals_pct_l10: (preMatch) => ({
    home: preMatch.home_over_2_5_match_goals_pct_l10 ?? null,
    away: preMatch.away_over_2_5_match_goals_pct_l10 ?? null,
  }),

  over_3_5_match_goals_pct_l10: (preMatch) => ({
    home: preMatch.home_over_3_5_match_goals_pct_l10 ?? null,
    away: preMatch.away_over_3_5_match_goals_pct_l10 ?? null,
  }),

  over_4_5_match_goals_pct_l10: (preMatch) => ({
    home: preMatch.home_over_4_5_match_goals_pct_l10 ?? null,
    away: preMatch.away_over_4_5_match_goals_pct_l10 ?? null,
  }),

  avg_1h_goals_l10: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_l10 ?? null,
    away: preMatch.away_avg_1h_goals_l10 ?? null,
  }),

  avg_1h_goals_scored_l10: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_scored_l10 ?? null,
    away: preMatch.away_avg_1h_goals_scored_l10 ?? null,
  }),

  avg_1h_goals_conceded_l10: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_conceded_l10 ?? null,
    away: preMatch.away_avg_1h_goals_conceded_l10 ?? null,
  }),

  ht_win_pct_l10: (preMatch) => ({
    home: preMatch.home_ht_win_pct_l10 ?? null,
    away: preMatch.away_ht_win_pct_l10 ?? null,
  }),

  ht_draw_pct_l10: (preMatch) => ({
    home: preMatch.home_ht_draw_pct_l10 ?? null,
    away: preMatch.away_ht_draw_pct_l10 ?? null,
  }),

  ht_loss_pct_l10: (preMatch) => ({
    home: preMatch.home_ht_loss_pct_l10 ?? null,
    away: preMatch.away_ht_loss_pct_l10 ?? null,
  }),

  ht_btts_pct_l10: (preMatch) => ({
    home: preMatch.home_ht_btts_pct_l10 ?? null,
    away: preMatch.away_ht_btts_pct_l10 ?? null,
  }),

  over_0_5_ht_goals_pct_l10: (preMatch) => ({
    home: preMatch.home_over_0_5_ht_goals_pct_l10 ?? null,
    away: preMatch.away_over_0_5_ht_goals_pct_l10 ?? null,
  }),

  over_1_5_ht_goals_pct_l10: (preMatch) => ({
    home: preMatch.home_over_1_5_ht_goals_pct_l10 ?? null,
    away: preMatch.away_over_1_5_ht_goals_pct_l10 ?? null,
  }),

  over_2_5_ht_goals_pct_l10: (preMatch) => ({
    home: preMatch.home_over_2_5_ht_goals_pct_l10 ?? null,
    away: preMatch.away_over_2_5_ht_goals_pct_l10 ?? null,
  }),

  over_3_5_ht_goals_pct_l10: (preMatch) => ({
    home: preMatch.home_over_3_5_ht_goals_pct_l10 ?? null,
    away: preMatch.away_over_3_5_ht_goals_pct_l10 ?? null,
  }),

  over_4_5_ht_goals_pct_l10: (preMatch) => ({
    home: preMatch.home_over_4_5_ht_goals_pct_l10 ?? null,
    away: preMatch.away_over_4_5_ht_goals_pct_l10 ?? null,
  }),

  avg_2h_goals_l10: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_l10 ?? null,
    away: preMatch.away_avg_2h_goals_l10 ?? null,
  }),

  avg_2h_goals_scored_l10: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_scored_l10 ?? null,
    away: preMatch.away_avg_2h_goals_scored_l10 ?? null,
  }),

  avg_2h_goals_conceded_l10: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_conceded_l10 ?? null,
    away: preMatch.away_avg_2h_goals_conceded_l10 ?? null,
  }),

  '2h_win_pct_l10': (preMatch) => ({
    home: preMatch['home_2h_win_pct_l10'] ?? null,
    away: preMatch['away_2h_win_pct_l10'] ?? null,
  }),

  '2h_draw_pct_l10': (preMatch) => ({
    home: preMatch['home_2h_draw_pct_l10'] ?? null,
    away: preMatch['away_2h_draw_pct_l10'] ?? null,
  }),

  '2h_loss_pct_l10': (preMatch) => ({
    home: preMatch['home_2h_loss_pct_l10'] ?? null,
    away: preMatch['away_2h_loss_pct_l10'] ?? null,
  }),

  '2h_btts_pct_l10': (preMatch) => ({
    home: preMatch['home_2h_btts_pct_l10'] ?? null,
    away: preMatch['away_2h_btts_pct_l10'] ?? null,
  }),

  over_0_5_2h_goals_pct_l10: (preMatch) => ({
    home: preMatch.home_over_0_5_2h_goals_pct_l10 ?? null,
    away: preMatch.away_over_0_5_2h_goals_pct_l10 ?? null,
  }),

  over_1_5_2h_goals_pct_l10: (preMatch) => ({
    home: preMatch.home_over_1_5_2h_goals_pct_l10 ?? null,
    away: preMatch.away_over_1_5_2h_goals_pct_l10 ?? null,
  }),

  over_2_5_2h_goals_pct_l10: (preMatch) => ({
    home: preMatch.home_over_2_5_2h_goals_pct_l10 ?? null,
    away: preMatch.away_over_2_5_2h_goals_pct_l10 ?? null,
  }),

  over_3_5_2h_goals_pct_l10: (preMatch) => ({
    home: preMatch.home_over_3_5_2h_goals_pct_l10 ?? null,
    away: preMatch.away_over_3_5_2h_goals_pct_l10 ?? null,
  }),

  over_4_5_2h_goals_pct_l10: (preMatch) => ({
    home: preMatch.home_over_4_5_2h_goals_pct_l10 ?? null,
    away: preMatch.away_over_4_5_2h_goals_pct_l10 ?? null,
  }),

  over_0_5_goals_scored_pct_l10: (preMatch) => ({
    home: preMatch.home_over_0_5_goals_scored_pct_l10 ?? null,
    away: preMatch.away_over_0_5_goals_scored_pct_l10 ?? null,
  }),

  over_1_5_goals_scored_pct_l10: (preMatch) => ({
    home: preMatch.home_over_1_5_goals_scored_pct_l10 ?? null,
    away: preMatch.away_over_1_5_goals_scored_pct_l10 ?? null,
  }),

  over_2_5_goals_scored_pct_l10: (preMatch) => ({
    home: preMatch.home_over_2_5_goals_scored_pct_l10 ?? null,
    away: preMatch.away_over_2_5_goals_scored_pct_l10 ?? null,
  }),

  over_3_5_goals_scored_pct_l10: (preMatch) => ({
    home: preMatch.home_over_3_5_goals_scored_pct_l10 ?? null,
    away: preMatch.away_over_3_5_goals_scored_pct_l10 ?? null,
  }),

  over_4_5_goals_scored_pct_l10: (preMatch) => ({
    home: preMatch.home_over_4_5_goals_scored_pct_l10 ?? null,
    away: preMatch.away_over_4_5_goals_scored_pct_l10 ?? null,
  }),

  over_0_5_goals_conceded_pct_l10: (preMatch) => ({
    home: preMatch.home_over_0_5_goals_conceded_pct_l10 ?? null,
    away: preMatch.away_over_0_5_goals_conceded_pct_l10 ?? null,
  }),

  over_1_5_goals_conceded_pct_l10: (preMatch) => ({
    home: preMatch.home_over_1_5_goals_conceded_pct_l10 ?? null,
    away: preMatch.away_over_1_5_goals_conceded_pct_l10 ?? null,
  }),

  over_2_5_goals_conceded_pct_l10: (preMatch) => ({
    home: preMatch.home_over_2_5_goals_conceded_pct_l10 ?? null,
    away: preMatch.away_over_2_5_goals_conceded_pct_l10 ?? null,
  }),

  over_3_5_goals_conceded_pct_l10: (preMatch) => ({
    home: preMatch.home_over_3_5_goals_conceded_pct_l10 ?? null,
    away: preMatch.away_over_3_5_goals_conceded_pct_l10 ?? null,
  }),

  over_4_5_goals_conceded_pct_l10: (preMatch) => ({
    home: preMatch.home_over_4_5_goals_conceded_pct_l10 ?? null,
    away: preMatch.away_over_4_5_goals_conceded_pct_l10 ?? null,
  }),

  avg_corners_l10: (preMatch) => ({
    home: preMatch.home_avg_corners_l10 ?? null,
    away: preMatch.away_avg_corners_l10 ?? null,
  }),

  avg_corners_for_l10: (preMatch) => ({
    home: preMatch.home_avg_corners_for_l10 ?? null,
    away: preMatch.away_avg_corners_for_l10 ?? null,
  }),

  avg_corners_against_l10: (preMatch) => ({
    home: preMatch.home_avg_corners_against_l10 ?? null,
    away: preMatch.away_avg_corners_against_l10 ?? null,
  }),

  over_10_corners_pct_l10: (preMatch) => ({
    home: preMatch.home_over_10_corners_pct_l10 ?? null,
    away: preMatch.away_over_10_corners_pct_l10 ?? null,
  }),

  avg_shots_l10: (preMatch) => ({
    home: preMatch.home_avg_shots_l10 ?? null,
    away: preMatch.away_avg_shots_l10 ?? null,
  }),

  avg_shots_for_l10: (preMatch) => ({
    home: preMatch.home_avg_shots_for_l10 ?? null,
    away: preMatch.away_avg_shots_for_l10 ?? null,
  }),

  avg_shots_against_l10: (preMatch) => ({
    home: preMatch.home_avg_shots_against_l10 ?? null,
    away: preMatch.away_avg_shots_against_l10 ?? null,
  }),

  avg_shots_on_target_l10: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_l10 ?? null,
    away: preMatch.away_avg_shots_on_target_l10 ?? null,
  }),

  avg_shots_on_target_for_l10: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_for_l10 ?? null,
    away: preMatch.away_avg_shots_on_target_for_l10 ?? null,
  }),

  avg_shots_on_target_against_l10: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_against_l10 ?? null,
    away: preMatch.away_avg_shots_on_target_against_l10 ?? null,
  }),

  over_15_shots_pct_l10: (preMatch) => ({
    home: preMatch.home_over_15_shots_pct_l10 ?? null,
    away: preMatch.away_over_15_shots_pct_l10 ?? null,
  }),

  over_5_shots_on_target_pct_l10: (preMatch) => ({
    home: preMatch.home_over_5_shots_on_target_pct_l10 ?? null,
    away: preMatch.away_over_5_shots_on_target_pct_l10 ?? null,
  }),

  avg_shots_off_target_l10: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_l10 ?? null,
    away: preMatch.away_avg_shots_off_target_l10 ?? null,
  }),

  avg_shots_off_target_for_l10: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_for_l10 ?? null,
    away: preMatch.away_avg_shots_off_target_for_l10 ?? null,
  }),

  avg_shots_off_target_against_l10: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_against_l10 ?? null,
    away: preMatch.away_avg_shots_off_target_against_l10 ?? null,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 10 - LAST 10 MATCHES HOME/AWAY VARIANTS
  // ═══════════════════════════════════════════════════════════════════════════

  // L10 Home
  avg_match_goals_l10h: (preMatch) => ({
    home: preMatch.home_avg_match_goals_l10h ?? null,
    away: preMatch.away_avg_match_goals_l10h ?? null,
  }),

  avg_goals_scored_l10h: (preMatch) => ({
    home: preMatch.home_avg_goals_scored_l10h ?? null,
    away: preMatch.away_avg_goals_scored_l10h ?? null,
  }),

  avg_goals_conceded_l10h: (preMatch) => ({
    home: preMatch.home_avg_goals_conceded_l10h ?? null,
    away: preMatch.away_avg_goals_conceded_l10h ?? null,
  }),

  win_pct_l10h: (preMatch) => ({
    home: preMatch.home_win_pct_l10h ?? null,
    away: preMatch.away_win_pct_l10h ?? null,
  }),

  draw_pct_l10h: (preMatch) => ({
    home: preMatch.home_draw_pct_l10h ?? null,
    away: preMatch.away_draw_pct_l10h ?? null,
  }),

  loss_pct_l10h: (preMatch) => ({
    home: preMatch.home_loss_pct_l10h ?? null,
    away: preMatch.away_loss_pct_l10h ?? null,
  }),

  btts_pct_l10h: (preMatch) => ({
    home: preMatch.home_btts_pct_l10h ?? null,
    away: preMatch.away_btts_pct_l10h ?? null,
  }),

  clean_sheet_pct_l10h: (preMatch) => ({
    home: preMatch.home_clean_sheet_pct_l10h ?? null,
    away: preMatch.away_clean_sheet_pct_l10h ?? null,
  }),

  failed_to_score_pct_l10h: (preMatch) => ({
    home: preMatch.home_failed_to_score_pct_l10h ?? null,
    away: preMatch.away_failed_to_score_pct_l10h ?? null,
  }),

  over_0_5_match_goals_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_0_5_match_goals_pct_l10h ?? null,
    away: preMatch.away_over_0_5_match_goals_pct_l10h ?? null,
  }),

  over_1_5_match_goals_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_1_5_match_goals_pct_l10h ?? null,
    away: preMatch.away_over_1_5_match_goals_pct_l10h ?? null,
  }),

  over_2_5_match_goals_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_2_5_match_goals_pct_l10h ?? null,
    away: preMatch.away_over_2_5_match_goals_pct_l10h ?? null,
  }),

  over_3_5_match_goals_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_3_5_match_goals_pct_l10h ?? null,
    away: preMatch.away_over_3_5_match_goals_pct_l10h ?? null,
  }),

  over_4_5_match_goals_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_4_5_match_goals_pct_l10h ?? null,
    away: preMatch.away_over_4_5_match_goals_pct_l10h ?? null,
  }),

  over_0_5_goals_scored_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_0_5_goals_scored_pct_l10h ?? null,
    away: preMatch.away_over_0_5_goals_scored_pct_l10h ?? null,
  }),

  over_1_5_goals_scored_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_1_5_goals_scored_pct_l10h ?? null,
    away: preMatch.away_over_1_5_goals_scored_pct_l10h ?? null,
  }),

  over_2_5_goals_scored_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_2_5_goals_scored_pct_l10h ?? null,
    away: preMatch.away_over_2_5_goals_scored_pct_l10h ?? null,
  }),

  over_3_5_goals_scored_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_3_5_goals_scored_pct_l10h ?? null,
    away: preMatch.away_over_3_5_goals_scored_pct_l10h ?? null,
  }),

  over_4_5_goals_scored_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_4_5_goals_scored_pct_l10h ?? null,
    away: preMatch.away_over_4_5_goals_scored_pct_l10h ?? null,
  }),

  over_0_5_goals_conceded_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_0_5_goals_conceded_pct_l10h ?? null,
    away: preMatch.away_over_0_5_goals_conceded_pct_l10h ?? null,
  }),

  over_1_5_goals_conceded_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_1_5_goals_conceded_pct_l10h ?? null,
    away: preMatch.away_over_1_5_goals_conceded_pct_l10h ?? null,
  }),

  over_2_5_goals_conceded_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_2_5_goals_conceded_pct_l10h ?? null,
    away: preMatch.away_over_2_5_goals_conceded_pct_l10h ?? null,
  }),

  over_3_5_goals_conceded_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_3_5_goals_conceded_pct_l10h ?? null,
    away: preMatch.away_over_3_5_goals_conceded_pct_l10h ?? null,
  }),

  over_4_5_goals_conceded_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_4_5_goals_conceded_pct_l10h ?? null,
    away: preMatch.away_over_4_5_goals_conceded_pct_l10h ?? null,
  }),

  avg_corners_l10h: (preMatch) => ({
    home: preMatch.home_avg_corners_l10h ?? null,
    away: preMatch.away_avg_corners_l10h ?? null,
  }),

  avg_corners_for_l10h: (preMatch) => ({
    home: preMatch.home_avg_corners_for_l10h ?? null,
    away: preMatch.away_avg_corners_for_l10h ?? null,
  }),

  avg_corners_against_l10h: (preMatch) => ({
    home: preMatch.home_avg_corners_against_l10h ?? null,
    away: preMatch.away_avg_corners_against_l10h ?? null,
  }),

  avg_shots_on_target_l10h: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_l10h ?? null,
    away: preMatch.away_avg_shots_on_target_l10h ?? null,
  }),

  avg_shots_on_target_for_l10h: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_for_l10h ?? null,
    away: preMatch.away_avg_shots_on_target_for_l10h ?? null,
  }),

  avg_shots_on_target_against_l10h: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_against_l10h ?? null,
    away: preMatch.away_avg_shots_on_target_against_l10h ?? null,
  }),

  avg_shots_off_target_l10h: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_l10h ?? null,
    away: preMatch.away_avg_shots_off_target_l10h ?? null,
  }),

  avg_shots_off_target_for_l10h: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_for_l10h ?? null,
    away: preMatch.away_avg_shots_off_target_for_l10h ?? null,
  }),

  avg_shots_off_target_against_l10h: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_against_l10h ?? null,
    away: preMatch.away_avg_shots_off_target_against_l10h ?? null,
  }),

  // L10 Away
  avg_match_goals_l10a: (preMatch) => ({
    home: preMatch.home_avg_match_goals_l10a ?? null,
    away: preMatch.away_avg_match_goals_l10a ?? null,
  }),

  avg_goals_scored_l10a: (preMatch) => ({
    home: preMatch.home_avg_goals_scored_l10a ?? null,
    away: preMatch.away_avg_goals_scored_l10a ?? null,
  }),

  avg_goals_conceded_l10a: (preMatch) => ({
    home: preMatch.home_avg_goals_conceded_l10a ?? null,
    away: preMatch.away_avg_goals_conceded_l10a ?? null,
  }),

  win_pct_l10a: (preMatch) => ({
    home: preMatch.home_win_pct_l10a ?? null,
    away: preMatch.away_win_pct_l10a ?? null,
  }),

  draw_pct_l10a: (preMatch) => ({
    home: preMatch.home_draw_pct_l10a ?? null,
    away: preMatch.away_draw_pct_l10a ?? null,
  }),

  loss_pct_l10a: (preMatch) => ({
    home: preMatch.home_loss_pct_l10a ?? null,
    away: preMatch.away_loss_pct_l10a ?? null,
  }),

  btts_pct_l10a: (preMatch) => ({
    home: preMatch.home_btts_pct_l10a ?? null,
    away: preMatch.away_btts_pct_l10a ?? null,
  }),

  clean_sheet_pct_l10a: (preMatch) => ({
    home: preMatch.home_clean_sheet_pct_l10a ?? null,
    away: preMatch.away_clean_sheet_pct_l10a ?? null,
  }),

  failed_to_score_pct_l10a: (preMatch) => ({
    home: preMatch.home_failed_to_score_pct_l10a ?? null,
    away: preMatch.away_failed_to_score_pct_l10a ?? null,
  }),

  over_0_5_match_goals_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_0_5_match_goals_pct_l10a ?? null,
    away: preMatch.away_over_0_5_match_goals_pct_l10a ?? null,
  }),

  over_1_5_match_goals_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_1_5_match_goals_pct_l10a ?? null,
    away: preMatch.away_over_1_5_match_goals_pct_l10a ?? null,
  }),

  over_2_5_match_goals_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_2_5_match_goals_pct_l10a ?? null,
    away: preMatch.away_over_2_5_match_goals_pct_l10a ?? null,
  }),

  over_3_5_match_goals_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_3_5_match_goals_pct_l10a ?? null,
    away: preMatch.away_over_3_5_match_goals_pct_l10a ?? null,
  }),

  over_4_5_match_goals_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_4_5_match_goals_pct_l10a ?? null,
    away: preMatch.away_over_4_5_match_goals_pct_l10a ?? null,
  }),

  over_0_5_goals_scored_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_0_5_goals_scored_pct_l10a ?? null,
    away: preMatch.away_over_0_5_goals_scored_pct_l10a ?? null,
  }),

  over_1_5_goals_scored_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_1_5_goals_scored_pct_l10a ?? null,
    away: preMatch.away_over_1_5_goals_scored_pct_l10a ?? null,
  }),

  over_2_5_goals_scored_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_2_5_goals_scored_pct_l10a ?? null,
    away: preMatch.away_over_2_5_goals_scored_pct_l10a ?? null,
  }),

  over_3_5_goals_scored_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_3_5_goals_scored_pct_l10a ?? null,
    away: preMatch.away_over_3_5_goals_scored_pct_l10a ?? null,
  }),

  over_4_5_goals_scored_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_4_5_goals_scored_pct_l10a ?? null,
    away: preMatch.away_over_4_5_goals_scored_pct_l10a ?? null,
  }),

  over_0_5_goals_conceded_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_0_5_goals_conceded_pct_l10a ?? null,
    away: preMatch.away_over_0_5_goals_conceded_pct_l10a ?? null,
  }),

  over_1_5_goals_conceded_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_1_5_goals_conceded_pct_l10a ?? null,
    away: preMatch.away_over_1_5_goals_conceded_pct_l10a ?? null,
  }),

  over_2_5_goals_conceded_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_2_5_goals_conceded_pct_l10a ?? null,
    away: preMatch.away_over_2_5_goals_conceded_pct_l10a ?? null,
  }),

  over_3_5_goals_conceded_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_3_5_goals_conceded_pct_l10a ?? null,
    away: preMatch.away_over_3_5_goals_conceded_pct_l10a ?? null,
  }),

  over_4_5_goals_conceded_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_4_5_goals_conceded_pct_l10a ?? null,
    away: preMatch.away_over_4_5_goals_conceded_pct_l10a ?? null,
  }),

  avg_corners_l10a: (preMatch) => ({
    home: preMatch.home_avg_corners_l10a ?? null,
    away: preMatch.away_avg_corners_l10a ?? null,
  }),

  avg_corners_for_l10a: (preMatch) => ({
    home: preMatch.home_avg_corners_for_l10a ?? null,
    away: preMatch.away_avg_corners_for_l10a ?? null,
  }),

  avg_corners_against_l10a: (preMatch) => ({
    home: preMatch.home_avg_corners_against_l10a ?? null,
    away: preMatch.away_avg_corners_against_l10a ?? null,
  }),

  avg_shots_on_target_l10a: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_l10a ?? null,
    away: preMatch.away_avg_shots_on_target_l10a ?? null,
  }),

  avg_shots_on_target_for_l10a: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_for_l10a ?? null,
    away: preMatch.away_avg_shots_on_target_for_l10a ?? null,
  }),

  avg_shots_on_target_against_l10a: (preMatch) => ({
    home: preMatch.home_avg_shots_on_target_against_l10a ?? null,
    away: preMatch.away_avg_shots_on_target_against_l10a ?? null,
  }),

  avg_shots_off_target_l10a: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_l10a ?? null,
    away: preMatch.away_avg_shots_off_target_l10a ?? null,
  }),

  avg_shots_off_target_for_l10a: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_for_l10a ?? null,
    away: preMatch.away_avg_shots_off_target_for_l10a ?? null,
  }),

  avg_shots_off_target_against_l10a: (preMatch) => ({
    home: preMatch.home_avg_shots_off_target_against_l10a ?? null,
    away: preMatch.away_avg_shots_off_target_against_l10a ?? null,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 11 - LAST 10 MATCHES 2H HOME/AWAY VARIANTS
  // ═══════════════════════════════════════════════════════════════════════════

  '2h_win_pct_l10h': (preMatch) => ({
    home: preMatch['home_2h_win_pct_l10h'] ?? null,
    away: preMatch['away_2h_win_pct_l10h'] ?? null,
  }),

  '2h_draw_pct_l10h': (preMatch) => ({
    home: preMatch['home_2h_draw_pct_l10h'] ?? null,
    away: preMatch['away_2h_draw_pct_l10h'] ?? null,
  }),

  '2h_loss_pct_l10h': (preMatch) => ({
    home: preMatch['home_2h_loss_pct_l10h'] ?? null,
    away: preMatch['away_2h_loss_pct_l10h'] ?? null,
  }),

  '2h_btts_pct_l10h': (preMatch) => ({
    home: preMatch['home_2h_btts_pct_l10h'] ?? null,
    away: preMatch['away_2h_btts_pct_l10h'] ?? null,
  }),

  '2h_win_pct_l10a': (preMatch) => ({
    home: preMatch['home_2h_win_pct_l10a'] ?? null,
    away: preMatch['away_2h_win_pct_l10a'] ?? null,
  }),

  '2h_draw_pct_l10a': (preMatch) => ({
    home: preMatch['home_2h_draw_pct_l10a'] ?? null,
    away: preMatch['away_2h_draw_pct_l10a'] ?? null,
  }),

  '2h_loss_pct_l10a': (preMatch) => ({
    home: preMatch['home_2h_loss_pct_l10a'] ?? null,
    away: preMatch['away_2h_loss_pct_l10a'] ?? null,
  }),

  '2h_btts_pct_l10a': (preMatch) => ({
    home: preMatch['home_2h_btts_pct_l10a'] ?? null,
    away: preMatch['away_2h_btts_pct_l10a'] ?? null,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 15 - L10 HOME/AWAY HALF-TIME & SECOND-HALF GOALS
  // ═══════════════════════════════════════════════════════════════════════════

  // L10 Home - Half Time
  avg_1h_goals_l10h: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_l10h ?? null,
    away: preMatch.away_avg_1h_goals_l10h ?? null,
  }),

  avg_1h_goals_scored_l10h: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_scored_l10h ?? null,
    away: preMatch.away_avg_1h_goals_scored_l10h ?? null,
  }),

  avg_1h_goals_conceded_l10h: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_conceded_l10h ?? null,
    away: preMatch.away_avg_1h_goals_conceded_l10h ?? null,
  }),

  ht_win_pct_l10h: (preMatch) => ({
    home: preMatch.home_ht_win_pct_l10h ?? null,
    away: preMatch.away_ht_win_pct_l10h ?? null,
  }),

  ht_draw_pct_l10h: (preMatch) => ({
    home: preMatch.home_ht_draw_pct_l10h ?? null,
    away: preMatch.away_ht_draw_pct_l10h ?? null,
  }),

  ht_loss_pct_l10h: (preMatch) => ({
    home: preMatch.home_ht_loss_pct_l10h ?? null,
    away: preMatch.away_ht_loss_pct_l10h ?? null,
  }),

  ht_btts_pct_l10h: (preMatch) => ({
    home: preMatch.home_ht_btts_pct_l10h ?? null,
    away: preMatch.away_ht_btts_pct_l10h ?? null,
  }),

  over_0_5_ht_goals_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_0_5_ht_goals_pct_l10h ?? null,
    away: preMatch.away_over_0_5_ht_goals_pct_l10h ?? null,
  }),

  over_1_5_ht_goals_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_1_5_ht_goals_pct_l10h ?? null,
    away: preMatch.away_over_1_5_ht_goals_pct_l10h ?? null,
  }),

  over_2_5_ht_goals_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_2_5_ht_goals_pct_l10h ?? null,
    away: preMatch.away_over_2_5_ht_goals_pct_l10h ?? null,
  }),

  over_3_5_ht_goals_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_3_5_ht_goals_pct_l10h ?? null,
    away: preMatch.away_over_3_5_ht_goals_pct_l10h ?? null,
  }),

  over_4_5_ht_goals_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_4_5_ht_goals_pct_l10h ?? null,
    away: preMatch.away_over_4_5_ht_goals_pct_l10h ?? null,
  }),

  // L10 Home - Second Half
  avg_2h_goals_l10h: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_l10h ?? null,
    away: preMatch.away_avg_2h_goals_l10h ?? null,
  }),

  avg_2h_goals_scored_l10h: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_scored_l10h ?? null,
    away: preMatch.away_avg_2h_goals_scored_l10h ?? null,
  }),

  avg_2h_goals_conceded_l10h: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_conceded_l10h ?? null,
    away: preMatch.away_avg_2h_goals_conceded_l10h ?? null,
  }),

  over_0_5_2h_goals_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_0_5_2h_goals_pct_l10h ?? null,
    away: preMatch.away_over_0_5_2h_goals_pct_l10h ?? null,
  }),

  over_1_5_2h_goals_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_1_5_2h_goals_pct_l10h ?? null,
    away: preMatch.away_over_1_5_2h_goals_pct_l10h ?? null,
  }),

  over_2_5_2h_goals_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_2_5_2h_goals_pct_l10h ?? null,
    away: preMatch.away_over_2_5_2h_goals_pct_l10h ?? null,
  }),

  over_3_5_2h_goals_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_3_5_2h_goals_pct_l10h ?? null,
    away: preMatch.away_over_3_5_2h_goals_pct_l10h ?? null,
  }),

  over_4_5_2h_goals_pct_l10h: (preMatch) => ({
    home: preMatch.home_over_4_5_2h_goals_pct_l10h ?? null,
    away: preMatch.away_over_4_5_2h_goals_pct_l10h ?? null,
  }),

  // L10 Away - Half Time
  avg_1h_goals_l10a: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_l10a ?? null,
    away: preMatch.away_avg_1h_goals_l10a ?? null,
  }),

  avg_1h_goals_scored_l10a: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_scored_l10a ?? null,
    away: preMatch.away_avg_1h_goals_scored_l10a ?? null,
  }),

  avg_1h_goals_conceded_l10a: (preMatch) => ({
    home: preMatch.home_avg_1h_goals_conceded_l10a ?? null,
    away: preMatch.away_avg_1h_goals_conceded_l10a ?? null,
  }),

  ht_win_pct_l10a: (preMatch) => ({
    home: preMatch.home_ht_win_pct_l10a ?? null,
    away: preMatch.away_ht_win_pct_l10a ?? null,
  }),

  ht_draw_pct_l10a: (preMatch) => ({
    home: preMatch.home_ht_draw_pct_l10a ?? null,
    away: preMatch.away_ht_draw_pct_l10a ?? null,
  }),

  ht_loss_pct_l10a: (preMatch) => ({
    home: preMatch.home_ht_loss_pct_l10a ?? null,
    away: preMatch.away_ht_loss_pct_l10a ?? null,
  }),

  ht_btts_pct_l10a: (preMatch) => ({
    home: preMatch.home_ht_btts_pct_l10a ?? null,
    away: preMatch.away_ht_btts_pct_l10a ?? null,
  }),

  over_0_5_ht_goals_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_0_5_ht_goals_pct_l10a ?? null,
    away: preMatch.away_over_0_5_ht_goals_pct_l10a ?? null,
  }),

  over_1_5_ht_goals_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_1_5_ht_goals_pct_l10a ?? null,
    away: preMatch.away_over_1_5_ht_goals_pct_l10a ?? null,
  }),

  over_2_5_ht_goals_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_2_5_ht_goals_pct_l10a ?? null,
    away: preMatch.away_over_2_5_ht_goals_pct_l10a ?? null,
  }),

  over_3_5_ht_goals_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_3_5_ht_goals_pct_l10a ?? null,
    away: preMatch.away_over_3_5_ht_goals_pct_l10a ?? null,
  }),

  over_4_5_ht_goals_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_4_5_ht_goals_pct_l10a ?? null,
    away: preMatch.away_over_4_5_ht_goals_pct_l10a ?? null,
  }),

  // L10 Away - Second Half
  avg_2h_goals_l10a: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_l10a ?? null,
    away: preMatch.away_avg_2h_goals_l10a ?? null,
  }),

  avg_2h_goals_scored_l10a: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_scored_l10a ?? null,
    away: preMatch.away_avg_2h_goals_scored_l10a ?? null,
  }),

  avg_2h_goals_conceded_l10a: (preMatch) => ({
    home: preMatch.home_avg_2h_goals_conceded_l10a ?? null,
    away: preMatch.away_avg_2h_goals_conceded_l10a ?? null,
  }),

  over_0_5_2h_goals_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_0_5_2h_goals_pct_l10a ?? null,
    away: preMatch.away_over_0_5_2h_goals_pct_l10a ?? null,
  }),

  over_1_5_2h_goals_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_1_5_2h_goals_pct_l10a ?? null,
    away: preMatch.away_over_1_5_2h_goals_pct_l10a ?? null,
  }),

  over_2_5_2h_goals_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_2_5_2h_goals_pct_l10a ?? null,
    away: preMatch.away_over_2_5_2h_goals_pct_l10a ?? null,
  }),

  over_3_5_2h_goals_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_3_5_2h_goals_pct_l10a ?? null,
    away: preMatch.away_over_3_5_2h_goals_pct_l10a ?? null,
  }),

  over_4_5_2h_goals_pct_l10a: (preMatch) => ({
    home: preMatch.home_over_4_5_2h_goals_pct_l10a ?? null,
    away: preMatch.away_over_4_5_2h_goals_pct_l10a ?? null,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 12 - CORNERS AVG_MATCH
  // ═══════════════════════════════════════════════════════════════════════════

  avg_match_corners_l5: (preMatch) => ({
    home: preMatch.home_avg_match_corners_l5 ?? null,
    away: preMatch.away_avg_match_corners_l5 ?? null,
  }),

  avg_match_corners_l5h: (preMatch) => ({
    home: preMatch.home_avg_match_corners_l5h ?? null,
    away: preMatch.away_avg_match_corners_l5h ?? null,
  }),

  avg_match_corners_l5a: (preMatch) => ({
    home: preMatch.home_avg_match_corners_l5a ?? null,
    away: preMatch.away_avg_match_corners_l5a ?? null,
  }),

  avg_match_corners_l10: (preMatch) => ({
    home: preMatch.home_avg_match_corners_l10 ?? null,
    away: preMatch.away_avg_match_corners_l10 ?? null,
  }),

  avg_match_corners_l10h: (preMatch) => ({
    home: preMatch.home_avg_match_corners_l10h ?? null,
    away: preMatch.away_avg_match_corners_l10h ?? null,
  }),

  avg_match_corners_l10a: (preMatch) => ({
    home: preMatch.home_avg_match_corners_l10a ?? null,
    away: preMatch.away_avg_match_corners_l10a ?? null,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 13 - HALF-TIME CORNERS (18 metrics)
  // Note: Currently return null - requires events API (type=CORNER, minute<=45)
  // ═══════════════════════════════════════════════════════════════════════════

  avg_1h_corners_l5: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_l5 ?? null,
    away: preMatch.away_avg_1h_corners_l5 ?? null,
  }),

  avg_1h_corners_for_l5: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_for_l5 ?? null,
    away: preMatch.away_avg_1h_corners_for_l5 ?? null,
  }),

  avg_1h_corners_against_l5: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_against_l5 ?? null,
    away: preMatch.away_avg_1h_corners_against_l5 ?? null,
  }),

  avg_1h_corners_l5h: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_l5h ?? null,
    away: preMatch.away_avg_1h_corners_l5h ?? null,
  }),

  avg_1h_corners_for_l5h: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_for_l5h ?? null,
    away: preMatch.away_avg_1h_corners_for_l5h ?? null,
  }),

  avg_1h_corners_against_l5h: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_against_l5h ?? null,
    away: preMatch.away_avg_1h_corners_against_l5h ?? null,
  }),

  avg_1h_corners_l5a: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_l5a ?? null,
    away: preMatch.away_avg_1h_corners_l5a ?? null,
  }),

  avg_1h_corners_for_l5a: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_for_l5a ?? null,
    away: preMatch.away_avg_1h_corners_for_l5a ?? null,
  }),

  avg_1h_corners_against_l5a: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_against_l5a ?? null,
    away: preMatch.away_avg_1h_corners_against_l5a ?? null,
  }),

  avg_1h_corners_l10: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_l10 ?? null,
    away: preMatch.away_avg_1h_corners_l10 ?? null,
  }),

  avg_1h_corners_for_l10: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_for_l10 ?? null,
    away: preMatch.away_avg_1h_corners_for_l10 ?? null,
  }),

  avg_1h_corners_against_l10: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_against_l10 ?? null,
    away: preMatch.away_avg_1h_corners_against_l10 ?? null,
  }),

  avg_1h_corners_l10h: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_l10h ?? null,
    away: preMatch.away_avg_1h_corners_l10h ?? null,
  }),

  avg_1h_corners_for_l10h: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_for_l10h ?? null,
    away: preMatch.away_avg_1h_corners_for_l10h ?? null,
  }),

  avg_1h_corners_against_l10h: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_against_l10h ?? null,
    away: preMatch.away_avg_1h_corners_against_l10h ?? null,
  }),

  avg_1h_corners_l10a: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_l10a ?? null,
    away: preMatch.away_avg_1h_corners_l10a ?? null,
  }),

  avg_1h_corners_for_l10a: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_for_l10a ?? null,
    away: preMatch.away_avg_1h_corners_for_l10a ?? null,
  }),

  avg_1h_corners_against_l10a: (preMatch) => ({
    home: preMatch.home_avg_1h_corners_against_l10a ?? null,
    away: preMatch.away_avg_1h_corners_against_l10a ?? null,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 14 - SECOND-HALF CORNERS (18 metrics)
  // Note: Currently return null - requires events API (type=CORNER, minute>45)
  // ═══════════════════════════════════════════════════════════════════════════

  avg_2h_corners_l5: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_l5 ?? null,
    away: preMatch.away_avg_2h_corners_l5 ?? null,
  }),

  avg_2h_corners_for_l5: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_for_l5 ?? null,
    away: preMatch.away_avg_2h_corners_for_l5 ?? null,
  }),

  avg_2h_corners_against_l5: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_against_l5 ?? null,
    away: preMatch.away_avg_2h_corners_against_l5 ?? null,
  }),

  avg_2h_corners_l5h: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_l5h ?? null,
    away: preMatch.away_avg_2h_corners_l5h ?? null,
  }),

  avg_2h_corners_for_l5h: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_for_l5h ?? null,
    away: preMatch.away_avg_2h_corners_for_l5h ?? null,
  }),

  avg_2h_corners_against_l5h: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_against_l5h ?? null,
    away: preMatch.away_avg_2h_corners_against_l5h ?? null,
  }),

  avg_2h_corners_l5a: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_l5a ?? null,
    away: preMatch.away_avg_2h_corners_l5a ?? null,
  }),

  avg_2h_corners_for_l5a: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_for_l5a ?? null,
    away: preMatch.away_avg_2h_corners_for_l5a ?? null,
  }),

  avg_2h_corners_against_l5a: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_against_l5a ?? null,
    away: preMatch.away_avg_2h_corners_against_l5a ?? null,
  }),

  avg_2h_corners_l10: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_l10 ?? null,
    away: preMatch.away_avg_2h_corners_l10 ?? null,
  }),

  avg_2h_corners_for_l10: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_for_l10 ?? null,
    away: preMatch.away_avg_2h_corners_for_l10 ?? null,
  }),

  avg_2h_corners_against_l10: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_against_l10 ?? null,
    away: preMatch.away_avg_2h_corners_against_l10 ?? null,
  }),

  avg_2h_corners_l10h: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_l10h ?? null,
    away: preMatch.away_avg_2h_corners_l10h ?? null,
  }),

  avg_2h_corners_for_l10h: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_for_l10h ?? null,
    away: preMatch.away_avg_2h_corners_for_l10h ?? null,
  }),

  avg_2h_corners_against_l10h: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_against_l10h ?? null,
    away: preMatch.away_avg_2h_corners_against_l10h ?? null,
  }),

  avg_2h_corners_l10a: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_l10a ?? null,
    away: preMatch.away_avg_2h_corners_l10a ?? null,
  }),

  avg_2h_corners_for_l10a: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_for_l10a ?? null,
    away: preMatch.away_avg_2h_corners_for_l10a ?? null,
  }),

  avg_2h_corners_against_l10a: (preMatch) => ({
    home: preMatch.home_avg_2h_corners_against_l10a ?? null,
    away: preMatch.away_avg_2h_corners_against_l10a ?? null,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 16 - HEAD-TO-HEAD (H2H) METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  avg_h2h_match_goals_l5: (preMatch) => ({
    home: preMatch.home_avg_h2h_match_goals_l5 ?? null,
    away: preMatch.away_avg_h2h_match_goals_l5 ?? null,
  }),

  avg_h2h_1h_goals_l5: (preMatch) => ({
    home: preMatch.home_avg_h2h_1h_goals_l5 ?? null,
    away: preMatch.away_avg_h2h_1h_goals_l5 ?? null,
  }),

  avg_h2h_2h_goals_l5: (preMatch) => ({
    home: preMatch.home_avg_h2h_2h_goals_l5 ?? null,
    away: preMatch.away_avg_h2h_2h_goals_l5 ?? null,
  }),

  avg_h2h_match_corners_l5: (preMatch) => ({
    home: preMatch.home_avg_h2h_match_corners_l5 ?? null,
    away: preMatch.away_avg_h2h_match_corners_l5 ?? null,
  }),

  avg_h2h_1h_corners_l5: (preMatch) => ({
    home: preMatch.home_avg_h2h_1h_corners_l5 ?? null,
    away: preMatch.away_avg_h2h_1h_corners_l5 ?? null,
  }),

  avg_h2h_2h_corners_l5: (preMatch) => ({
    home: preMatch.home_avg_h2h_2h_corners_l5 ?? null,
    away: preMatch.away_avg_h2h_2h_corners_l5 ?? null,
  }),

  avg_h2h_shots_on_target_l5: (preMatch) => ({
    home: preMatch.home_avg_h2h_shots_on_target_l5 ?? null,
    away: preMatch.away_avg_h2h_shots_on_target_l5 ?? null,
  }),

  avg_h2h_shots_off_target_l5: (preMatch) => ({
    home: preMatch.home_avg_h2h_shots_off_target_l5 ?? null,
    away: preMatch.away_avg_h2h_shots_off_target_l5 ?? null,
  }),

  h2h_btts_pct_l5: (preMatch) => ({
    home: preMatch.home_h2h_btts_pct_l5 ?? null,
    away: preMatch.away_h2h_btts_pct_l5 ?? null,
  }),

  h2h_over_0_5_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_h2h_over_0_5_goals_pct_l5 ?? null,
    away: preMatch.away_h2h_over_0_5_goals_pct_l5 ?? null,
  }),

  h2h_over_1_5_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_h2h_over_1_5_goals_pct_l5 ?? null,
    away: preMatch.away_h2h_over_1_5_goals_pct_l5 ?? null,
  }),

  h2h_over_2_5_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_h2h_over_2_5_goals_pct_l5 ?? null,
    away: preMatch.away_h2h_over_2_5_goals_pct_l5 ?? null,
  }),

  h2h_over_3_5_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_h2h_over_3_5_goals_pct_l5 ?? null,
    away: preMatch.away_h2h_over_3_5_goals_pct_l5 ?? null,
  }),

  h2h_over_4_5_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_h2h_over_4_5_goals_pct_l5 ?? null,
    away: preMatch.away_h2h_over_4_5_goals_pct_l5 ?? null,
  }),

  h2h_over_0_5_1h_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_h2h_over_0_5_1h_goals_pct_l5 ?? null,
    away: preMatch.away_h2h_over_0_5_1h_goals_pct_l5 ?? null,
  }),

  h2h_over_1_5_1h_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_h2h_over_1_5_1h_goals_pct_l5 ?? null,
    away: preMatch.away_h2h_over_1_5_1h_goals_pct_l5 ?? null,
  }),

  h2h_over_2_5_1h_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_h2h_over_2_5_1h_goals_pct_l5 ?? null,
    away: preMatch.away_h2h_over_2_5_1h_goals_pct_l5 ?? null,
  }),

  h2h_over_3_5_1h_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_h2h_over_3_5_1h_goals_pct_l5 ?? null,
    away: preMatch.away_h2h_over_3_5_1h_goals_pct_l5 ?? null,
  }),

  h2h_over_4_5_1h_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_h2h_over_4_5_1h_goals_pct_l5 ?? null,
    away: preMatch.away_h2h_over_4_5_1h_goals_pct_l5 ?? null,
  }),

  h2h_over_0_5_2h_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_h2h_over_0_5_2h_goals_pct_l5 ?? null,
    away: preMatch.away_h2h_over_0_5_2h_goals_pct_l5 ?? null,
  }),

  h2h_over_1_5_2h_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_h2h_over_1_5_2h_goals_pct_l5 ?? null,
    away: preMatch.away_h2h_over_1_5_2h_goals_pct_l5 ?? null,
  }),

  h2h_over_2_5_2h_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_h2h_over_2_5_2h_goals_pct_l5 ?? null,
    away: preMatch.away_h2h_over_2_5_2h_goals_pct_l5 ?? null,
  }),

  h2h_over_3_5_2h_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_h2h_over_3_5_2h_goals_pct_l5 ?? null,
    away: preMatch.away_h2h_over_3_5_2h_goals_pct_l5 ?? null,
  }),

  h2h_over_4_5_2h_goals_pct_l5: (preMatch) => ({
    home: preMatch.home_h2h_over_4_5_2h_goals_pct_l5 ?? null,
    away: preMatch.away_h2h_over_4_5_2h_goals_pct_l5 ?? null,
  }),
};

/**
 * Extracts a PRE_MATCH metric value from a match snapshot.
 * Uses the same team scope logic as IN_PLAY metrics.
 *
 * @param rule - The rule being evaluated
 * @param match - The match snapshot containing preMatch data
 * @returns The extracted metric value, or null if not available
 */
export function extractPreMatchMetric(rule: Rule, match: MatchSnapshot): number | null {
  const extractor = PRE_MATCH_METRIC_EXTRACTORS[rule.metric];

  if (!extractor) {
    console.warn(`[MetricsLogic] Unknown PRE_MATCH metric: ${rule.metric}`);
    return null;
  }

  const { home, away } = extractor(match.preMatch);

  // If no team scope, return null (PRE_MATCH metrics always need team scope)
  if (!rule.team_scope) {
    console.warn(`[MetricsLogic] PRE_MATCH metric ${rule.metric} requires team_scope`);
    return null;
  }

  return applyTeamScope(rule.team_scope, home, away, match);
}
