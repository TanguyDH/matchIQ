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

  // ──────────────────────────────────────────────────────────────────────────
  // SCORE & BUTS
  // ──────────────────────────────────────────────────────────────────────────

  goals: (inPlay) => ({
    home: inPlay.home_goals ?? null,
    away: inPlay.away_goals ?? null,
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

  // ──────────────────────────────────────────────────────────────────────────
  // COUPS DE PIED ARRÊTÉS
  // ──────────────────────────────────────────────────────────────────────────

  corners: (inPlay) => ({
    home: inPlay.home_corners ?? null,
    away: inPlay.away_corners ?? null,
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
      // Équipe favorite = celle avec le score le plus élevé (ou égal)
      // Proxy simple: équipe avec score >= adversaire
      if (!bothAvailable) return null;
      return match.homeScore >= match.awayScore ? homeValue! : awayValue!;

    case 'UNDERDOG':
      // Équipe underdog = celle avec le score le plus bas
      if (!bothAvailable) return null;
      return match.homeScore < match.awayScore ? homeValue! : awayValue!;

    case 'FAVOURITE_HOME':
      // Favorite jouant à domicile
      // Si home est favorite (score >= away), retourne homeValue, sinon 0
      if (homeValue === null) return null;
      return match.homeScore >= match.awayScore ? homeValue : 0;

    case 'FAVOURITE_AWAY':
      // Favorite jouant à l'extérieur
      // Si away est favorite (score > home), retourne awayValue, sinon 0
      if (awayValue === null) return null;
      return match.awayScore > match.homeScore ? awayValue : 0;

    case 'UNDERDOG_HOME':
      // Underdog jouant à domicile
      // Si home est underdog (score < away), retourne homeValue, sinon 0
      if (homeValue === null) return null;
      return match.homeScore < match.awayScore ? homeValue : 0;

    case 'UNDERDOG_AWAY':
      // Underdog jouant à l'extérieur
      // Si away est underdog (score >= home), retourne awayValue, sinon 0
      if (awayValue === null) return null;
      return match.awayScore >= match.homeScore ? awayValue : 0;

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
