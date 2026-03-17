/**
 * Pure function — evaluates whether a desired outcome was achieved given the final match result.
 * Returns 'HIT', 'MISS', or null if the outcome cannot be evaluated (missing data).
 */

export interface MatchResult {
  homeFinal: number;
  awayFinal: number;
  homeHT: number;
  awayHT: number;
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
  const btts = r.homeFinal > 0 && r.awayFinal > 0;
  const bttsHT = r.homeHT > 0 && r.awayHT > 0;

  // Favourite / underdog resolution
  // Favourite = team with the lower pre-match odds (more likely to win)
  const favIsHome = r.homeOdds !== undefined && r.awayOdds !== undefined
    ? r.homeOdds <= r.awayOdds
    : null; // cannot determine without odds

  const favFinalScore = favIsHome !== null ? (favIsHome ? r.homeFinal : r.awayFinal) : null;
  const undFinalScore = favIsHome !== null ? (favIsHome ? r.awayFinal : r.homeFinal) : null;
  const favHTScore = favIsHome !== null ? (favIsHome ? r.homeHT : r.awayHT) : null;
  const undHTScore = favIsHome !== null ? (favIsHome ? r.awayHT : r.homeHT) : null;

  // Winning team at kick-off time (when the alert was triggered)
  // We use the live score snapshot stored in the trigger instead, but for resolution
  // we evaluate on the FINAL result only.

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
      if (favFinalScore === null || undFinalScore === null) return null;
      return favFinalScore > undFinalScore ? 'HIT' : 'MISS';
    case 'UND_WIN':
      if (favFinalScore === null || undFinalScore === null) return null;
      return undFinalScore > favFinalScore ? 'HIT' : 'MISS';
    case 'FAV_WIN_HT':
      if (favHTScore === null || undHTScore === null) return null;
      return favHTScore > undHTScore ? 'HIT' : 'MISS';
    case 'UND_WIN_HT':
      if (favHTScore === null || undHTScore === null) return null;
      return undHTScore > favHTScore ? 'HIT' : 'MISS';

    case 'FAV_WIN_OR_DRAW':
      if (favFinalScore === null || undFinalScore === null) return null;
      return favFinalScore >= undFinalScore ? 'HIT' : 'MISS';
    case 'UND_WIN_OR_DRAW':
      if (favFinalScore === null || undFinalScore === null) return null;
      return undFinalScore >= favFinalScore ? 'HIT' : 'MISS';
    case 'FAV_WIN_OR_DRAW_HT':
      if (favHTScore === null || undHTScore === null) return null;
      return favHTScore >= undHTScore ? 'HIT' : 'MISS';
    case 'UND_WIN_OR_DRAW_HT':
      if (favHTScore === null || undHTScore === null) return null;
      return undHTScore >= favHTScore ? 'HIT' : 'MISS';

    case 'WINNING_TEAM_LOSE_OR_DRAW':
      // The team that was winning at trigger time must not win at FT.
      // We can't know the "winning team at trigger time" from final score alone —
      // this requires the score snapshot from evidence_json. Return null to skip.
      return null;
    case 'WINNING_TEAM_LOSE_OR_DRAW_HT':
      return null;

    // ── Double Chance ─────────────────────────────────────────────────────────
    case 'DOUBLE_CHANCE_12':
      return r.homeFinal !== r.awayFinal ? 'HIT' : 'MISS'; // home win OR away win
    case 'DOUBLE_CHANCE_1X':
      return r.homeFinal >= r.awayFinal ? 'HIT' : 'MISS'; // home win OR draw
    case 'DOUBLE_CHANCE_2X':
      return r.awayFinal >= r.homeFinal ? 'HIT' : 'MISS'; // away win OR draw

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
    case 'BTTS_YES_HT':
      return bttsHT ? 'HIT' : 'MISS';
    case 'BTTS_NO_HT':
      return !bttsHT ? 'HIT' : 'MISS';

    // ── Over / Under Goals ────────────────────────────────────────────────────
    case 'OVER_0_5':  return totalGoals > 0.5  ? 'HIT' : 'MISS';
    case 'OVER_1_5':  return totalGoals > 1.5  ? 'HIT' : 'MISS';
    case 'OVER_2_5':  return totalGoals > 2.5  ? 'HIT' : 'MISS';
    case 'OVER_3_5':  return totalGoals > 3.5  ? 'HIT' : 'MISS';
    case 'OVER_4_5':  return totalGoals > 4.5  ? 'HIT' : 'MISS';
    case 'OVER_5_5':  return totalGoals > 5.5  ? 'HIT' : 'MISS';
    case 'UNDER_0_5': return totalGoals < 0.5  ? 'HIT' : 'MISS';
    case 'UNDER_1_5': return totalGoals < 1.5  ? 'HIT' : 'MISS';
    case 'UNDER_2_5': return totalGoals < 2.5  ? 'HIT' : 'MISS';
    case 'UNDER_3_5': return totalGoals < 3.5  ? 'HIT' : 'MISS';
    case 'UNDER_4_5': return totalGoals < 4.5  ? 'HIT' : 'MISS';
    case 'UNDER_5_5': return totalGoals < 5.5  ? 'HIT' : 'MISS';

    case 'OVER_0_5_HT':  return totalGoalsHT > 0.5  ? 'HIT' : 'MISS';
    case 'OVER_1_5_HT':  return totalGoalsHT > 1.5  ? 'HIT' : 'MISS';
    case 'OVER_2_5_HT':  return totalGoalsHT > 2.5  ? 'HIT' : 'MISS';
    case 'UNDER_0_5_HT': return totalGoalsHT < 0.5  ? 'HIT' : 'MISS';
    case 'UNDER_1_5_HT': return totalGoalsHT < 1.5  ? 'HIT' : 'MISS';
    case 'UNDER_2_5_HT': return totalGoalsHT < 2.5  ? 'HIT' : 'MISS';

    // ── Home Team Goals ───────────────────────────────────────────────────────
    case 'HOME_OVER_0_5':  return r.homeFinal > 0.5  ? 'HIT' : 'MISS';
    case 'HOME_OVER_1_5':  return r.homeFinal > 1.5  ? 'HIT' : 'MISS';
    case 'HOME_OVER_2_5':  return r.homeFinal > 2.5  ? 'HIT' : 'MISS';
    case 'HOME_UNDER_0_5': return r.homeFinal < 0.5  ? 'HIT' : 'MISS';
    case 'HOME_UNDER_1_5': return r.homeFinal < 1.5  ? 'HIT' : 'MISS';
    case 'HOME_UNDER_2_5': return r.homeFinal < 2.5  ? 'HIT' : 'MISS';

    // ── Away Team Goals ───────────────────────────────────────────────────────
    case 'AWAY_OVER_0_5':  return r.awayFinal > 0.5  ? 'HIT' : 'MISS';
    case 'AWAY_OVER_1_5':  return r.awayFinal > 1.5  ? 'HIT' : 'MISS';
    case 'AWAY_OVER_2_5':  return r.awayFinal > 2.5  ? 'HIT' : 'MISS';
    case 'AWAY_UNDER_0_5': return r.awayFinal < 0.5  ? 'HIT' : 'MISS';
    case 'AWAY_UNDER_1_5': return r.awayFinal < 1.5  ? 'HIT' : 'MISS';
    case 'AWAY_UNDER_2_5': return r.awayFinal < 2.5  ? 'HIT' : 'MISS';

    default:
      console.warn(`[OutcomeEvaluator] Unknown outcome: "${outcome}"`);
      return null;
  }
}
