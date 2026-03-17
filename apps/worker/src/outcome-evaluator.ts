/**
 * Pure function — evaluates whether a desired outcome was achieved given the final match result.
 * Returns 'HIT', 'MISS', or null if the outcome cannot be evaluated (missing data).
 */

export interface MatchResult {
  // Full-time goals
  homeFinal: number;
  awayFinal: number;
  // Half-time goals
  homeHT: number;
  awayHT: number;
  // 2nd-half goals (derived: FT - HT)
  homeSH: number;
  awaySH: number;
  // Corners full-time (null if unavailable)
  cornersHome: number | null;
  cornersAway: number | null;
  // Corners 1st half (null if unavailable from API)
  cornersHomeHT: number | null;
  cornersAwayHT: number | null;
  // Cards full-time (yellow + red combined, null if unavailable)
  cardsHome: number | null;
  cardsAway: number | null;
  // Cards 1st half (null if unavailable)
  cardsHomeHT: number | null;
  cardsAwayHT: number | null;
  // Score snapshot at trigger time (for "Since Picked" outcomes)
  homeAtTrigger: number | null;
  awayAtTrigger: number | null;
  // Corners snapshot at trigger time (for "Since Picked" corner outcomes)
  cornersAtTrigger: number | null;
  /** Pre-match home win odds — used to determine favourite */
  homeOdds?: number;
  /** Pre-match away win odds — used to determine favourite */
  awayOdds?: number;
}

export function evaluateOutcome(
  outcome: string,
  r: MatchResult,
): 'HIT' | 'MISS' | null {
  const totalGoals = r.homeFinal + r.awayFinal;
  const totalGoalsHT = r.homeHT + r.awayHT;
  const totalGoalsSH = r.homeSH + r.awaySH;

  const btts = r.homeFinal > 0 && r.awayFinal > 0;
  const bttsHT = r.homeHT > 0 && r.awayHT > 0;
  const bttsSH = r.homeSH > 0 && r.awaySH > 0;

  // Corners
  const cornersHome = r.cornersHome ?? null;
  const cornersAway = r.cornersAway ?? null;
  const totalCorners =
    cornersHome !== null && cornersAway !== null
      ? cornersHome + cornersAway
      : null;
  const cornersHomeHT = r.cornersHomeHT ?? null;
  const cornersAwayHT = r.cornersAwayHT ?? null;
  const totalCornersHT =
    cornersHomeHT !== null && cornersAwayHT !== null
      ? cornersHomeHT + cornersAwayHT
      : null;
  const totalCornersSH =
    totalCorners !== null && totalCornersHT !== null
      ? totalCorners - totalCornersHT
      : null;

  // Cards
  const cardsHome = r.cardsHome ?? null;
  const cardsAway = r.cardsAway ?? null;
  const totalCards =
    cardsHome !== null && cardsAway !== null
      ? cardsHome + cardsAway
      : null;
  const cardsHomeHT = r.cardsHomeHT ?? null;
  const cardsAwayHT = r.cardsAwayHT ?? null;
  const totalCardsHT =
    cardsHomeHT !== null && cardsAwayHT !== null
      ? cardsHomeHT + cardsAwayHT
      : null;
  const totalCardsSH =
    totalCards !== null && totalCardsHT !== null
      ? totalCards - totalCardsHT
      : null;

  // Favourite / underdog resolution
  const favIsHome =
    r.homeOdds !== undefined && r.awayOdds !== undefined
      ? r.homeOdds <= r.awayOdds
      : null;
  const favFinal =
    favIsHome !== null
      ? favIsHome
        ? r.homeFinal
        : r.awayFinal
      : null;
  const undFinal =
    favIsHome !== null
      ? favIsHome
        ? r.awayFinal
        : r.homeFinal
      : null;
  const favHT =
    favIsHome !== null
      ? favIsHome
        ? r.homeHT
        : r.awayHT
      : null;
  const undHT =
    favIsHome !== null
      ? favIsHome
        ? r.awayHT
        : r.homeHT
      : null;
  // Goals since trigger (for "Since Picked" outcomes)
  const goalsSP =
    r.homeAtTrigger !== null && r.awayAtTrigger !== null
      ? totalGoals - (r.homeAtTrigger + r.awayAtTrigger)
      : null;
  const homeGoalsSP =
    r.homeAtTrigger !== null ? r.homeFinal - r.homeAtTrigger : null;
  const awayGoalsSP =
    r.awayAtTrigger !== null ? r.awayFinal - r.awayAtTrigger : null;
  const favGoalsSP =
    favIsHome !== null && homeGoalsSP !== null && awayGoalsSP !== null
      ? favIsHome
        ? homeGoalsSP
        : awayGoalsSP
      : null;
  const undGoalsSP =
    favIsHome !== null && homeGoalsSP !== null && awayGoalsSP !== null
      ? favIsHome
        ? awayGoalsSP
        : homeGoalsSP
      : null;
  const cornersSP =
    r.cornersAtTrigger !== null && totalCorners !== null
      ? totalCorners - r.cornersAtTrigger
      : null;

  // Helper
  const over = (v: number | null, threshold: number) =>
    v !== null ? (v > threshold ? 'HIT' : 'MISS') : null;
  const under = (v: number | null, threshold: number) =>
    v !== null ? (v < threshold ? 'HIT' : 'MISS') : null;

  switch (outcome) {
    // ── Match Result ──────────────────────────────────────────────────────────
    case 'HOME_WIN':
      return r.homeFinal > r.awayFinal ? 'HIT' : 'MISS';
    case 'DRAW':
      return r.homeFinal === r.awayFinal ? 'HIT' : 'MISS';
    case 'AWAY_WIN':
      return r.awayFinal > r.homeFinal ? 'HIT' : 'MISS';

    case 'HOME_WIN_HT':
      return r.homeHT > r.awayHT ? 'HIT' : 'MISS';
    case 'DRAW_HT':
      return r.homeHT === r.awayHT ? 'HIT' : 'MISS';
    case 'AWAY_WIN_HT':
      return r.awayHT > r.homeHT ? 'HIT' : 'MISS';

    case 'FAV_WIN':
      if (favFinal === null || undFinal === null) return null;
      return favFinal > undFinal ? 'HIT' : 'MISS';
    case 'UND_WIN':
      if (favFinal === null || undFinal === null) return null;
      return undFinal > favFinal ? 'HIT' : 'MISS';
    case 'FAV_WIN_HT':
      if (favHT === null || undHT === null) return null;
      return favHT > undHT ? 'HIT' : 'MISS';
    case 'UND_WIN_HT':
      if (favHT === null || undHT === null) return null;
      return undHT > favHT ? 'HIT' : 'MISS';

    case 'FAV_WIN_OR_DRAW':
      if (favFinal === null || undFinal === null) return null;
      return favFinal >= undFinal ? 'HIT' : 'MISS';
    case 'UND_WIN_OR_DRAW':
      if (favFinal === null || undFinal === null) return null;
      return undFinal >= favFinal ? 'HIT' : 'MISS';
    case 'FAV_WIN_OR_DRAW_HT':
      if (favHT === null || undHT === null) return null;
      return favHT >= undHT ? 'HIT' : 'MISS';
    case 'UND_WIN_OR_DRAW_HT':
      if (favHT === null || undHT === null) return null;
      return undHT >= favHT ? 'HIT' : 'MISS';

    case 'WINNING_TEAM_LOSE_OR_DRAW': {
      // The team that was leading at trigger time must NOT win at full time
      if (r.homeAtTrigger === null || r.awayAtTrigger === null) return null;
      if (r.homeAtTrigger === r.awayAtTrigger) return null; // no leading team at trigger time
      const homeWasLeading = r.homeAtTrigger > r.awayAtTrigger;
      if (homeWasLeading) {
        return r.homeFinal <= r.awayFinal ? 'HIT' : 'MISS';
      } else {
        return r.awayFinal <= r.homeFinal ? 'HIT' : 'MISS';
      }
    }
    case 'WINNING_TEAM_LOSE_OR_DRAW_HT': {
      // Same but evaluated at half-time result
      if (r.homeAtTrigger === null || r.awayAtTrigger === null) return null;
      if (r.homeAtTrigger === r.awayAtTrigger) return null;
      const homeWasLeading = r.homeAtTrigger > r.awayAtTrigger;
      if (homeWasLeading) {
        return r.homeHT <= r.awayHT ? 'HIT' : 'MISS';
      } else {
        return r.awayHT <= r.homeHT ? 'HIT' : 'MISS';
      }
    }

    // ── Double Chance ─────────────────────────────────────────────────────────
    case 'DOUBLE_CHANCE_12':
      return r.homeFinal !== r.awayFinal ? 'HIT' : 'MISS';
    case 'DOUBLE_CHANCE_1X':
      return r.homeFinal >= r.awayFinal ? 'HIT' : 'MISS';
    case 'DOUBLE_CHANCE_2X':
      return r.awayFinal >= r.homeFinal ? 'HIT' : 'MISS';

    // ── Win & BTTS ────────────────────────────────────────────────────────────
    case 'HOME_WIN_BTTS':
      return r.homeFinal > r.awayFinal && btts ? 'HIT' : 'MISS';
    case 'AWAY_WIN_BTTS':
      return r.awayFinal > r.homeFinal && btts ? 'HIT' : 'MISS';
    case 'DRAW_BTTS':
      return r.homeFinal === r.awayFinal && btts ? 'HIT' : 'MISS';

    // ── Both Teams to Score ───────────────────────────────────────────────────
    case 'BTTS_YES':
      return btts ? 'HIT' : 'MISS';
    case 'BTTS_NO':
      return !btts ? 'HIT' : 'MISS';
    case 'BTTS_1H_YES':
    case 'BTTS_YES_HT': // legacy alias
      return bttsHT ? 'HIT' : 'MISS';
    case 'BTTS_1H_NO':
    case 'BTTS_NO_HT': // legacy alias
      return !bttsHT ? 'HIT' : 'MISS';
    case 'BTTS_2H_YES':
      return bttsSH ? 'HIT' : 'MISS';
    case 'BTTS_2H_NO':
      return !bttsSH ? 'HIT' : 'MISS';

    // ── Draw variants ─────────────────────────────────────────────────────────
    case 'NO_DRAW':
      return r.homeFinal !== r.awayFinal ? 'HIT' : 'MISS';
    case 'DRAW_1H':
      return r.homeHT === r.awayHT ? 'HIT' : 'MISS';
    case 'NO_DRAW_1H':
      return r.homeHT !== r.awayHT ? 'HIT' : 'MISS';
    case 'DRAW_2H':
      return r.homeSH === r.awaySH ? 'HIT' : 'MISS';
    case 'NO_DRAW_2H':
      return r.homeSH !== r.awaySH ? 'HIT' : 'MISS';
    case 'DRAW_EITHER_HALF':
      return r.homeHT === r.awayHT || r.homeSH === r.awaySH ? 'HIT' : 'MISS';

    // ── Goals – Full Time ─────────────────────────────────────────────────────
    case 'ODD_GOALS':
      return totalGoals % 2 !== 0 ? 'HIT' : 'MISS';
    case 'EVEN_GOALS':
      return totalGoals % 2 === 0 ? 'HIT' : 'MISS';
    case 'GOALS_BOTH_HALVES':
      return totalGoalsHT > 0 && totalGoalsSH > 0 ? 'HIT' : 'MISS';

    case 'OVER_0_5_GOALS':
    case 'OVER_0_5': // legacy
      return over(totalGoals, 0.5);
    case 'OVER_1_5_GOALS':
    case 'OVER_1_5':
      return over(totalGoals, 1.5);
    case 'OVER_2_5_GOALS':
    case 'OVER_2_5':
      return over(totalGoals, 2.5);
    case 'OVER_3_5_GOALS':
    case 'OVER_3_5':
      return over(totalGoals, 3.5);
    case 'OVER_4_5_GOALS':
    case 'OVER_4_5':
      return over(totalGoals, 4.5);
    case 'OVER_5_5_GOALS':
    case 'OVER_5_5':
      return over(totalGoals, 5.5);
    case 'OVER_6_5_GOALS':
      return over(totalGoals, 6.5);

    case 'UNDER_0_5_GOALS':
    case 'UNDER_0_5':
      return under(totalGoals, 0.5);
    case 'UNDER_1_5_GOALS':
    case 'UNDER_1_5':
      return under(totalGoals, 1.5);
    case 'UNDER_2_5_GOALS':
    case 'UNDER_2_5':
      return under(totalGoals, 2.5);
    case 'UNDER_3_5_GOALS':
    case 'UNDER_3_5':
      return under(totalGoals, 3.5);
    case 'UNDER_4_5_GOALS':
    case 'UNDER_4_5':
      return under(totalGoals, 4.5);
    case 'UNDER_5_5_GOALS':
    case 'UNDER_5_5':
      return under(totalGoals, 5.5);
    case 'UNDER_6_5_GOALS':
      return under(totalGoals, 6.5);

    // ── Goals – 1st Half ──────────────────────────────────────────────────────
    case 'OVER_0_5_GOALS_1H':
    case 'OVER_0_5_HT':
      return over(totalGoalsHT, 0.5);
    case 'OVER_1_5_GOALS_1H':
    case 'OVER_1_5_HT':
      return over(totalGoalsHT, 1.5);
    case 'OVER_2_5_GOALS_1H':
    case 'OVER_2_5_HT':
      return over(totalGoalsHT, 2.5);
    case 'OVER_3_5_GOALS_1H':
      return over(totalGoalsHT, 3.5);

    case 'UNDER_0_5_GOALS_1H':
    case 'UNDER_0_5_HT':
      return under(totalGoalsHT, 0.5);
    case 'UNDER_1_5_GOALS_1H':
    case 'UNDER_1_5_HT':
      return under(totalGoalsHT, 1.5);
    case 'UNDER_2_5_GOALS_1H':
    case 'UNDER_2_5_HT':
      return under(totalGoalsHT, 2.5);
    case 'UNDER_3_5_GOALS_1H':
      return under(totalGoalsHT, 3.5);

    // ── Goals – 2nd Half ──────────────────────────────────────────────────────
    case 'OVER_0_5_GOALS_2H':
      return over(totalGoalsSH, 0.5);
    case 'OVER_1_5_GOALS_2H':
      return over(totalGoalsSH, 1.5);
    case 'OVER_2_5_GOALS_2H':
      return over(totalGoalsSH, 2.5);
    case 'OVER_3_5_GOALS_2H':
      return over(totalGoalsSH, 3.5);

    case 'UNDER_0_5_GOALS_2H':
      return under(totalGoalsSH, 0.5);
    case 'UNDER_1_5_GOALS_2H':
      return under(totalGoalsSH, 1.5);
    case 'UNDER_2_5_GOALS_2H':
      return under(totalGoalsSH, 2.5);
    case 'UNDER_3_5_GOALS_2H':
      return under(totalGoalsSH, 3.5);

    // ── Home Team Goals ───────────────────────────────────────────────────────
    case 'OVER_0_5_HOME_GOALS':
    case 'HOME_OVER_0_5':
      return over(r.homeFinal, 0.5);
    case 'OVER_1_5_HOME_GOALS':
    case 'HOME_OVER_1_5':
      return over(r.homeFinal, 1.5);
    case 'OVER_2_5_HOME_GOALS':
    case 'HOME_OVER_2_5':
      return over(r.homeFinal, 2.5);
    case 'OVER_3_5_HOME_GOALS':
      return over(r.homeFinal, 3.5);

    case 'UNDER_0_5_HOME_GOALS':
    case 'HOME_UNDER_0_5':
      return under(r.homeFinal, 0.5);
    case 'UNDER_1_5_HOME_GOALS':
    case 'HOME_UNDER_1_5':
      return under(r.homeFinal, 1.5);
    case 'UNDER_2_5_HOME_GOALS':
    case 'HOME_UNDER_2_5':
      return under(r.homeFinal, 2.5);

    // ── Home Team Goals – 1st Half ────────────────────────────────────────────
    case 'OVER_0_5_HOME_GOALS_1H':
      return over(r.homeHT, 0.5);
    case 'OVER_1_5_HOME_GOALS_1H':
      return over(r.homeHT, 1.5);
    case 'OVER_2_5_HOME_GOALS_1H':
      return over(r.homeHT, 2.5);
    case 'OVER_3_5_HOME_GOALS_1H':
      return over(r.homeHT, 3.5);

    // ── Home Team Goals – 2nd Half ────────────────────────────────────────────
    case 'OVER_0_5_HOME_GOALS_2H':
      return over(r.homeSH, 0.5);
    case 'OVER_1_5_HOME_GOALS_2H':
      return over(r.homeSH, 1.5);
    case 'OVER_2_5_HOME_GOALS_2H':
      return over(r.homeSH, 2.5);
    case 'OVER_3_5_HOME_GOALS_2H':
      return over(r.homeSH, 3.5);

    // ── Away Team Goals ───────────────────────────────────────────────────────
    case 'OVER_0_5_AWAY_GOALS':
    case 'AWAY_OVER_0_5':
      return over(r.awayFinal, 0.5);
    case 'OVER_1_5_AWAY_GOALS':
    case 'AWAY_OVER_1_5':
      return over(r.awayFinal, 1.5);
    case 'OVER_2_5_AWAY_GOALS':
    case 'AWAY_OVER_2_5':
      return over(r.awayFinal, 2.5);
    case 'OVER_3_5_AWAY_GOALS':
      return over(r.awayFinal, 3.5);

    case 'UNDER_0_5_AWAY_GOALS':
    case 'AWAY_UNDER_0_5':
      return under(r.awayFinal, 0.5);
    case 'UNDER_1_5_AWAY_GOALS':
    case 'AWAY_UNDER_1_5':
      return under(r.awayFinal, 1.5);
    case 'UNDER_2_5_AWAY_GOALS':
    case 'AWAY_UNDER_2_5':
      return under(r.awayFinal, 2.5);

    // ── Away Team Goals – 1st Half ────────────────────────────────────────────
    case 'OVER_0_5_AWAY_GOALS_1H':
      return over(r.awayHT, 0.5);
    case 'OVER_1_5_AWAY_GOALS_1H':
      return over(r.awayHT, 1.5);
    case 'OVER_2_5_AWAY_GOALS_1H':
      return over(r.awayHT, 2.5);
    case 'OVER_3_5_AWAY_GOALS_1H':
      return over(r.awayHT, 3.5);

    // ── Away Team Goals – 2nd Half ────────────────────────────────────────────
    case 'OVER_0_5_AWAY_GOALS_2H':
      return over(r.awaySH, 0.5);
    case 'OVER_1_5_AWAY_GOALS_2H':
      return over(r.awaySH, 1.5);
    case 'OVER_2_5_AWAY_GOALS_2H':
      return over(r.awaySH, 2.5);
    case 'OVER_3_5_AWAY_GOALS_2H':
      return over(r.awaySH, 3.5);

    // ── Favorite / Underdog Goals ─────────────────────────────────────────────
    case 'OVER_0_5_FAV_GOALS':
      if (favFinal === null) return null;
      return over(favFinal, 0.5);
    case 'OVER_1_5_FAV_GOALS':
      if (favFinal === null) return null;
      return over(favFinal, 1.5);
    case 'OVER_2_5_FAV_GOALS':
      if (favFinal === null) return null;
      return over(favFinal, 2.5);
    case 'OVER_3_5_FAV_GOALS':
      if (favFinal === null) return null;
      return over(favFinal, 3.5);
    case 'UNDER_0_5_FAV_GOALS':
      if (favFinal === null) return null;
      return under(favFinal, 0.5);
    case 'UNDER_1_5_FAV_GOALS':
      if (favFinal === null) return null;
      return under(favFinal, 1.5);
    case 'UNDER_2_5_FAV_GOALS':
      if (favFinal === null) return null;
      return under(favFinal, 2.5);
    case 'UNDER_3_5_FAV_GOALS':
      if (favFinal === null) return null;
      return under(favFinal, 3.5);

    case 'OVER_0_5_UND_GOALS':
      if (undFinal === null) return null;
      return over(undFinal, 0.5);
    case 'OVER_1_5_UND_GOALS':
      if (undFinal === null) return null;
      return over(undFinal, 1.5);
    case 'OVER_2_5_UND_GOALS':
      if (undFinal === null) return null;
      return over(undFinal, 2.5);
    case 'OVER_3_5_UND_GOALS':
      if (undFinal === null) return null;
      return over(undFinal, 3.5);
    case 'UNDER_0_5_UND_GOALS':
      if (undFinal === null) return null;
      return under(undFinal, 0.5);
    case 'UNDER_1_5_UND_GOALS':
      if (undFinal === null) return null;
      return under(undFinal, 1.5);
    case 'UNDER_2_5_UND_GOALS':
      if (undFinal === null) return null;
      return under(undFinal, 2.5);
    case 'UNDER_3_5_UND_GOALS':
      if (undFinal === null) return null;
      return under(undFinal, 3.5);

    // ── Goals – Since Picked ──────────────────────────────────────────────────
    case 'OVER_0_5_GOALS_SP':
      return over(goalsSP, 0.5);
    case 'OVER_0_5_HOME_GOALS_SP':
      return over(homeGoalsSP, 0.5);
    case 'OVER_0_5_AWAY_GOALS_SP':
      return over(awayGoalsSP, 0.5);
    case 'OVER_0_5_FAV_GOALS_SP':
      return over(favGoalsSP, 0.5);
    case 'OVER_0_5_UND_GOALS_SP':
      return over(undGoalsSP, 0.5);
    case 'OVER_1_5_GOALS_SP':
      return over(goalsSP, 1.5);
    case 'OVER_2_5_GOALS_SP':
      return over(goalsSP, 2.5);
    case 'OVER_3_5_GOALS_SP':
      return over(goalsSP, 3.5);
    case 'UNDER_0_5_GOALS_SP':
      return under(goalsSP, 0.5);
    case 'UNDER_1_5_GOALS_SP':
      return under(goalsSP, 1.5);
    case 'UNDER_2_5_GOALS_SP':
      return under(goalsSP, 2.5);
    case 'UNDER_3_5_GOALS_SP':
      return under(goalsSP, 3.5);

    // 1H Since Picked — only meaningful if alert fired in 1st half
    case 'OVER_0_5_GOALS_1H_SP':
      return over(goalsSP, 0.5); // same logic — all goals after trigger
    case 'OVER_1_5_GOALS_1H_SP':
      return over(goalsSP, 1.5);
    case 'OVER_2_5_GOALS_1H_SP':
      return over(goalsSP, 2.5);
    case 'UNDER_0_5_GOALS_1H_SP':
      return under(goalsSP, 0.5);
    case 'UNDER_1_5_GOALS_1H_SP':
      return under(goalsSP, 1.5);

    // ── Corners – Full Time ───────────────────────────────────────────────────
    case 'OVER_6_5_CORNERS':
      return over(totalCorners, 6.5);
    case 'OVER_7_5_CORNERS':
      return over(totalCorners, 7.5);
    case 'OVER_8_5_CORNERS':
      return over(totalCorners, 8.5);
    case 'OVER_9_5_CORNERS':
      return over(totalCorners, 9.5);
    case 'OVER_10_5_CORNERS':
      return over(totalCorners, 10.5);
    case 'OVER_11_5_CORNERS':
      return over(totalCorners, 11.5);
    case 'OVER_12_5_CORNERS':
      return over(totalCorners, 12.5);

    case 'UNDER_6_5_CORNERS':
      return under(totalCorners, 6.5);
    case 'UNDER_7_5_CORNERS':
      return under(totalCorners, 7.5);
    case 'UNDER_8_5_CORNERS':
      return under(totalCorners, 8.5);
    case 'UNDER_9_5_CORNERS':
      return under(totalCorners, 9.5);
    case 'UNDER_10_5_CORNERS':
      return under(totalCorners, 10.5);
    case 'UNDER_11_5_CORNERS':
      return under(totalCorners, 11.5);
    case 'UNDER_12_5_CORNERS':
      return under(totalCorners, 12.5);

    // ── Corners – 1st Half ────────────────────────────────────────────────────
    case 'OVER_0_5_CORNERS_1H':
      return over(totalCornersHT, 0.5);
    case 'OVER_1_5_CORNERS_1H':
      return over(totalCornersHT, 1.5);
    case 'OVER_2_5_CORNERS_1H':
      return over(totalCornersHT, 2.5);
    case 'OVER_3_5_CORNERS_1H':
      return over(totalCornersHT, 3.5);
    case 'OVER_4_5_CORNERS_1H':
      return over(totalCornersHT, 4.5);
    case 'OVER_5_5_CORNERS_1H':
      return over(totalCornersHT, 5.5);
    case 'OVER_6_5_CORNERS_1H':
      return over(totalCornersHT, 6.5);

    case 'UNDER_0_5_CORNERS_1H':
      return under(totalCornersHT, 0.5);
    case 'UNDER_1_5_CORNERS_1H':
      return under(totalCornersHT, 1.5);
    case 'UNDER_2_5_CORNERS_1H':
      return under(totalCornersHT, 2.5);
    case 'UNDER_3_5_CORNERS_1H':
      return under(totalCornersHT, 3.5);
    case 'UNDER_4_5_CORNERS_1H':
      return under(totalCornersHT, 4.5);
    case 'UNDER_5_5_CORNERS_1H':
      return under(totalCornersHT, 5.5);
    case 'UNDER_6_5_CORNERS_1H':
      return under(totalCornersHT, 6.5);

    // ── Corners – 2nd Half ────────────────────────────────────────────────────
    case 'OVER_0_5_CORNERS_2H':
      return over(totalCornersSH, 0.5);
    case 'OVER_1_5_CORNERS_2H':
      return over(totalCornersSH, 1.5);
    case 'OVER_2_5_CORNERS_2H':
      return over(totalCornersSH, 2.5);
    case 'OVER_3_5_CORNERS_2H':
      return over(totalCornersSH, 3.5);
    case 'OVER_4_5_CORNERS_2H':
      return over(totalCornersSH, 4.5);
    case 'OVER_5_5_CORNERS_2H':
      return over(totalCornersSH, 5.5);
    case 'OVER_6_5_CORNERS_2H':
      return over(totalCornersSH, 6.5);

    case 'UNDER_0_5_CORNERS_2H':
      return under(totalCornersSH, 0.5);
    case 'UNDER_1_5_CORNERS_2H':
      return under(totalCornersSH, 1.5);
    case 'UNDER_2_5_CORNERS_2H':
      return under(totalCornersSH, 2.5);
    case 'UNDER_3_5_CORNERS_2H':
      return under(totalCornersSH, 3.5);
    case 'UNDER_4_5_CORNERS_2H':
      return under(totalCornersSH, 4.5);
    case 'UNDER_5_5_CORNERS_2H':
      return under(totalCornersSH, 5.5);
    case 'UNDER_6_5_CORNERS_2H':
      return under(totalCornersSH, 6.5);

    // ── Corners – Since Picked ────────────────────────────────────────────────
    case 'OVER_0_5_CORNERS_SP':
      return over(cornersSP, 0.5);
    case 'OVER_0_5_CORNERS_1H_SP':
      return over(cornersSP, 0.5);
    case 'OVER_1_5_CORNERS_SP':
      return over(cornersSP, 1.5);
    case 'OVER_2_5_CORNERS_SP':
      return over(cornersSP, 2.5);
    case 'OVER_3_5_CORNERS_SP':
      return over(cornersSP, 3.5);
    case 'UNDER_0_5_CORNERS_SP':
      return under(cornersSP, 0.5);
    case 'UNDER_0_5_CORNERS_1H_SP':
      return under(cornersSP, 0.5);
    case 'UNDER_1_5_CORNERS_SP':
      return under(cornersSP, 1.5);
    case 'UNDER_2_5_CORNERS_SP':
      return under(cornersSP, 2.5);
    case 'UNDER_3_5_CORNERS_SP':
      return under(cornersSP, 3.5);

    // ── Cards – Full Time ─────────────────────────────────────────────────────
    case 'OVER_0_5_CARDS':
      return over(totalCards, 0.5);
    case 'OVER_1_5_CARDS':
      return over(totalCards, 1.5);
    case 'OVER_2_5_CARDS':
      return over(totalCards, 2.5);
    case 'OVER_3_5_CARDS':
      return over(totalCards, 3.5);
    case 'OVER_4_5_CARDS':
      return over(totalCards, 4.5);
    case 'OVER_5_5_CARDS':
      return over(totalCards, 5.5);
    case 'OVER_6_5_CARDS':
      return over(totalCards, 6.5);

    case 'UNDER_0_5_CARDS':
      return under(totalCards, 0.5);
    case 'UNDER_1_5_CARDS':
      return under(totalCards, 1.5);
    case 'UNDER_2_5_CARDS':
      return under(totalCards, 2.5);
    case 'UNDER_3_5_CARDS':
      return under(totalCards, 3.5);
    case 'UNDER_4_5_CARDS':
      return under(totalCards, 4.5);
    case 'UNDER_5_5_CARDS':
      return under(totalCards, 5.5);
    case 'UNDER_6_5_CARDS':
      return under(totalCards, 6.5);

    // ── Cards – 1st Half ──────────────────────────────────────────────────────
    case 'OVER_0_5_CARDS_1H':
      return over(totalCardsHT, 0.5);
    case 'OVER_1_5_CARDS_1H':
      return over(totalCardsHT, 1.5);
    case 'OVER_2_5_CARDS_1H':
      return over(totalCardsHT, 2.5);
    case 'OVER_3_5_CARDS_1H':
      return over(totalCardsHT, 3.5);
    case 'OVER_4_5_CARDS_1H':
      return over(totalCardsHT, 4.5);
    case 'OVER_5_5_CARDS_1H':
      return over(totalCardsHT, 5.5);
    case 'OVER_6_5_CARDS_1H':
      return over(totalCardsHT, 6.5);

    case 'UNDER_0_5_CARDS_1H':
      return under(totalCardsHT, 0.5);
    case 'UNDER_1_5_CARDS_1H':
      return under(totalCardsHT, 1.5);
    case 'UNDER_2_5_CARDS_1H':
      return under(totalCardsHT, 2.5);
    case 'UNDER_3_5_CARDS_1H':
      return under(totalCardsHT, 3.5);
    case 'UNDER_4_5_CARDS_1H':
      return under(totalCardsHT, 4.5);
    case 'UNDER_5_5_CARDS_1H':
      return under(totalCardsHT, 5.5);
    case 'UNDER_6_5_CARDS_1H':
      return under(totalCardsHT, 6.5);

    // ── Cards – 2nd Half ──────────────────────────────────────────────────────
    case 'OVER_0_5_CARDS_2H':
      return over(totalCardsSH, 0.5);
    case 'OVER_1_5_CARDS_2H':
      return over(totalCardsSH, 1.5);
    case 'OVER_2_5_CARDS_2H':
      return over(totalCardsSH, 2.5);
    case 'OVER_3_5_CARDS_2H':
      return over(totalCardsSH, 3.5);
    case 'OVER_4_5_CARDS_2H':
      return over(totalCardsSH, 4.5);
    case 'OVER_5_5_CARDS_2H':
      return over(totalCardsSH, 5.5);
    case 'OVER_6_5_CARDS_2H':
      return over(totalCardsSH, 6.5);

    case 'UNDER_0_5_CARDS_2H':
      return under(totalCardsSH, 0.5);
    case 'UNDER_1_5_CARDS_2H':
      return under(totalCardsSH, 1.5);
    case 'UNDER_2_5_CARDS_2H':
      return under(totalCardsSH, 2.5);
    case 'UNDER_3_5_CARDS_2H':
      return under(totalCardsSH, 3.5);
    case 'UNDER_4_5_CARDS_2H':
      return under(totalCardsSH, 4.5);
    case 'UNDER_5_5_CARDS_2H':
      return under(totalCardsSH, 5.5);
    case 'UNDER_6_5_CARDS_2H':
      return under(totalCardsSH, 6.5);

    // ── Combos ────────────────────────────────────────────────────────────────
    case 'OVER_2_5_GOALS_OR_BTTS':
      return totalGoals > 2.5 || btts ? 'HIT' : 'MISS';
    case 'OVER_2_5_GOALS_AND_BTTS':
      return totalGoals > 2.5 && btts ? 'HIT' : 'MISS';
    case 'FAV_WIN_HT_OR_OVER_1_5_GOALS_HT':
      if (favHT === null || undHT === null) return null;
      return favHT > undHT || totalGoalsHT > 1.5 ? 'HIT' : 'MISS';

    // ── Win By 1 ──────────────────────────────────────────────────────────────
    case 'HOME_WIN_BY_1':
      return r.homeFinal - r.awayFinal === 1 ? 'HIT' : 'MISS';
    case 'AWAY_WIN_BY_1':
      return r.awayFinal - r.homeFinal === 1 ? 'HIT' : 'MISS';
    case 'HOME_OR_AWAY_WIN_BY_1':
      return Math.abs(r.homeFinal - r.awayFinal) === 1 ? 'HIT' : 'MISS';
    case 'HOME_WIN_1H_BY_1':
      return r.homeHT - r.awayHT === 1 ? 'HIT' : 'MISS';
    case 'AWAY_WIN_1H_BY_1':
      return r.awayHT - r.homeHT === 1 ? 'HIT' : 'MISS';
    case 'HOME_OR_AWAY_WIN_1H_BY_1':
      return Math.abs(r.homeHT - r.awayHT) === 1 ? 'HIT' : 'MISS';

    // ── Half Comparison ───────────────────────────────────────────────────────
    case 'MOST_GOALS_1H':
      return totalGoalsHT > totalGoalsSH ? 'HIT' : 'MISS';
    case 'MOST_GOALS_2H':
      return totalGoalsSH > totalGoalsHT ? 'HIT' : 'MISS';
    case 'MOST_GOALS_TIE':
      return totalGoalsHT === totalGoalsSH ? 'HIT' : 'MISS';

    case 'MOST_CORNERS_1H':
      if (totalCornersHT === null || totalCornersSH === null) return null;
      return totalCornersHT > totalCornersSH ? 'HIT' : 'MISS';
    case 'MOST_CORNERS_2H':
      if (totalCornersHT === null || totalCornersSH === null) return null;
      return totalCornersSH > totalCornersHT ? 'HIT' : 'MISS';
    case 'MOST_CORNERS_TIE':
      if (totalCornersHT === null || totalCornersSH === null) return null;
      return totalCornersHT === totalCornersSH ? 'HIT' : 'MISS';

    case 'MOST_CARDS_1H':
      if (totalCardsHT === null || totalCardsSH === null) return null;
      return totalCardsHT > totalCardsSH ? 'HIT' : 'MISS';
    case 'MOST_CARDS_2H':
      if (totalCardsHT === null || totalCardsSH === null) return null;
      return totalCardsSH > totalCardsHT ? 'HIT' : 'MISS';
    case 'MOST_CARDS_TIE':
      if (totalCardsHT === null || totalCardsSH === null) return null;
      return totalCardsHT === totalCardsSH ? 'HIT' : 'MISS';

    default:
      console.warn(`[OutcomeEvaluator] Unknown outcome: "${outcome}"`);
      return null;
  }
}

