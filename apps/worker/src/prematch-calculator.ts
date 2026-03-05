/**
 * ════════════════════════════════════════════════════════════════════════════
 * PRE-MATCH METRICS CALCULATOR
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Calcule les métriques pré-match basées sur les 5 derniers matchs d'une équipe.
 *
 * Structure des fixtures:
 * - fixture.scores: array de { participant_id, score: { goals } }
 * - fixture.participants: array de { id, name }
 * - fixture.result_info: string décrivant le résultat
 *
 * Batch 1: 8 métriques essentielles
 * 1. avg_match_goals_l5 - Moyenne buts/match (total)
 * 2. avg_goals_scored_l5 - Moyenne buts marqués
 * 3. avg_goals_conceded_l5 - Moyenne buts encaissés
 * 4. win_pct_l5 - % victoires
 * 5. btts_pct_l5 - % Both Teams To Score
 * 6. clean_sheet_pct_l5 - % Clean sheets
 * 7. over_2_5_match_goals_pct_l5 - % matchs avec 2.5+ buts
 * 8. over_1_5_match_goals_pct_l5 - % matchs avec 1.5+ buts
 *
 * Batch 2: 5 métriques supplémentaires
 * 9. over_0_5_match_goals_pct_l5 - % matchs avec 0.5+ buts
 * 10. over_3_5_match_goals_pct_l5 - % matchs avec 3.5+ buts
 * 11. over_4_5_match_goals_pct_l5 - % matchs avec 4.5+ buts
 * 12. draw_pct_l5 - % matchs nuls
 * 13. loss_pct_l5 - % défaites
 */

/**
 * Résultat pour une seule équipe.
 */
interface TeamPreMatchMetrics {
  // Batch 1
  avg_match_goals_l5: number | null;
  avg_goals_scored_l5: number | null;
  avg_goals_conceded_l5: number | null;
  win_pct_l5: number | null;
  btts_pct_l5: number | null;
  clean_sheet_pct_l5: number | null;
  over_2_5_match_goals_pct_l5: number | null;
  over_1_5_match_goals_pct_l5: number | null;
  // Batch 2
  over_0_5_match_goals_pct_l5: number | null;
  over_3_5_match_goals_pct_l5: number | null;
  over_4_5_match_goals_pct_l5: number | null;
  draw_pct_l5: number | null;
  loss_pct_l5: number | null;
  // Batch 3 - Home variants (playing at home only)
  avg_match_goals_l5h: number | null;
  avg_goals_scored_l5h: number | null;
  avg_goals_conceded_l5h: number | null;
  win_pct_l5h: number | null;
  btts_pct_l5h: number | null;
  clean_sheet_pct_l5h: number | null;
  over_1_5_match_goals_pct_l5h: number | null;
  over_2_5_match_goals_pct_l5h: number | null;
  over_0_5_match_goals_pct_l5h: number | null;
  over_3_5_match_goals_pct_l5h: number | null;
  over_4_5_match_goals_pct_l5h: number | null;
  draw_pct_l5h: number | null;
  loss_pct_l5h: number | null;
  // Batch 3 - Away variants (playing away only)
  avg_match_goals_l5a: number | null;
  avg_goals_scored_l5a: number | null;
  avg_goals_conceded_l5a: number | null;
  win_pct_l5a: number | null;
  btts_pct_l5a: number | null;
  clean_sheet_pct_l5a: number | null;
  over_1_5_match_goals_pct_l5a: number | null;
  over_2_5_match_goals_pct_l5a: number | null;
  over_0_5_match_goals_pct_l5a: number | null;
  over_3_5_match_goals_pct_l5a: number | null;
  over_4_5_match_goals_pct_l5a: number | null;
  draw_pct_l5a: number | null;
  loss_pct_l5a: number | null;
  // Batch 4 - Half Time metrics
  avg_1h_goals_l5: number | null;
  avg_1h_goals_scored_l5: number | null;
  avg_1h_goals_conceded_l5: number | null;
  ht_win_pct_l5: number | null;
  ht_draw_pct_l5: number | null;
  ht_loss_pct_l5: number | null;
  ht_btts_pct_l5: number | null;
  over_0_5_ht_goals_pct_l5: number | null;
  over_1_5_ht_goals_pct_l5: number | null;
  over_2_5_ht_goals_pct_l5: number | null;
  over_3_5_ht_goals_pct_l5: number | null;
  over_4_5_ht_goals_pct_l5: number | null;
  // Batch 4 - Second Half metrics
  avg_2h_goals_l5: number | null;
  avg_2h_goals_scored_l5: number | null;
  avg_2h_goals_conceded_l5: number | null;
  '2h_win_pct_l5': number | null;
  '2h_draw_pct_l5': number | null;
  '2h_loss_pct_l5': number | null;
  '2h_btts_pct_l5': number | null;
  over_0_5_2h_goals_pct_l5: number | null;
  over_1_5_2h_goals_pct_l5: number | null;
  over_2_5_2h_goals_pct_l5: number | null;
  over_3_5_2h_goals_pct_l5: number | null;
  over_4_5_2h_goals_pct_l5: number | null;
  // Batch 4 - Half Time metrics (Home)
  avg_1h_goals_l5h: number | null;
  avg_1h_goals_scored_l5h: number | null;
  avg_1h_goals_conceded_l5h: number | null;
  ht_win_pct_l5h: number | null;
  ht_draw_pct_l5h: number | null;
  ht_loss_pct_l5h: number | null;
  ht_btts_pct_l5h: number | null;
  over_0_5_ht_goals_pct_l5h: number | null;
  over_1_5_ht_goals_pct_l5h: number | null;
  over_2_5_ht_goals_pct_l5h: number | null;
  over_3_5_ht_goals_pct_l5h: number | null;
  over_4_5_ht_goals_pct_l5h: number | null;
  // Batch 4 - Second Half metrics (Home)
  avg_2h_goals_l5h: number | null;
  avg_2h_goals_scored_l5h: number | null;
  avg_2h_goals_conceded_l5h: number | null;
  '2h_win_pct_l5h': number | null;
  '2h_draw_pct_l5h': number | null;
  '2h_loss_pct_l5h': number | null;
  '2h_btts_pct_l5h': number | null;
  over_0_5_2h_goals_pct_l5h: number | null;
  over_1_5_2h_goals_pct_l5h: number | null;
  over_2_5_2h_goals_pct_l5h: number | null;
  over_3_5_2h_goals_pct_l5h: number | null;
  over_4_5_2h_goals_pct_l5h: number | null;
  // Batch 4 - Half Time metrics (Away)
  avg_1h_goals_l5a: number | null;
  avg_1h_goals_scored_l5a: number | null;
  avg_1h_goals_conceded_l5a: number | null;
  ht_win_pct_l5a: number | null;
  ht_draw_pct_l5a: number | null;
  ht_loss_pct_l5a: number | null;
  ht_btts_pct_l5a: number | null;
  over_0_5_ht_goals_pct_l5a: number | null;
  over_1_5_ht_goals_pct_l5a: number | null;
  over_2_5_ht_goals_pct_l5a: number | null;
  over_3_5_ht_goals_pct_l5a: number | null;
  over_4_5_ht_goals_pct_l5a: number | null;
  // Batch 4 - Second Half metrics (Away)
  avg_2h_goals_l5a: number | null;
  avg_2h_goals_scored_l5a: number | null;
  avg_2h_goals_conceded_l5a: number | null;
  '2h_win_pct_l5a': number | null;
  '2h_draw_pct_l5a': number | null;
  '2h_loss_pct_l5a': number | null;
  '2h_btts_pct_l5a': number | null;
  over_0_5_2h_goals_pct_l5a: number | null;
  over_1_5_2h_goals_pct_l5a: number | null;
  over_2_5_2h_goals_pct_l5a: number | null;
  over_3_5_2h_goals_pct_l5a: number | null;
  over_4_5_2h_goals_pct_l5a: number | null;
  // Batch 5 - Goals Scored variants (all matches)
  over_0_5_goals_scored_pct_l5: number | null;
  over_1_5_goals_scored_pct_l5: number | null;
  over_2_5_goals_scored_pct_l5: number | null;
  over_3_5_goals_scored_pct_l5: number | null;
  over_4_5_goals_scored_pct_l5: number | null;
  failed_to_score_pct_l5: number | null;
  // Batch 5 - Goals Conceded variants (all matches)
  over_0_5_goals_conceded_pct_l5: number | null;
  over_1_5_goals_conceded_pct_l5: number | null;
  over_2_5_goals_conceded_pct_l5: number | null;
  over_3_5_goals_conceded_pct_l5: number | null;
  over_4_5_goals_conceded_pct_l5: number | null;
  // Batch 5 - Goals Scored variants (Home)
  over_0_5_goals_scored_pct_l5h: number | null;
  over_1_5_goals_scored_pct_l5h: number | null;
  over_2_5_goals_scored_pct_l5h: number | null;
  over_3_5_goals_scored_pct_l5h: number | null;
  over_4_5_goals_scored_pct_l5h: number | null;
  failed_to_score_pct_l5h: number | null;
  // Batch 5 - Goals Conceded variants (Home)
  over_0_5_goals_conceded_pct_l5h: number | null;
  over_1_5_goals_conceded_pct_l5h: number | null;
  over_2_5_goals_conceded_pct_l5h: number | null;
  over_3_5_goals_conceded_pct_l5h: number | null;
  over_4_5_goals_conceded_pct_l5h: number | null;
  // Batch 5 - Goals Scored variants (Away)
  over_0_5_goals_scored_pct_l5a: number | null;
  over_1_5_goals_scored_pct_l5a: number | null;
  over_2_5_goals_scored_pct_l5a: number | null;
  over_3_5_goals_scored_pct_l5a: number | null;
  over_4_5_goals_scored_pct_l5a: number | null;
  failed_to_score_pct_l5a: number | null;
  // Batch 5 - Goals Conceded variants (Away)
  over_0_5_goals_conceded_pct_l5a: number | null;
  over_1_5_goals_conceded_pct_l5a: number | null;
  over_2_5_goals_conceded_pct_l5a: number | null;
  over_3_5_goals_conceded_pct_l5a: number | null;
  over_4_5_goals_conceded_pct_l5a: number | null;
  // Batch 6 - Corners (all matches)
  avg_corners_l5: number | null;
  avg_corners_for_l5: number | null;
  avg_corners_against_l5: number | null;
  over_10_corners_pct_l5: number | null;
  // Batch 6 - Corners (Home)
  avg_corners_l5h: number | null;
  avg_corners_for_l5h: number | null;
  avg_corners_against_l5h: number | null;
  over_10_corners_pct_l5h: number | null;
  // Batch 6 - Corners (Away)
  avg_corners_l5a: number | null;
  avg_corners_for_l5a: number | null;
  avg_corners_against_l5a: number | null;
  over_10_corners_pct_l5a: number | null;
  // Batch 7 - Shots (all matches)
  avg_shots_l5: number | null;
  avg_shots_for_l5: number | null;
  avg_shots_against_l5: number | null;
  avg_shots_on_target_l5: number | null;
  avg_shots_on_target_for_l5: number | null;
  avg_shots_on_target_against_l5: number | null;
  over_15_shots_pct_l5: number | null;
  over_5_shots_on_target_pct_l5: number | null;
  // Batch 7 - Shots (Home)
  avg_shots_l5h: number | null;
  avg_shots_for_l5h: number | null;
  avg_shots_against_l5h: number | null;
  avg_shots_on_target_l5h: number | null;
  avg_shots_on_target_for_l5h: number | null;
  avg_shots_on_target_against_l5h: number | null;
  over_15_shots_pct_l5h: number | null;
  over_5_shots_on_target_pct_l5h: number | null;
  // Batch 7 - Shots (Away)
  avg_shots_l5a: number | null;
  avg_shots_for_l5a: number | null;
  avg_shots_against_l5a: number | null;
  avg_shots_on_target_l5a: number | null;
  avg_shots_on_target_for_l5a: number | null;
  avg_shots_on_target_against_l5a: number | null;
  over_15_shots_pct_l5a: number | null;
  over_5_shots_on_target_pct_l5a: number | null;
  // Batch 8 - Shots Off Target (all matches)
  avg_shots_off_target_l5: number | null;
  avg_shots_off_target_for_l5: number | null;
  avg_shots_off_target_against_l5: number | null;
  // Batch 8 - Shots Off Target (Home)
  avg_shots_off_target_l5h: number | null;
  avg_shots_off_target_for_l5h: number | null;
  avg_shots_off_target_against_l5h: number | null;
  // Batch 8 - Shots Off Target (Away)
  avg_shots_off_target_l5a: number | null;
  avg_shots_off_target_for_l5a: number | null;
  avg_shots_off_target_against_l5a: number | null;
  // Batch 9 - Last 10 Matches (base metrics, no home/away splits)
  avg_match_goals_l10: number | null;
  avg_goals_scored_l10: number | null;
  avg_goals_conceded_l10: number | null;
  win_pct_l10: number | null;
  draw_pct_l10: number | null;
  loss_pct_l10: number | null;
  btts_pct_l10: number | null;
  clean_sheet_pct_l10: number | null;
  failed_to_score_pct_l10: number | null;
  over_0_5_match_goals_pct_l10: number | null;
  over_1_5_match_goals_pct_l10: number | null;
  over_2_5_match_goals_pct_l10: number | null;
  over_3_5_match_goals_pct_l10: number | null;
  over_4_5_match_goals_pct_l10: number | null;
  // Half-time L10
  avg_1h_goals_l10: number | null;
  avg_1h_goals_scored_l10: number | null;
  avg_1h_goals_conceded_l10: number | null;
  ht_win_pct_l10: number | null;
  ht_draw_pct_l10: number | null;
  ht_loss_pct_l10: number | null;
  ht_btts_pct_l10: number | null;
  over_0_5_ht_goals_pct_l10: number | null;
  over_1_5_ht_goals_pct_l10: number | null;
  over_2_5_ht_goals_pct_l10: number | null;
  over_3_5_ht_goals_pct_l10: number | null;
  over_4_5_ht_goals_pct_l10: number | null;
  // Second-half L10
  avg_2h_goals_l10: number | null;
  avg_2h_goals_scored_l10: number | null;
  avg_2h_goals_conceded_l10: number | null;
  '2h_win_pct_l10': number | null;
  '2h_draw_pct_l10': number | null;
  '2h_loss_pct_l10': number | null;
  '2h_btts_pct_l10': number | null;
  over_0_5_2h_goals_pct_l10: number | null;
  over_1_5_2h_goals_pct_l10: number | null;
  over_2_5_2h_goals_pct_l10: number | null;
  over_3_5_2h_goals_pct_l10: number | null;
  over_4_5_2h_goals_pct_l10: number | null;
  // Goals scored/conceded L10
  over_0_5_goals_scored_pct_l10: number | null;
  over_1_5_goals_scored_pct_l10: number | null;
  over_2_5_goals_scored_pct_l10: number | null;
  over_3_5_goals_scored_pct_l10: number | null;
  over_4_5_goals_scored_pct_l10: number | null;
  over_0_5_goals_conceded_pct_l10: number | null;
  over_1_5_goals_conceded_pct_l10: number | null;
  over_2_5_goals_conceded_pct_l10: number | null;
  over_3_5_goals_conceded_pct_l10: number | null;
  over_4_5_goals_conceded_pct_l10: number | null;
  // Corners L10
  avg_corners_l10: number | null;
  avg_corners_for_l10: number | null;
  avg_corners_against_l10: number | null;
  over_10_corners_pct_l10: number | null;
  // Shots L10
  avg_shots_l10: number | null;
  avg_shots_for_l10: number | null;
  avg_shots_against_l10: number | null;
  avg_shots_on_target_l10: number | null;
  avg_shots_on_target_for_l10: number | null;
  avg_shots_on_target_against_l10: number | null;
  over_15_shots_pct_l10: number | null;
  over_5_shots_on_target_pct_l10: number | null;
  // Shots off target L10
  avg_shots_off_target_l10: number | null;
  avg_shots_off_target_for_l10: number | null;
  avg_shots_off_target_against_l10: number | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 10 - LAST 10 MATCHES HOME/AWAY VARIANTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Goals L10 Home
  avg_match_goals_l10h: number | null;
  avg_goals_scored_l10h: number | null;
  avg_goals_conceded_l10h: number | null;
  win_pct_l10h: number | null;
  draw_pct_l10h: number | null;
  loss_pct_l10h: number | null;
  btts_pct_l10h: number | null;
  clean_sheet_pct_l10h: number | null;
  failed_to_score_pct_l10h: number | null;
  over_0_5_match_goals_pct_l10h: number | null;
  over_1_5_match_goals_pct_l10h: number | null;
  over_2_5_match_goals_pct_l10h: number | null;
  over_3_5_match_goals_pct_l10h: number | null;
  over_4_5_match_goals_pct_l10h: number | null;
  over_0_5_goals_scored_pct_l10h: number | null;
  over_1_5_goals_scored_pct_l10h: number | null;
  over_2_5_goals_scored_pct_l10h: number | null;
  over_3_5_goals_scored_pct_l10h: number | null;
  over_4_5_goals_scored_pct_l10h: number | null;
  over_0_5_goals_conceded_pct_l10h: number | null;
  over_1_5_goals_conceded_pct_l10h: number | null;
  over_2_5_goals_conceded_pct_l10h: number | null;
  over_3_5_goals_conceded_pct_l10h: number | null;
  over_4_5_goals_conceded_pct_l10h: number | null;
  avg_corners_l10h: number | null;
  avg_corners_for_l10h: number | null;
  avg_corners_against_l10h: number | null;
  avg_shots_on_target_l10h: number | null;
  avg_shots_on_target_for_l10h: number | null;
  avg_shots_on_target_against_l10h: number | null;
  avg_shots_off_target_l10h: number | null;
  avg_shots_off_target_for_l10h: number | null;
  avg_shots_off_target_against_l10h: number | null;

  // Goals L10 Away
  avg_match_goals_l10a: number | null;
  avg_goals_scored_l10a: number | null;
  avg_goals_conceded_l10a: number | null;
  win_pct_l10a: number | null;
  draw_pct_l10a: number | null;
  loss_pct_l10a: number | null;
  btts_pct_l10a: number | null;
  clean_sheet_pct_l10a: number | null;
  failed_to_score_pct_l10a: number | null;
  over_0_5_match_goals_pct_l10a: number | null;
  over_1_5_match_goals_pct_l10a: number | null;
  over_2_5_match_goals_pct_l10a: number | null;
  over_3_5_match_goals_pct_l10a: number | null;
  over_4_5_match_goals_pct_l10a: number | null;
  over_0_5_goals_scored_pct_l10a: number | null;
  over_1_5_goals_scored_pct_l10a: number | null;
  over_2_5_goals_scored_pct_l10a: number | null;
  over_3_5_goals_scored_pct_l10a: number | null;
  over_4_5_goals_scored_pct_l10a: number | null;
  over_0_5_goals_conceded_pct_l10a: number | null;
  over_1_5_goals_conceded_pct_l10a: number | null;
  over_2_5_goals_conceded_pct_l10a: number | null;
  over_3_5_goals_conceded_pct_l10a: number | null;
  over_4_5_goals_conceded_pct_l10a: number | null;
  avg_corners_l10a: number | null;
  avg_corners_for_l10a: number | null;
  avg_corners_against_l10a: number | null;
  avg_shots_on_target_l10a: number | null;
  avg_shots_on_target_for_l10a: number | null;
  avg_shots_on_target_against_l10a: number | null;
  avg_shots_off_target_l10a: number | null;
  avg_shots_off_target_for_l10a: number | null;
  avg_shots_off_target_against_l10a: number | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 11 - LAST 10 MATCHES 2H HOME/AWAY VARIANTS
  // ═══════════════════════════════════════════════════════════════════════════

  '2h_win_pct_l10h': number | null;
  '2h_draw_pct_l10h': number | null;
  '2h_loss_pct_l10h': number | null;
  '2h_btts_pct_l10h': number | null;
  '2h_win_pct_l10a': number | null;
  '2h_draw_pct_l10a': number | null;
  '2h_loss_pct_l10a': number | null;
  '2h_btts_pct_l10a': number | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 15 - L10 HOME/AWAY HALF-TIME & SECOND-HALF GOALS
  // ═══════════════════════════════════════════════════════════════════════════

  // L10 Home - Half Time
  avg_1h_goals_l10h: number | null;
  avg_1h_goals_scored_l10h: number | null;
  avg_1h_goals_conceded_l10h: number | null;
  ht_win_pct_l10h: number | null;
  ht_draw_pct_l10h: number | null;
  ht_loss_pct_l10h: number | null;
  ht_btts_pct_l10h: number | null;
  over_0_5_ht_goals_pct_l10h: number | null;
  over_1_5_ht_goals_pct_l10h: number | null;
  over_2_5_ht_goals_pct_l10h: number | null;
  over_3_5_ht_goals_pct_l10h: number | null;
  over_4_5_ht_goals_pct_l10h: number | null;
  // L10 Home - Second Half
  avg_2h_goals_l10h: number | null;
  avg_2h_goals_scored_l10h: number | null;
  avg_2h_goals_conceded_l10h: number | null;
  over_0_5_2h_goals_pct_l10h: number | null;
  over_1_5_2h_goals_pct_l10h: number | null;
  over_2_5_2h_goals_pct_l10h: number | null;
  over_3_5_2h_goals_pct_l10h: number | null;
  over_4_5_2h_goals_pct_l10h: number | null;
  // L10 Away - Half Time
  avg_1h_goals_l10a: number | null;
  avg_1h_goals_scored_l10a: number | null;
  avg_1h_goals_conceded_l10a: number | null;
  ht_win_pct_l10a: number | null;
  ht_draw_pct_l10a: number | null;
  ht_loss_pct_l10a: number | null;
  ht_btts_pct_l10a: number | null;
  over_0_5_ht_goals_pct_l10a: number | null;
  over_1_5_ht_goals_pct_l10a: number | null;
  over_2_5_ht_goals_pct_l10a: number | null;
  over_3_5_ht_goals_pct_l10a: number | null;
  over_4_5_ht_goals_pct_l10a: number | null;
  // L10 Away - Second Half
  avg_2h_goals_l10a: number | null;
  avg_2h_goals_scored_l10a: number | null;
  avg_2h_goals_conceded_l10a: number | null;
  over_0_5_2h_goals_pct_l10a: number | null;
  over_1_5_2h_goals_pct_l10a: number | null;
  over_2_5_2h_goals_pct_l10a: number | null;
  over_3_5_2h_goals_pct_l10a: number | null;
  over_4_5_2h_goals_pct_l10a: number | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 12 - CORNERS AVG_MATCH
  // ═══════════════════════════════════════════════════════════════════════════

  avg_match_corners_l5: number | null;
  avg_match_corners_l5h: number | null;
  avg_match_corners_l5a: number | null;
  avg_match_corners_l10: number | null;
  avg_match_corners_l10h: number | null;
  avg_match_corners_l10a: number | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 13 - HALF-TIME CORNERS (18 core metrics)
  // ═══════════════════════════════════════════════════════════════════════════

  avg_1h_corners_l5: number | null;
  avg_1h_corners_for_l5: number | null;
  avg_1h_corners_against_l5: number | null;
  avg_1h_corners_l5h: number | null;
  avg_1h_corners_for_l5h: number | null;
  avg_1h_corners_against_l5h: number | null;
  avg_1h_corners_l5a: number | null;
  avg_1h_corners_for_l5a: number | null;
  avg_1h_corners_against_l5a: number | null;
  avg_1h_corners_l10: number | null;
  avg_1h_corners_for_l10: number | null;
  avg_1h_corners_against_l10: number | null;
  avg_1h_corners_l10h: number | null;
  avg_1h_corners_for_l10h: number | null;
  avg_1h_corners_against_l10h: number | null;
  avg_1h_corners_l10a: number | null;
  avg_1h_corners_for_l10a: number | null;
  avg_1h_corners_against_l10a: number | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 14 - SECOND-HALF CORNERS (18 core metrics)
  // ═══════════════════════════════════════════════════════════════════════════

  avg_2h_corners_l5: number | null;
  avg_2h_corners_for_l5: number | null;
  avg_2h_corners_against_l5: number | null;
  avg_2h_corners_l5h: number | null;
  avg_2h_corners_for_l5h: number | null;
  avg_2h_corners_against_l5h: number | null;
  avg_2h_corners_l5a: number | null;
  avg_2h_corners_for_l5a: number | null;
  avg_2h_corners_against_l5a: number | null;
  avg_2h_corners_l10: number | null;
  avg_2h_corners_for_l10: number | null;
  avg_2h_corners_against_l10: number | null;
  avg_2h_corners_l10h: number | null;
  avg_2h_corners_for_l10h: number | null;
  avg_2h_corners_against_l10h: number | null;
  avg_2h_corners_l10a: number | null;
  avg_2h_corners_for_l10a: number | null;
  avg_2h_corners_against_l10a: number | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 16 - HEAD-TO-HEAD (H2H) METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  avg_h2h_match_goals_l5: number | null;
  avg_h2h_1h_goals_l5: number | null;
  avg_h2h_2h_goals_l5: number | null;
  avg_h2h_match_corners_l5: number | null;
  avg_h2h_1h_corners_l5: number | null;
  avg_h2h_2h_corners_l5: number | null;
  avg_h2h_shots_on_target_l5: number | null;
  avg_h2h_shots_off_target_l5: number | null;
  h2h_btts_pct_l5: number | null;
  h2h_over_0_5_goals_pct_l5: number | null;
  h2h_over_1_5_goals_pct_l5: number | null;
  h2h_over_2_5_goals_pct_l5: number | null;
  h2h_over_3_5_goals_pct_l5: number | null;
  h2h_over_4_5_goals_pct_l5: number | null;
  h2h_over_0_5_1h_goals_pct_l5: number | null;
  h2h_over_1_5_1h_goals_pct_l5: number | null;
  h2h_over_2_5_1h_goals_pct_l5: number | null;
  h2h_over_3_5_1h_goals_pct_l5: number | null;
  h2h_over_4_5_1h_goals_pct_l5: number | null;
  h2h_over_0_5_2h_goals_pct_l5: number | null;
  h2h_over_1_5_2h_goals_pct_l5: number | null;
  h2h_over_2_5_2h_goals_pct_l5: number | null;
  h2h_over_3_5_2h_goals_pct_l5: number | null;
  h2h_over_4_5_2h_goals_pct_l5: number | null;
}

/**
 * Résultat complet pour home et away.
 */
export interface CalculatedPreMatch {
  home: TeamPreMatchMetrics;
  away: TeamPreMatchMetrics;
}

/**
 * Scores extraits d'un fixture (goals marqués et encaissés par notre équipe).
 */
interface MatchScores {
  // Full Time (match complet)
  goalsScored: number;
  goalsConceded: number;
  totalGoals: number;
  isWin: boolean;
  isDraw: boolean;
  isLoss: boolean;
  btts: boolean; // Both teams scored
  cleanSheet: boolean;
  location: 'home' | 'away'; // Was this team playing home or away?

  // Half Time (mi-temps)
  htGoalsScored: number;
  htGoalsConceded: number;
  htTotalGoals: number;
  htIsWin: boolean;
  htIsDraw: boolean;
  htIsLoss: boolean;
  htBtts: boolean;

  // Second Half (2ème mi-temps - calculé)
  secondHalfGoalsScored: number;
  secondHalfGoalsConceded: number;
  secondHalfTotalGoals: number;
  secondHalfIsWin: boolean;
  secondHalfIsDraw: boolean;
  secondHalfIsLoss: boolean;
  secondHalfBtts: boolean;

  // Corners (from statistics type_id 34)
  cornersFor: number;       // Team's corners
  cornersAgainst: number;   // Opponent's corners
  totalCorners: number;     // Total corners in match

  // 1H Corners (from events, minute <= 45)
  firstHalfCornersFor: number;
  firstHalfCornersAgainst: number;
  firstHalfTotalCorners: number;

  // 2H Corners (from events, minute > 45)
  secondHalfCornersFor: number;
  secondHalfCornersAgainst: number;
  secondHalfTotalCorners: number;

  // Shots (from statistics type_id 42=total, 86=on target, 41=off target)
  shotsFor: number;             // Team's total shots
  shotsAgainst: number;         // Opponent's total shots
  totalShots: number;           // Total shots in match
  shotsOnTargetFor: number;     // Team's shots on target
  shotsOnTargetAgainst: number; // Opponent's shots on target
  totalShotsOnTarget: number;   // Total shots on target in match
  shotsOffTargetFor: number;    // Team's shots off target
  shotsOffTargetAgainst: number; // Opponent's shots off target
  totalShotsOffTarget: number;  // Total shots off target in match
}

/**
 * Extrait les scores d'un fixture pour une équipe donnée.
 */
function extractScoresFromFixture(fixture: any, teamId: number): MatchScores | null {
  try {
    const scores = fixture.scores || [];
    const participants = fixture.participants || [];

    // Find our team's score and opponent's score (FULL TIME)
    const ourScore = scores.find((s: any) => s.participant_id === teamId && s.description === 'CURRENT');
    const opponentScore = scores.find((s: any) => s.participant_id !== teamId && s.description === 'CURRENT');

    if (!ourScore || !opponentScore) {
      console.warn(`[PreMatch] Missing CURRENT scores for fixture ${fixture.id}`);
      return null;
    }

    // Determine if our team was playing home or away
    const ourParticipant = participants.find((p: any) => p.id === teamId);
    const location = ourParticipant?.meta?.location || 'home';

    // ──────────────────────────────────────────────────────────────────────────
    // FULL TIME
    // ──────────────────────────────────────────────────────────────────────────
    const goalsScored = ourScore.score?.goals ?? 0;
    const goalsConceded = opponentScore.score?.goals ?? 0;
    const totalGoals = goalsScored + goalsConceded;

    // ──────────────────────────────────────────────────────────────────────────
    // HALF TIME
    // ──────────────────────────────────────────────────────────────────────────
    const ourHtScore = scores.find((s: any) => s.participant_id === teamId && s.description === 'HALFTIME');
    const opponentHtScore = scores.find((s: any) => s.participant_id !== teamId && s.description === 'HALFTIME');

    let htGoalsScored = 0;
    let htGoalsConceded = 0;
    let htTotalGoals = 0;

    if (ourHtScore && opponentHtScore) {
      htGoalsScored = ourHtScore.score?.goals ?? 0;
      htGoalsConceded = opponentHtScore.score?.goals ?? 0;
      htTotalGoals = htGoalsScored + htGoalsConceded;
    }

    const htIsWin = htGoalsScored > htGoalsConceded;
    const htIsDraw = htGoalsScored === htGoalsConceded;
    const htIsLoss = htGoalsScored < htGoalsConceded;
    const htBtts = htGoalsScored > 0 && htGoalsConceded > 0;

    // ──────────────────────────────────────────────────────────────────────────
    // SECOND HALF (2ème mi-temps = FT - HT)
    // ──────────────────────────────────────────────────────────────────────────
    const secondHalfGoalsScored = goalsScored - htGoalsScored;
    const secondHalfGoalsConceded = goalsConceded - htGoalsConceded;
    const secondHalfTotalGoals = secondHalfGoalsScored + secondHalfGoalsConceded;

    const secondHalfIsWin = secondHalfGoalsScored > secondHalfGoalsConceded;
    const secondHalfIsDraw = secondHalfGoalsScored === secondHalfGoalsConceded;
    const secondHalfIsLoss = secondHalfGoalsScored < secondHalfGoalsConceded;
    const secondHalfBtts = secondHalfGoalsScored > 0 && secondHalfGoalsConceded > 0;

    // ──────────────────────────────────────────────────────────────────────────
    // CORNERS (from statistics type_id 34)
    // ──────────────────────────────────────────────────────────────────────────
    const statistics = fixture.statistics || [];

    // Find corners for both teams (type_id 34)
    const ourCornersStat = statistics.find((s: any) => s.type_id === 34 && s.participant_id === teamId);
    const opponentCornersStat = statistics.find((s: any) => s.type_id === 34 && s.participant_id !== teamId);

    const cornersFor = ourCornersStat?.data?.value ?? 0;
    const cornersAgainst = opponentCornersStat?.data?.value ?? 0;
    const totalCorners = cornersFor + cornersAgainst;

    // ──────────────────────────────────────────────────────────────────────────
    // 1H / 2H CORNERS (from events - type_id 18 = corner in SportMonks)
    // Corner events have type_id 17 (corner) in some APIs, check both
    // ──────────────────────────────────────────────────────────────────────────
    const events = fixture.events || [];

    // SportMonks corner event type_id is typically 17
    // Filter corner events for our team and opponent
    const cornerEvents = events.filter((e: any) =>
      e.type_id === 17 || (e.type?.code && e.type.code.toLowerCase() === 'corner')
    );

    const ourCornersEvents = cornerEvents.filter((e: any) => e.participant_id === teamId);
    const opponentCornersEvents = cornerEvents.filter((e: any) => e.participant_id !== teamId && e.participant_id != null);

    // Split by period: minute <= 45 = 1H, minute > 45 = 2H
    const firstHalfCornersFor = ourCornersEvents.filter((e: any) => e.minute <= 45).length;
    const firstHalfCornersAgainst = opponentCornersEvents.filter((e: any) => e.minute <= 45).length;
    const firstHalfTotalCorners = firstHalfCornersFor + firstHalfCornersAgainst;

    const secondHalfCornersFor = ourCornersEvents.filter((e: any) => e.minute > 45).length;
    const secondHalfCornersAgainst = opponentCornersEvents.filter((e: any) => e.minute > 45).length;
    const secondHalfTotalCorners = secondHalfCornersFor + secondHalfCornersAgainst;

    // ──────────────────────────────────────────────────────────────────────────
    // SHOTS (from statistics type_id 42=total, 86=on target)
    // ──────────────────────────────────────────────────────────────────────────

    // Total shots (type_id 42)
    const ourShotsStat = statistics.find((s: any) => s.type_id === 42 && s.participant_id === teamId);
    const opponentShotsStat = statistics.find((s: any) => s.type_id === 42 && s.participant_id !== teamId);

    const shotsFor = ourShotsStat?.data?.value ?? 0;
    const shotsAgainst = opponentShotsStat?.data?.value ?? 0;
    const totalShots = shotsFor + shotsAgainst;

    // Shots on target (type_id 86)
    const ourShotsOnTargetStat = statistics.find((s: any) => s.type_id === 86 && s.participant_id === teamId);
    const opponentShotsOnTargetStat = statistics.find((s: any) => s.type_id === 86 && s.participant_id !== teamId);

    const shotsOnTargetFor = ourShotsOnTargetStat?.data?.value ?? 0;
    const shotsOnTargetAgainst = opponentShotsOnTargetStat?.data?.value ?? 0;
    const totalShotsOnTarget = shotsOnTargetFor + shotsOnTargetAgainst;

    // Shots off target (type_id 41)
    const ourShotsOffTargetStat = statistics.find((s: any) => s.type_id === 41 && s.participant_id === teamId);
    const opponentShotsOffTargetStat = statistics.find((s: any) => s.type_id === 41 && s.participant_id !== teamId);

    const shotsOffTargetFor = ourShotsOffTargetStat?.data?.value ?? 0;
    const shotsOffTargetAgainst = opponentShotsOffTargetStat?.data?.value ?? 0;
    const totalShotsOffTarget = shotsOffTargetFor + shotsOffTargetAgainst;

    return {
      // Full Time
      goalsScored,
      goalsConceded,
      totalGoals,
      isWin: goalsScored > goalsConceded,
      isDraw: goalsScored === goalsConceded,
      isLoss: goalsScored < goalsConceded,
      btts: goalsScored > 0 && goalsConceded > 0,
      cleanSheet: goalsConceded === 0,
      location,

      // Half Time
      htGoalsScored,
      htGoalsConceded,
      htTotalGoals,
      htIsWin,
      htIsDraw,
      htIsLoss,
      htBtts,

      // Second Half
      secondHalfGoalsScored,
      secondHalfGoalsConceded,
      secondHalfTotalGoals,
      secondHalfIsWin,
      secondHalfIsDraw,
      secondHalfIsLoss,
      secondHalfBtts,

      // Corners
      cornersFor,
      cornersAgainst,
      totalCorners,
      firstHalfCornersFor,
      firstHalfCornersAgainst,
      firstHalfTotalCorners,
      secondHalfCornersFor,
      secondHalfCornersAgainst,
      secondHalfTotalCorners,

      // Shots
      shotsFor,
      shotsAgainst,
      totalShots,
      shotsOnTargetFor,
      shotsOnTargetAgainst,
      totalShotsOnTarget,
      shotsOffTargetFor,
      shotsOffTargetAgainst,
      totalShotsOffTarget,
    };
  } catch (error) {
    console.warn(`[PreMatch] Error extracting scores from fixture ${fixture.id}:`, error);
    return null;
  }
}

/**
 * Calcule les métriques pré-match pour une équipe.
 */
function calculateTeamMetrics(fixtures: any[], teamId: number): TeamPreMatchMetrics {
  // Extract scores from all fixtures
  const matchScores = fixtures
    .map(f => extractScoresFromFixture(f, teamId))
    .filter((s): s is MatchScores => s !== null);

  const count = matchScores.length;

  console.log(`[PreMatch] Team ${teamId}: ${count} valid matches from ${fixtures.length} fixtures`);

  // Need at least 2 matches for meaningful statistics
  if (count < 2) {
    console.log(`[PreMatch] Team ${teamId}: Not enough matches (${count} < 2), returning null`);
    return {
      // Batch 1
      avg_match_goals_l5: null,
      avg_goals_scored_l5: null,
      avg_goals_conceded_l5: null,
      win_pct_l5: null,
      btts_pct_l5: null,
      clean_sheet_pct_l5: null,
      over_2_5_match_goals_pct_l5: null,
      over_1_5_match_goals_pct_l5: null,
      // Batch 2
      over_0_5_match_goals_pct_l5: null,
      over_3_5_match_goals_pct_l5: null,
      over_4_5_match_goals_pct_l5: null,
      draw_pct_l5: null,
      loss_pct_l5: null,
      // Batch 3 - Home variants
      avg_match_goals_l5h: null,
      avg_goals_scored_l5h: null,
      avg_goals_conceded_l5h: null,
      win_pct_l5h: null,
      btts_pct_l5h: null,
      clean_sheet_pct_l5h: null,
      over_1_5_match_goals_pct_l5h: null,
      over_2_5_match_goals_pct_l5h: null,
      over_0_5_match_goals_pct_l5h: null,
      over_3_5_match_goals_pct_l5h: null,
      over_4_5_match_goals_pct_l5h: null,
      draw_pct_l5h: null,
      loss_pct_l5h: null,
      // Batch 3 - Away variants
      avg_match_goals_l5a: null,
      avg_goals_scored_l5a: null,
      avg_goals_conceded_l5a: null,
      win_pct_l5a: null,
      btts_pct_l5a: null,
      clean_sheet_pct_l5a: null,
      over_1_5_match_goals_pct_l5a: null,
      over_2_5_match_goals_pct_l5a: null,
      over_0_5_match_goals_pct_l5a: null,
      over_3_5_match_goals_pct_l5a: null,
      over_4_5_match_goals_pct_l5a: null,
      draw_pct_l5a: null,
      loss_pct_l5a: null,
      // Batch 4 - Half Time
      avg_1h_goals_l5: null,
      avg_1h_goals_scored_l5: null,
      avg_1h_goals_conceded_l5: null,
      ht_win_pct_l5: null,
      ht_draw_pct_l5: null,
      ht_loss_pct_l5: null,
      ht_btts_pct_l5: null,
      over_0_5_ht_goals_pct_l5: null,
      over_1_5_ht_goals_pct_l5: null,
      over_2_5_ht_goals_pct_l5: null,
      over_3_5_ht_goals_pct_l5: null,
      over_4_5_ht_goals_pct_l5: null,
      // Batch 4 - Second Half
      avg_2h_goals_l5: null,
      avg_2h_goals_scored_l5: null,
      avg_2h_goals_conceded_l5: null,
      '2h_win_pct_l5': null,
      '2h_draw_pct_l5': null,
      '2h_loss_pct_l5': null,
      '2h_btts_pct_l5': null,
      over_0_5_2h_goals_pct_l5: null,
      over_1_5_2h_goals_pct_l5: null,
      over_2_5_2h_goals_pct_l5: null,
      over_3_5_2h_goals_pct_l5: null,
      over_4_5_2h_goals_pct_l5: null,
      // Batch 4 - Half Time (Home)
      avg_1h_goals_l5h: null,
      avg_1h_goals_scored_l5h: null,
      avg_1h_goals_conceded_l5h: null,
      ht_win_pct_l5h: null,
      ht_draw_pct_l5h: null,
      ht_loss_pct_l5h: null,
      ht_btts_pct_l5h: null,
      over_0_5_ht_goals_pct_l5h: null,
      over_1_5_ht_goals_pct_l5h: null,
      over_2_5_ht_goals_pct_l5h: null,
      over_3_5_ht_goals_pct_l5h: null,
      over_4_5_ht_goals_pct_l5h: null,
      // Batch 4 - Second Half (Home)
      avg_2h_goals_l5h: null,
      avg_2h_goals_scored_l5h: null,
      avg_2h_goals_conceded_l5h: null,
      '2h_win_pct_l5h': null,
      '2h_draw_pct_l5h': null,
      '2h_loss_pct_l5h': null,
      '2h_btts_pct_l5h': null,
      over_0_5_2h_goals_pct_l5h: null,
      over_1_5_2h_goals_pct_l5h: null,
      over_2_5_2h_goals_pct_l5h: null,
      over_3_5_2h_goals_pct_l5h: null,
      over_4_5_2h_goals_pct_l5h: null,
      // Batch 4 - Half Time (Away)
      avg_1h_goals_l5a: null,
      avg_1h_goals_scored_l5a: null,
      avg_1h_goals_conceded_l5a: null,
      ht_win_pct_l5a: null,
      ht_draw_pct_l5a: null,
      ht_loss_pct_l5a: null,
      ht_btts_pct_l5a: null,
      over_0_5_ht_goals_pct_l5a: null,
      over_1_5_ht_goals_pct_l5a: null,
      over_2_5_ht_goals_pct_l5a: null,
      over_3_5_ht_goals_pct_l5a: null,
      over_4_5_ht_goals_pct_l5a: null,
      // Batch 4 - Second Half (Away)
      avg_2h_goals_l5a: null,
      avg_2h_goals_scored_l5a: null,
      avg_2h_goals_conceded_l5a: null,
      '2h_win_pct_l5a': null,
      '2h_draw_pct_l5a': null,
      '2h_loss_pct_l5a': null,
      '2h_btts_pct_l5a': null,
      over_0_5_2h_goals_pct_l5a: null,
      over_1_5_2h_goals_pct_l5a: null,
      over_2_5_2h_goals_pct_l5a: null,
      over_3_5_2h_goals_pct_l5a: null,
      over_4_5_2h_goals_pct_l5a: null,
      // Batch 5 - Goals Scored
      over_0_5_goals_scored_pct_l5: null,
      over_1_5_goals_scored_pct_l5: null,
      over_2_5_goals_scored_pct_l5: null,
      over_3_5_goals_scored_pct_l5: null,
      over_4_5_goals_scored_pct_l5: null,
      failed_to_score_pct_l5: null,
      // Batch 5 - Goals Conceded
      over_0_5_goals_conceded_pct_l5: null,
      over_1_5_goals_conceded_pct_l5: null,
      over_2_5_goals_conceded_pct_l5: null,
      over_3_5_goals_conceded_pct_l5: null,
      over_4_5_goals_conceded_pct_l5: null,
      // Batch 5 - Goals Scored (Home)
      over_0_5_goals_scored_pct_l5h: null,
      over_1_5_goals_scored_pct_l5h: null,
      over_2_5_goals_scored_pct_l5h: null,
      over_3_5_goals_scored_pct_l5h: null,
      over_4_5_goals_scored_pct_l5h: null,
      failed_to_score_pct_l5h: null,
      // Batch 5 - Goals Conceded (Home)
      over_0_5_goals_conceded_pct_l5h: null,
      over_1_5_goals_conceded_pct_l5h: null,
      over_2_5_goals_conceded_pct_l5h: null,
      over_3_5_goals_conceded_pct_l5h: null,
      over_4_5_goals_conceded_pct_l5h: null,
      // Batch 5 - Goals Scored (Away)
      over_0_5_goals_scored_pct_l5a: null,
      over_1_5_goals_scored_pct_l5a: null,
      over_2_5_goals_scored_pct_l5a: null,
      over_3_5_goals_scored_pct_l5a: null,
      over_4_5_goals_scored_pct_l5a: null,
      failed_to_score_pct_l5a: null,
      // Batch 5 - Goals Conceded (Away)
      over_0_5_goals_conceded_pct_l5a: null,
      over_1_5_goals_conceded_pct_l5a: null,
      over_2_5_goals_conceded_pct_l5a: null,
      over_3_5_goals_conceded_pct_l5a: null,
      over_4_5_goals_conceded_pct_l5a: null,
      // Batch 6 - Corners
      avg_corners_l5: null,
      avg_corners_for_l5: null,
      avg_corners_against_l5: null,
      over_10_corners_pct_l5: null,
      avg_corners_l5h: null,
      avg_corners_for_l5h: null,
      avg_corners_against_l5h: null,
      over_10_corners_pct_l5h: null,
      avg_corners_l5a: null,
      avg_corners_for_l5a: null,
      avg_corners_against_l5a: null,
      over_10_corners_pct_l5a: null,
      // Batch 7 - Shots
      avg_shots_l5: null,
      avg_shots_for_l5: null,
      avg_shots_against_l5: null,
      avg_shots_on_target_l5: null,
      avg_shots_on_target_for_l5: null,
      avg_shots_on_target_against_l5: null,
      over_15_shots_pct_l5: null,
      over_5_shots_on_target_pct_l5: null,
      avg_shots_l5h: null,
      avg_shots_for_l5h: null,
      avg_shots_against_l5h: null,
      avg_shots_on_target_l5h: null,
      avg_shots_on_target_for_l5h: null,
      avg_shots_on_target_against_l5h: null,
      over_15_shots_pct_l5h: null,
      over_5_shots_on_target_pct_l5h: null,
      avg_shots_l5a: null,
      avg_shots_for_l5a: null,
      avg_shots_against_l5a: null,
      avg_shots_on_target_l5a: null,
      avg_shots_on_target_for_l5a: null,
      avg_shots_on_target_against_l5a: null,
      over_15_shots_pct_l5a: null,
      over_5_shots_on_target_pct_l5a: null,
      // Batch 8 - Shots Off Target
      avg_shots_off_target_l5: null,
      avg_shots_off_target_for_l5: null,
      avg_shots_off_target_against_l5: null,
      avg_shots_off_target_l5h: null,
      avg_shots_off_target_for_l5h: null,
      avg_shots_off_target_against_l5h: null,
      avg_shots_off_target_l5a: null,
      avg_shots_off_target_for_l5a: null,
      avg_shots_off_target_against_l5a: null,

      // Batch 9 - Last 10 Matches
      avg_match_goals_l10: null,
      avg_goals_scored_l10: null,
      avg_goals_conceded_l10: null,
      win_pct_l10: null,
      draw_pct_l10: null,
      loss_pct_l10: null,
      btts_pct_l10: null,
      clean_sheet_pct_l10: null,
      failed_to_score_pct_l10: null,
      over_0_5_match_goals_pct_l10: null,
      over_1_5_match_goals_pct_l10: null,
      over_2_5_match_goals_pct_l10: null,
      over_3_5_match_goals_pct_l10: null,
      over_4_5_match_goals_pct_l10: null,
      avg_1h_goals_l10: null,
      avg_1h_goals_scored_l10: null,
      avg_1h_goals_conceded_l10: null,
      ht_win_pct_l10: null,
      ht_draw_pct_l10: null,
      ht_loss_pct_l10: null,
      ht_btts_pct_l10: null,
      over_0_5_ht_goals_pct_l10: null,
      over_1_5_ht_goals_pct_l10: null,
      over_2_5_ht_goals_pct_l10: null,
      over_3_5_ht_goals_pct_l10: null,
      over_4_5_ht_goals_pct_l10: null,
      avg_2h_goals_l10: null,
      avg_2h_goals_scored_l10: null,
      avg_2h_goals_conceded_l10: null,
      '2h_win_pct_l10': null,
      '2h_draw_pct_l10': null,
      '2h_loss_pct_l10': null,
      '2h_btts_pct_l10': null,
      over_0_5_2h_goals_pct_l10: null,
      over_1_5_2h_goals_pct_l10: null,
      over_2_5_2h_goals_pct_l10: null,
      over_3_5_2h_goals_pct_l10: null,
      over_4_5_2h_goals_pct_l10: null,
      over_0_5_goals_scored_pct_l10: null,
      over_1_5_goals_scored_pct_l10: null,
      over_2_5_goals_scored_pct_l10: null,
      over_3_5_goals_scored_pct_l10: null,
      over_4_5_goals_scored_pct_l10: null,
      over_0_5_goals_conceded_pct_l10: null,
      over_1_5_goals_conceded_pct_l10: null,
      over_2_5_goals_conceded_pct_l10: null,
      over_3_5_goals_conceded_pct_l10: null,
      over_4_5_goals_conceded_pct_l10: null,
      avg_corners_l10: null,
      avg_corners_for_l10: null,
      avg_corners_against_l10: null,
      over_10_corners_pct_l10: null,
      avg_shots_l10: null,
      avg_shots_for_l10: null,
      avg_shots_against_l10: null,
      avg_shots_on_target_l10: null,
      avg_shots_on_target_for_l10: null,
      avg_shots_on_target_against_l10: null,
      over_15_shots_pct_l10: null,
      over_5_shots_on_target_pct_l10: null,
      avg_shots_off_target_l10: null,
      avg_shots_off_target_for_l10: null,
      avg_shots_off_target_against_l10: null,

      // Batch 10 - Last 10 Matches Home/Away
      avg_match_goals_l10h: null,
      avg_goals_scored_l10h: null,
      avg_goals_conceded_l10h: null,
      win_pct_l10h: null,
      draw_pct_l10h: null,
      loss_pct_l10h: null,
      btts_pct_l10h: null,
      clean_sheet_pct_l10h: null,
      failed_to_score_pct_l10h: null,
      over_0_5_match_goals_pct_l10h: null,
      over_1_5_match_goals_pct_l10h: null,
      over_2_5_match_goals_pct_l10h: null,
      over_3_5_match_goals_pct_l10h: null,
      over_4_5_match_goals_pct_l10h: null,
      over_0_5_goals_scored_pct_l10h: null,
      over_1_5_goals_scored_pct_l10h: null,
      over_2_5_goals_scored_pct_l10h: null,
      over_3_5_goals_scored_pct_l10h: null,
      over_4_5_goals_scored_pct_l10h: null,
      over_0_5_goals_conceded_pct_l10h: null,
      over_1_5_goals_conceded_pct_l10h: null,
      over_2_5_goals_conceded_pct_l10h: null,
      over_3_5_goals_conceded_pct_l10h: null,
      over_4_5_goals_conceded_pct_l10h: null,
      avg_corners_l10h: null,
      avg_corners_for_l10h: null,
      avg_corners_against_l10h: null,
      avg_shots_on_target_l10h: null,
      avg_shots_on_target_for_l10h: null,
      avg_shots_on_target_against_l10h: null,
      avg_shots_off_target_l10h: null,
      avg_shots_off_target_for_l10h: null,
      avg_shots_off_target_against_l10h: null,
      avg_match_goals_l10a: null,
      avg_goals_scored_l10a: null,
      avg_goals_conceded_l10a: null,
      win_pct_l10a: null,
      draw_pct_l10a: null,
      loss_pct_l10a: null,
      btts_pct_l10a: null,
      clean_sheet_pct_l10a: null,
      failed_to_score_pct_l10a: null,
      over_0_5_match_goals_pct_l10a: null,
      over_1_5_match_goals_pct_l10a: null,
      over_2_5_match_goals_pct_l10a: null,
      over_3_5_match_goals_pct_l10a: null,
      over_4_5_match_goals_pct_l10a: null,
      over_0_5_goals_scored_pct_l10a: null,
      over_1_5_goals_scored_pct_l10a: null,
      over_2_5_goals_scored_pct_l10a: null,
      over_3_5_goals_scored_pct_l10a: null,
      over_4_5_goals_scored_pct_l10a: null,
      over_0_5_goals_conceded_pct_l10a: null,
      over_1_5_goals_conceded_pct_l10a: null,
      over_2_5_goals_conceded_pct_l10a: null,
      over_3_5_goals_conceded_pct_l10a: null,
      over_4_5_goals_conceded_pct_l10a: null,
      avg_corners_l10a: null,
      avg_corners_for_l10a: null,
      avg_corners_against_l10a: null,
      avg_shots_on_target_l10a: null,
      avg_shots_on_target_for_l10a: null,
      avg_shots_on_target_against_l10a: null,
      avg_shots_off_target_l10a: null,
      avg_shots_off_target_for_l10a: null,
      avg_shots_off_target_against_l10a: null,

      // Batch 11 - 2H L10 Home/Away
      '2h_win_pct_l10h': null,
      '2h_draw_pct_l10h': null,
      '2h_loss_pct_l10h': null,
      '2h_btts_pct_l10h': null,
      '2h_win_pct_l10a': null,
      '2h_draw_pct_l10a': null,
      '2h_loss_pct_l10a': null,
      '2h_btts_pct_l10a': null,

      // Batch 15 - L10 Home/Away HT & 2H Goals
      avg_1h_goals_l10h: null,
      avg_1h_goals_scored_l10h: null,
      avg_1h_goals_conceded_l10h: null,
      ht_win_pct_l10h: null,
      ht_draw_pct_l10h: null,
      ht_loss_pct_l10h: null,
      ht_btts_pct_l10h: null,
      over_0_5_ht_goals_pct_l10h: null,
      over_1_5_ht_goals_pct_l10h: null,
      over_2_5_ht_goals_pct_l10h: null,
      over_3_5_ht_goals_pct_l10h: null,
      over_4_5_ht_goals_pct_l10h: null,
      avg_2h_goals_l10h: null,
      avg_2h_goals_scored_l10h: null,
      avg_2h_goals_conceded_l10h: null,
      over_0_5_2h_goals_pct_l10h: null,
      over_1_5_2h_goals_pct_l10h: null,
      over_2_5_2h_goals_pct_l10h: null,
      over_3_5_2h_goals_pct_l10h: null,
      over_4_5_2h_goals_pct_l10h: null,
      avg_1h_goals_l10a: null,
      avg_1h_goals_scored_l10a: null,
      avg_1h_goals_conceded_l10a: null,
      ht_win_pct_l10a: null,
      ht_draw_pct_l10a: null,
      ht_loss_pct_l10a: null,
      ht_btts_pct_l10a: null,
      over_0_5_ht_goals_pct_l10a: null,
      over_1_5_ht_goals_pct_l10a: null,
      over_2_5_ht_goals_pct_l10a: null,
      over_3_5_ht_goals_pct_l10a: null,
      over_4_5_ht_goals_pct_l10a: null,
      avg_2h_goals_l10a: null,
      avg_2h_goals_scored_l10a: null,
      avg_2h_goals_conceded_l10a: null,
      over_0_5_2h_goals_pct_l10a: null,
      over_1_5_2h_goals_pct_l10a: null,
      over_2_5_2h_goals_pct_l10a: null,
      over_3_5_2h_goals_pct_l10a: null,
      over_4_5_2h_goals_pct_l10a: null,

      // Batch 12 - Corners avg_match
      avg_match_corners_l5: null,
      avg_match_corners_l5h: null,
      avg_match_corners_l5a: null,
      avg_match_corners_l10: null,
      avg_match_corners_l10h: null,
      avg_match_corners_l10a: null,

      // Batch 13 - Half-Time Corners (not available from SportMonks API)
      avg_1h_corners_l5: null,
      avg_1h_corners_for_l5: null,
      avg_1h_corners_against_l5: null,
      avg_1h_corners_l5h: null,
      avg_1h_corners_for_l5h: null,
      avg_1h_corners_against_l5h: null,
      avg_1h_corners_l5a: null,
      avg_1h_corners_for_l5a: null,
      avg_1h_corners_against_l5a: null,
      avg_1h_corners_l10: null,
      avg_1h_corners_for_l10: null,
      avg_1h_corners_against_l10: null,
      avg_1h_corners_l10h: null,
      avg_1h_corners_for_l10h: null,
      avg_1h_corners_against_l10h: null,
      avg_1h_corners_l10a: null,
      avg_1h_corners_for_l10a: null,
      avg_1h_corners_against_l10a: null,

      // Batch 14 - Second-Half Corners (not available from SportMonks API)
      avg_2h_corners_l5: null,
      avg_2h_corners_for_l5: null,
      avg_2h_corners_against_l5: null,
      avg_2h_corners_l5h: null,
      avg_2h_corners_for_l5h: null,
      avg_2h_corners_against_l5h: null,
      avg_2h_corners_l5a: null,
      avg_2h_corners_for_l5a: null,
      avg_2h_corners_against_l5a: null,
      avg_2h_corners_l10: null,
      avg_2h_corners_for_l10: null,
      avg_2h_corners_against_l10: null,
      avg_2h_corners_l10h: null,
      avg_2h_corners_for_l10h: null,
      avg_2h_corners_against_l10h: null,
      avg_2h_corners_l10a: null,
      avg_2h_corners_for_l10a: null,
      avg_2h_corners_against_l10a: null,
      // Batch 16 - H2H
      avg_h2h_match_goals_l5: null,
      avg_h2h_1h_goals_l5: null,
      avg_h2h_2h_goals_l5: null,
      avg_h2h_match_corners_l5: null,
      avg_h2h_1h_corners_l5: null,
      avg_h2h_2h_corners_l5: null,
      avg_h2h_shots_on_target_l5: null,
      avg_h2h_shots_off_target_l5: null,
      h2h_btts_pct_l5: null,
      h2h_over_0_5_goals_pct_l5: null,
      h2h_over_1_5_goals_pct_l5: null,
      h2h_over_2_5_goals_pct_l5: null,
      h2h_over_3_5_goals_pct_l5: null,
      h2h_over_4_5_goals_pct_l5: null,
      h2h_over_0_5_1h_goals_pct_l5: null,
      h2h_over_1_5_1h_goals_pct_l5: null,
      h2h_over_2_5_1h_goals_pct_l5: null,
      h2h_over_3_5_1h_goals_pct_l5: null,
      h2h_over_4_5_1h_goals_pct_l5: null,
      h2h_over_0_5_2h_goals_pct_l5: null,
      h2h_over_1_5_2h_goals_pct_l5: null,
      h2h_over_2_5_2h_goals_pct_l5: null,
      h2h_over_3_5_2h_goals_pct_l5: null,
      h2h_over_4_5_2h_goals_pct_l5: null,
    };
  }

  // Use only first 5 matches for L5 calculations
  const matchScoresL5 = matchScores.slice(0, 5);
  const countL5 = matchScoresL5.length;

  // Calculate averages (L5)
  const totalGoalsScored = matchScoresL5.reduce((sum, m) => sum + m.goalsScored, 0);
  const totalGoalsConceded = matchScoresL5.reduce((sum, m) => sum + m.goalsConceded, 0);
  const totalMatchGoals = matchScoresL5.reduce((sum, m) => sum + m.totalGoals, 0);

  const avg_match_goals_l5 = parseFloat((totalMatchGoals / countL5).toFixed(2));
  const avg_goals_scored_l5 = parseFloat((totalGoalsScored / countL5).toFixed(2));
  const avg_goals_conceded_l5 = parseFloat((totalGoalsConceded / countL5).toFixed(2));

  // Calculate percentages - Batch 1
  const wins = matchScoresL5.filter(m => m.isWin).length;
  const bttsMatches = matchScoresL5.filter(m => m.btts).length;
  const cleanSheets = matchScoresL5.filter(m => m.cleanSheet).length;
  const over_1_5_matches = matchScoresL5.filter(m => m.totalGoals > 1.5).length;
  const over_2_5_matches = matchScoresL5.filter(m => m.totalGoals > 2.5).length;

  const win_pct_l5 = parseFloat(((wins / countL5) * 100).toFixed(2));
  const btts_pct_l5 = parseFloat(((bttsMatches / countL5) * 100).toFixed(2));
  const clean_sheet_pct_l5 = parseFloat(((cleanSheets / countL5) * 100).toFixed(2));
  const over_1_5_match_goals_pct_l5 = parseFloat(((over_1_5_matches / countL5) * 100).toFixed(2));
  const over_2_5_match_goals_pct_l5 = parseFloat(((over_2_5_matches / countL5) * 100).toFixed(2));

  // Calculate percentages - Batch 2
  const draws = matchScoresL5.filter(m => m.isDraw).length;
  const losses = matchScoresL5.filter(m => m.isLoss).length;
  const over_0_5_matches = matchScoresL5.filter(m => m.totalGoals > 0.5).length;
  const over_3_5_matches = matchScoresL5.filter(m => m.totalGoals > 3.5).length;
  const over_4_5_matches = matchScoresL5.filter(m => m.totalGoals > 4.5).length;

  const draw_pct_l5 = parseFloat(((draws / countL5) * 100).toFixed(2));
  const loss_pct_l5 = parseFloat(((losses / countL5) * 100).toFixed(2));
  const over_0_5_match_goals_pct_l5 = parseFloat(((over_0_5_matches / countL5) * 100).toFixed(2));
  const over_3_5_match_goals_pct_l5 = parseFloat(((over_3_5_matches / countL5) * 100).toFixed(2));
  const over_4_5_match_goals_pct_l5 = parseFloat(((over_4_5_matches / countL5) * 100).toFixed(2));

  // ──────────────────────────────────────────────────────────────────────────
  // Batch 3: Calculate HOME variants (_l5h) - only matches played at home
  // ──────────────────────────────────────────────────────────────────────────
  const homeMatches = matchScoresL5.filter(m => m.location === 'home');
  const homeCount = homeMatches.length;

  let avg_match_goals_l5h: number | null = null;
  let avg_goals_scored_l5h: number | null = null;
  let avg_goals_conceded_l5h: number | null = null;
  let win_pct_l5h: number | null = null;
  let btts_pct_l5h: number | null = null;
  let clean_sheet_pct_l5h: number | null = null;
  let over_1_5_match_goals_pct_l5h: number | null = null;
  let over_2_5_match_goals_pct_l5h: number | null = null;
  let over_0_5_match_goals_pct_l5h: number | null = null;
  let over_3_5_match_goals_pct_l5h: number | null = null;
  let over_4_5_match_goals_pct_l5h: number | null = null;
  let draw_pct_l5h: number | null = null;
  let loss_pct_l5h: number | null = null;

  if (homeCount >= 1) {
    // Averages
    const homeTotalGoalsScored = homeMatches.reduce((sum, m) => sum + m.goalsScored, 0);
    const homeTotalGoalsConceded = homeMatches.reduce((sum, m) => sum + m.goalsConceded, 0);
    const homeTotalMatchGoals = homeMatches.reduce((sum, m) => sum + m.totalGoals, 0);

    avg_match_goals_l5h = parseFloat((homeTotalMatchGoals / homeCount).toFixed(2));
    avg_goals_scored_l5h = parseFloat((homeTotalGoalsScored / homeCount).toFixed(2));
    avg_goals_conceded_l5h = parseFloat((homeTotalGoalsConceded / homeCount).toFixed(2));

    // Percentages
    const homeWins = homeMatches.filter(m => m.isWin).length;
    const homeBtts = homeMatches.filter(m => m.btts).length;
    const homeCleanSheets = homeMatches.filter(m => m.cleanSheet).length;
    const homeDraws = homeMatches.filter(m => m.isDraw).length;
    const homeLosses = homeMatches.filter(m => m.isLoss).length;
    const homeOver_0_5 = homeMatches.filter(m => m.totalGoals > 0.5).length;
    const homeOver_1_5 = homeMatches.filter(m => m.totalGoals > 1.5).length;
    const homeOver_2_5 = homeMatches.filter(m => m.totalGoals > 2.5).length;
    const homeOver_3_5 = homeMatches.filter(m => m.totalGoals > 3.5).length;
    const homeOver_4_5 = homeMatches.filter(m => m.totalGoals > 4.5).length;

    win_pct_l5h = parseFloat(((homeWins / homeCount) * 100).toFixed(2));
    btts_pct_l5h = parseFloat(((homeBtts / homeCount) * 100).toFixed(2));
    clean_sheet_pct_l5h = parseFloat(((homeCleanSheets / homeCount) * 100).toFixed(2));
    draw_pct_l5h = parseFloat(((homeDraws / homeCount) * 100).toFixed(2));
    loss_pct_l5h = parseFloat(((homeLosses / homeCount) * 100).toFixed(2));
    over_0_5_match_goals_pct_l5h = parseFloat(((homeOver_0_5 / homeCount) * 100).toFixed(2));
    over_1_5_match_goals_pct_l5h = parseFloat(((homeOver_1_5 / homeCount) * 100).toFixed(2));
    over_2_5_match_goals_pct_l5h = parseFloat(((homeOver_2_5 / homeCount) * 100).toFixed(2));
    over_3_5_match_goals_pct_l5h = parseFloat(((homeOver_3_5 / homeCount) * 100).toFixed(2));
    over_4_5_match_goals_pct_l5h = parseFloat(((homeOver_4_5 / homeCount) * 100).toFixed(2));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Batch 3: Calculate AWAY variants (_l5a) - only matches played away
  // ──────────────────────────────────────────────────────────────────────────
  const awayMatches = matchScoresL5.filter(m => m.location === 'away');
  const awayCount = awayMatches.length;

  let avg_match_goals_l5a: number | null = null;
  let avg_goals_scored_l5a: number | null = null;
  let avg_goals_conceded_l5a: number | null = null;
  let win_pct_l5a: number | null = null;
  let btts_pct_l5a: number | null = null;
  let clean_sheet_pct_l5a: number | null = null;
  let over_1_5_match_goals_pct_l5a: number | null = null;
  let over_2_5_match_goals_pct_l5a: number | null = null;
  let over_0_5_match_goals_pct_l5a: number | null = null;
  let over_3_5_match_goals_pct_l5a: number | null = null;
  let over_4_5_match_goals_pct_l5a: number | null = null;
  let draw_pct_l5a: number | null = null;
  let loss_pct_l5a: number | null = null;

  if (awayCount >= 1) {
    // Averages
    const awayTotalGoalsScored = awayMatches.reduce((sum, m) => sum + m.goalsScored, 0);
    const awayTotalGoalsConceded = awayMatches.reduce((sum, m) => sum + m.goalsConceded, 0);
    const awayTotalMatchGoals = awayMatches.reduce((sum, m) => sum + m.totalGoals, 0);

    avg_match_goals_l5a = parseFloat((awayTotalMatchGoals / awayCount).toFixed(2));
    avg_goals_scored_l5a = parseFloat((awayTotalGoalsScored / awayCount).toFixed(2));
    avg_goals_conceded_l5a = parseFloat((awayTotalGoalsConceded / awayCount).toFixed(2));

    // Percentages
    const awayWins = awayMatches.filter(m => m.isWin).length;
    const awayBtts = awayMatches.filter(m => m.btts).length;
    const awayCleanSheets = awayMatches.filter(m => m.cleanSheet).length;
    const awayDraws = awayMatches.filter(m => m.isDraw).length;
    const awayLosses = awayMatches.filter(m => m.isLoss).length;
    const awayOver_0_5 = awayMatches.filter(m => m.totalGoals > 0.5).length;
    const awayOver_1_5 = awayMatches.filter(m => m.totalGoals > 1.5).length;
    const awayOver_2_5 = awayMatches.filter(m => m.totalGoals > 2.5).length;
    const awayOver_3_5 = awayMatches.filter(m => m.totalGoals > 3.5).length;
    const awayOver_4_5 = awayMatches.filter(m => m.totalGoals > 4.5).length;

    win_pct_l5a = parseFloat(((awayWins / awayCount) * 100).toFixed(2));
    btts_pct_l5a = parseFloat(((awayBtts / awayCount) * 100).toFixed(2));
    clean_sheet_pct_l5a = parseFloat(((awayCleanSheets / awayCount) * 100).toFixed(2));
    draw_pct_l5a = parseFloat(((awayDraws / awayCount) * 100).toFixed(2));
    loss_pct_l5a = parseFloat(((awayLosses / awayCount) * 100).toFixed(2));
    over_0_5_match_goals_pct_l5a = parseFloat(((awayOver_0_5 / awayCount) * 100).toFixed(2));
    over_1_5_match_goals_pct_l5a = parseFloat(((awayOver_1_5 / awayCount) * 100).toFixed(2));
    over_2_5_match_goals_pct_l5a = parseFloat(((awayOver_2_5 / awayCount) * 100).toFixed(2));
    over_3_5_match_goals_pct_l5a = parseFloat(((awayOver_3_5 / awayCount) * 100).toFixed(2));
    over_4_5_match_goals_pct_l5a = parseFloat(((awayOver_4_5 / awayCount) * 100).toFixed(2));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BATCH 4: HALF TIME & SECOND HALF METRICS
  // ══════════════════════════════════════════════════════════════════════════

  // ──────────────────────────────────────────────────────────────────────────
  // HALF TIME - All matches
  // ──────────────────────────────────────────────────────────────────────────
  const totalHtGoalsScored = matchScoresL5.reduce((sum, m) => sum + m.htGoalsScored, 0);
  const totalHtGoalsConceded = matchScoresL5.reduce((sum, m) => sum + m.htGoalsConceded, 0);
  const totalHtGoals = matchScoresL5.reduce((sum, m) => sum + m.htTotalGoals, 0);

  const avg_1h_goals_l5 = parseFloat((totalHtGoals / count).toFixed(2));
  const avg_1h_goals_scored_l5 = parseFloat((totalHtGoalsScored / count).toFixed(2));
  const avg_1h_goals_conceded_l5 = parseFloat((totalHtGoalsConceded / count).toFixed(2));

  const htWins = matchScoresL5.filter(m => m.htIsWin).length;
  const htDraws = matchScoresL5.filter(m => m.htIsDraw).length;
  const htLosses = matchScoresL5.filter(m => m.htIsLoss).length;
  const htBtts = matchScoresL5.filter(m => m.htBtts).length;
  const htOver_0_5 = matchScoresL5.filter(m => m.htTotalGoals > 0.5).length;
  const htOver_1_5 = matchScoresL5.filter(m => m.htTotalGoals > 1.5).length;
  const htOver_2_5 = matchScoresL5.filter(m => m.htTotalGoals > 2.5).length;
  const htOver_3_5 = matchScoresL5.filter(m => m.htTotalGoals > 3.5).length;
  const htOver_4_5 = matchScoresL5.filter(m => m.htTotalGoals > 4.5).length;

  const ht_win_pct_l5 = parseFloat(((htWins / countL5) * 100).toFixed(2));
  const ht_draw_pct_l5 = parseFloat(((htDraws / countL5) * 100).toFixed(2));
  const ht_loss_pct_l5 = parseFloat(((htLosses / countL5) * 100).toFixed(2));
  const ht_btts_pct_l5 = parseFloat(((htBtts / countL5) * 100).toFixed(2));
  const over_0_5_ht_goals_pct_l5 = parseFloat(((htOver_0_5 / countL5) * 100).toFixed(2));
  const over_1_5_ht_goals_pct_l5 = parseFloat(((htOver_1_5 / countL5) * 100).toFixed(2));
  const over_2_5_ht_goals_pct_l5 = parseFloat(((htOver_2_5 / countL5) * 100).toFixed(2));
  const over_3_5_ht_goals_pct_l5 = parseFloat(((htOver_3_5 / countL5) * 100).toFixed(2));
  const over_4_5_ht_goals_pct_l5 = parseFloat(((htOver_4_5 / countL5) * 100).toFixed(2));

  // ──────────────────────────────────────────────────────────────────────────
  // SECOND HALF - All matches
  // ──────────────────────────────────────────────────────────────────────────
  const total2hGoalsScored = matchScoresL5.reduce((sum, m) => sum + m.secondHalfGoalsScored, 0);
  const total2hGoalsConceded = matchScoresL5.reduce((sum, m) => sum + m.secondHalfGoalsConceded, 0);
  const total2hGoals = matchScoresL5.reduce((sum, m) => sum + m.secondHalfTotalGoals, 0);

  const avg_2h_goals_l5 = parseFloat((total2hGoals / count).toFixed(2));
  const avg_2h_goals_scored_l5 = parseFloat((total2hGoalsScored / count).toFixed(2));
  const avg_2h_goals_conceded_l5 = parseFloat((total2hGoalsConceded / count).toFixed(2));

  const secondHalfWins = matchScoresL5.filter(m => m.secondHalfIsWin).length;
  const secondHalfDraws = matchScoresL5.filter(m => m.secondHalfIsDraw).length;
  const secondHalfLosses = matchScoresL5.filter(m => m.secondHalfIsLoss).length;
  const secondHalfBtts = matchScoresL5.filter(m => m.secondHalfBtts).length;
  const secondHalfOver_0_5 = matchScoresL5.filter(m => m.secondHalfTotalGoals > 0.5).length;
  const secondHalfOver_1_5 = matchScoresL5.filter(m => m.secondHalfTotalGoals > 1.5).length;
  const secondHalfOver_2_5 = matchScoresL5.filter(m => m.secondHalfTotalGoals > 2.5).length;
  const secondHalfOver_3_5 = matchScoresL5.filter(m => m.secondHalfTotalGoals > 3.5).length;
  const secondHalfOver_4_5 = matchScoresL5.filter(m => m.secondHalfTotalGoals > 4.5).length;

  const secondHalf_win_pct_l5 = parseFloat(((secondHalfWins / countL5) * 100).toFixed(2));
  const secondHalf_draw_pct_l5 = parseFloat(((secondHalfDraws / countL5) * 100).toFixed(2));
  const secondHalf_loss_pct_l5 = parseFloat(((secondHalfLosses / countL5) * 100).toFixed(2));
  const secondHalf_btts_pct_l5 = parseFloat(((secondHalfBtts / countL5) * 100).toFixed(2));
  const over_0_5_2h_goals_pct_l5 = parseFloat(((secondHalfOver_0_5 / countL5) * 100).toFixed(2));
  const over_1_5_2h_goals_pct_l5 = parseFloat(((secondHalfOver_1_5 / countL5) * 100).toFixed(2));
  const over_2_5_2h_goals_pct_l5 = parseFloat(((secondHalfOver_2_5 / countL5) * 100).toFixed(2));
  const over_3_5_2h_goals_pct_l5 = parseFloat(((secondHalfOver_3_5 / countL5) * 100).toFixed(2));
  const over_4_5_2h_goals_pct_l5 = parseFloat(((secondHalfOver_4_5 / countL5) * 100).toFixed(2));

  // ──────────────────────────────────────────────────────────────────────────
  // HALF TIME & SECOND HALF - HOME matches only
  // ──────────────────────────────────────────────────────────────────────────
  let avg_1h_goals_l5h: number | null = null;
  let avg_1h_goals_scored_l5h: number | null = null;
  let avg_1h_goals_conceded_l5h: number | null = null;
  let ht_win_pct_l5h: number | null = null;
  let ht_draw_pct_l5h: number | null = null;
  let ht_loss_pct_l5h: number | null = null;
  let ht_btts_pct_l5h: number | null = null;
  let over_0_5_ht_goals_pct_l5h: number | null = null;
  let over_1_5_ht_goals_pct_l5h: number | null = null;
  let over_2_5_ht_goals_pct_l5h: number | null = null;
  let over_3_5_ht_goals_pct_l5h: number | null = null;
  let over_4_5_ht_goals_pct_l5h: number | null = null;
  let avg_2h_goals_l5h: number | null = null;
  let avg_2h_goals_scored_l5h: number | null = null;
  let avg_2h_goals_conceded_l5h: number | null = null;
  let secondHalf_win_pct_l5h: number | null = null;
  let secondHalf_draw_pct_l5h: number | null = null;
  let secondHalf_loss_pct_l5h: number | null = null;
  let secondHalf_btts_pct_l5h: number | null = null;
  let over_0_5_2h_goals_pct_l5h: number | null = null;
  let over_1_5_2h_goals_pct_l5h: number | null = null;
  let over_2_5_2h_goals_pct_l5h: number | null = null;
  let over_3_5_2h_goals_pct_l5h: number | null = null;
  let over_4_5_2h_goals_pct_l5h: number | null = null;

  if (homeCount >= 1) {
    // Half Time - Home
    const homeHtGoalsScored = homeMatches.reduce((sum, m) => sum + m.htGoalsScored, 0);
    const homeHtGoalsConceded = homeMatches.reduce((sum, m) => sum + m.htGoalsConceded, 0);
    const homeHtGoals = homeMatches.reduce((sum, m) => sum + m.htTotalGoals, 0);

    avg_1h_goals_l5h = parseFloat((homeHtGoals / homeCount).toFixed(2));
    avg_1h_goals_scored_l5h = parseFloat((homeHtGoalsScored / homeCount).toFixed(2));
    avg_1h_goals_conceded_l5h = parseFloat((homeHtGoalsConceded / homeCount).toFixed(2));

    const homeHtWins = homeMatches.filter(m => m.htIsWin).length;
    const homeHtDraws = homeMatches.filter(m => m.htIsDraw).length;
    const homeHtLosses = homeMatches.filter(m => m.htIsLoss).length;
    const homeHtBtts = homeMatches.filter(m => m.htBtts).length;
    const homeHtOver_0_5 = homeMatches.filter(m => m.htTotalGoals > 0.5).length;
    const homeHtOver_1_5 = homeMatches.filter(m => m.htTotalGoals > 1.5).length;
    const homeHtOver_2_5 = homeMatches.filter(m => m.htTotalGoals > 2.5).length;
    const homeHtOver_3_5 = homeMatches.filter(m => m.htTotalGoals > 3.5).length;
    const homeHtOver_4_5 = homeMatches.filter(m => m.htTotalGoals > 4.5).length;

    ht_win_pct_l5h = parseFloat(((homeHtWins / homeCount) * 100).toFixed(2));
    ht_draw_pct_l5h = parseFloat(((homeHtDraws / homeCount) * 100).toFixed(2));
    ht_loss_pct_l5h = parseFloat(((homeHtLosses / homeCount) * 100).toFixed(2));
    ht_btts_pct_l5h = parseFloat(((homeHtBtts / homeCount) * 100).toFixed(2));
    over_0_5_ht_goals_pct_l5h = parseFloat(((homeHtOver_0_5 / homeCount) * 100).toFixed(2));
    over_1_5_ht_goals_pct_l5h = parseFloat(((homeHtOver_1_5 / homeCount) * 100).toFixed(2));
    over_2_5_ht_goals_pct_l5h = parseFloat(((homeHtOver_2_5 / homeCount) * 100).toFixed(2));
    over_3_5_ht_goals_pct_l5h = parseFloat(((homeHtOver_3_5 / homeCount) * 100).toFixed(2));
    over_4_5_ht_goals_pct_l5h = parseFloat(((homeHtOver_4_5 / homeCount) * 100).toFixed(2));

    // Second Half - Home
    const home2hGoalsScored = homeMatches.reduce((sum, m) => sum + m.secondHalfGoalsScored, 0);
    const home2hGoalsConceded = homeMatches.reduce((sum, m) => sum + m.secondHalfGoalsConceded, 0);
    const home2hGoals = homeMatches.reduce((sum, m) => sum + m.secondHalfTotalGoals, 0);

    avg_2h_goals_l5h = parseFloat((home2hGoals / homeCount).toFixed(2));
    avg_2h_goals_scored_l5h = parseFloat((home2hGoalsScored / homeCount).toFixed(2));
    avg_2h_goals_conceded_l5h = parseFloat((home2hGoalsConceded / homeCount).toFixed(2));

    const home2hWins = homeMatches.filter(m => m.secondHalfIsWin).length;
    const home2hDraws = homeMatches.filter(m => m.secondHalfIsDraw).length;
    const home2hLosses = homeMatches.filter(m => m.secondHalfIsLoss).length;
    const home2hBtts = homeMatches.filter(m => m.secondHalfBtts).length;
    const home2hOver_0_5 = homeMatches.filter(m => m.secondHalfTotalGoals > 0.5).length;
    const home2hOver_1_5 = homeMatches.filter(m => m.secondHalfTotalGoals > 1.5).length;
    const home2hOver_2_5 = homeMatches.filter(m => m.secondHalfTotalGoals > 2.5).length;
    const home2hOver_3_5 = homeMatches.filter(m => m.secondHalfTotalGoals > 3.5).length;
    const home2hOver_4_5 = homeMatches.filter(m => m.secondHalfTotalGoals > 4.5).length;

    secondHalf_win_pct_l5h = parseFloat(((home2hWins / homeCount) * 100).toFixed(2));
    secondHalf_draw_pct_l5h = parseFloat(((home2hDraws / homeCount) * 100).toFixed(2));
    secondHalf_loss_pct_l5h = parseFloat(((home2hLosses / homeCount) * 100).toFixed(2));
    secondHalf_btts_pct_l5h = parseFloat(((home2hBtts / homeCount) * 100).toFixed(2));
    over_0_5_2h_goals_pct_l5h = parseFloat(((home2hOver_0_5 / homeCount) * 100).toFixed(2));
    over_1_5_2h_goals_pct_l5h = parseFloat(((home2hOver_1_5 / homeCount) * 100).toFixed(2));
    over_2_5_2h_goals_pct_l5h = parseFloat(((home2hOver_2_5 / homeCount) * 100).toFixed(2));
    over_3_5_2h_goals_pct_l5h = parseFloat(((home2hOver_3_5 / homeCount) * 100).toFixed(2));
    over_4_5_2h_goals_pct_l5h = parseFloat(((home2hOver_4_5 / homeCount) * 100).toFixed(2));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // HALF TIME & SECOND HALF - AWAY matches only
  // ──────────────────────────────────────────────────────────────────────────
  let avg_1h_goals_l5a: number | null = null;
  let avg_1h_goals_scored_l5a: number | null = null;
  let avg_1h_goals_conceded_l5a: number | null = null;
  let ht_win_pct_l5a: number | null = null;
  let ht_draw_pct_l5a: number | null = null;
  let ht_loss_pct_l5a: number | null = null;
  let ht_btts_pct_l5a: number | null = null;
  let over_0_5_ht_goals_pct_l5a: number | null = null;
  let over_1_5_ht_goals_pct_l5a: number | null = null;
  let over_2_5_ht_goals_pct_l5a: number | null = null;
  let over_3_5_ht_goals_pct_l5a: number | null = null;
  let over_4_5_ht_goals_pct_l5a: number | null = null;
  let avg_2h_goals_l5a: number | null = null;
  let avg_2h_goals_scored_l5a: number | null = null;
  let avg_2h_goals_conceded_l5a: number | null = null;
  let secondHalf_win_pct_l5a: number | null = null;
  let secondHalf_draw_pct_l5a: number | null = null;
  let secondHalf_loss_pct_l5a: number | null = null;
  let secondHalf_btts_pct_l5a: number | null = null;
  let over_0_5_2h_goals_pct_l5a: number | null = null;
  let over_1_5_2h_goals_pct_l5a: number | null = null;
  let over_2_5_2h_goals_pct_l5a: number | null = null;
  let over_3_5_2h_goals_pct_l5a: number | null = null;
  let over_4_5_2h_goals_pct_l5a: number | null = null;

  if (awayCount >= 1) {
    // Half Time - Away
    const awayHtGoalsScored = awayMatches.reduce((sum, m) => sum + m.htGoalsScored, 0);
    const awayHtGoalsConceded = awayMatches.reduce((sum, m) => sum + m.htGoalsConceded, 0);
    const awayHtGoals = awayMatches.reduce((sum, m) => sum + m.htTotalGoals, 0);

    avg_1h_goals_l5a = parseFloat((awayHtGoals / awayCount).toFixed(2));
    avg_1h_goals_scored_l5a = parseFloat((awayHtGoalsScored / awayCount).toFixed(2));
    avg_1h_goals_conceded_l5a = parseFloat((awayHtGoalsConceded / awayCount).toFixed(2));

    const awayHtWins = awayMatches.filter(m => m.htIsWin).length;
    const awayHtDraws = awayMatches.filter(m => m.htIsDraw).length;
    const awayHtLosses = awayMatches.filter(m => m.htIsLoss).length;
    const awayHtBtts = awayMatches.filter(m => m.htBtts).length;
    const awayHtOver_0_5 = awayMatches.filter(m => m.htTotalGoals > 0.5).length;
    const awayHtOver_1_5 = awayMatches.filter(m => m.htTotalGoals > 1.5).length;
    const awayHtOver_2_5 = awayMatches.filter(m => m.htTotalGoals > 2.5).length;
    const awayHtOver_3_5 = awayMatches.filter(m => m.htTotalGoals > 3.5).length;
    const awayHtOver_4_5 = awayMatches.filter(m => m.htTotalGoals > 4.5).length;

    ht_win_pct_l5a = parseFloat(((awayHtWins / awayCount) * 100).toFixed(2));
    ht_draw_pct_l5a = parseFloat(((awayHtDraws / awayCount) * 100).toFixed(2));
    ht_loss_pct_l5a = parseFloat(((awayHtLosses / awayCount) * 100).toFixed(2));
    ht_btts_pct_l5a = parseFloat(((awayHtBtts / awayCount) * 100).toFixed(2));
    over_0_5_ht_goals_pct_l5a = parseFloat(((awayHtOver_0_5 / awayCount) * 100).toFixed(2));
    over_1_5_ht_goals_pct_l5a = parseFloat(((awayHtOver_1_5 / awayCount) * 100).toFixed(2));
    over_2_5_ht_goals_pct_l5a = parseFloat(((awayHtOver_2_5 / awayCount) * 100).toFixed(2));
    over_3_5_ht_goals_pct_l5a = parseFloat(((awayHtOver_3_5 / awayCount) * 100).toFixed(2));
    over_4_5_ht_goals_pct_l5a = parseFloat(((awayHtOver_4_5 / awayCount) * 100).toFixed(2));

    // Second Half - Away
    const away2hGoalsScored = awayMatches.reduce((sum, m) => sum + m.secondHalfGoalsScored, 0);
    const away2hGoalsConceded = awayMatches.reduce((sum, m) => sum + m.secondHalfGoalsConceded, 0);
    const away2hGoals = awayMatches.reduce((sum, m) => sum + m.secondHalfTotalGoals, 0);

    avg_2h_goals_l5a = parseFloat((away2hGoals / awayCount).toFixed(2));
    avg_2h_goals_scored_l5a = parseFloat((away2hGoalsScored / awayCount).toFixed(2));
    avg_2h_goals_conceded_l5a = parseFloat((away2hGoalsConceded / awayCount).toFixed(2));

    const away2hWins = awayMatches.filter(m => m.secondHalfIsWin).length;
    const away2hDraws = awayMatches.filter(m => m.secondHalfIsDraw).length;
    const away2hLosses = awayMatches.filter(m => m.secondHalfIsLoss).length;
    const away2hBtts = awayMatches.filter(m => m.secondHalfBtts).length;
    const away2hOver_0_5 = awayMatches.filter(m => m.secondHalfTotalGoals > 0.5).length;
    const away2hOver_1_5 = awayMatches.filter(m => m.secondHalfTotalGoals > 1.5).length;
    const away2hOver_2_5 = awayMatches.filter(m => m.secondHalfTotalGoals > 2.5).length;
    const away2hOver_3_5 = awayMatches.filter(m => m.secondHalfTotalGoals > 3.5).length;
    const away2hOver_4_5 = awayMatches.filter(m => m.secondHalfTotalGoals > 4.5).length;

    secondHalf_win_pct_l5a = parseFloat(((away2hWins / awayCount) * 100).toFixed(2));
    secondHalf_draw_pct_l5a = parseFloat(((away2hDraws / awayCount) * 100).toFixed(2));
    secondHalf_loss_pct_l5a = parseFloat(((away2hLosses / awayCount) * 100).toFixed(2));
    secondHalf_btts_pct_l5a = parseFloat(((away2hBtts / awayCount) * 100).toFixed(2));
    over_0_5_2h_goals_pct_l5a = parseFloat(((away2hOver_0_5 / awayCount) * 100).toFixed(2));
    over_1_5_2h_goals_pct_l5a = parseFloat(((away2hOver_1_5 / awayCount) * 100).toFixed(2));
    over_2_5_2h_goals_pct_l5a = parseFloat(((away2hOver_2_5 / awayCount) * 100).toFixed(2));
    over_3_5_2h_goals_pct_l5a = parseFloat(((away2hOver_3_5 / awayCount) * 100).toFixed(2));
    over_4_5_2h_goals_pct_l5a = parseFloat(((away2hOver_4_5 / awayCount) * 100).toFixed(2));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BATCH 5: GOALS SCORED / CONCEDED VARIANTS
  // ══════════════════════════════════════════════════════════════════════════

  // ──────────────────────────────────────────────────────────────────────────
  // Goals Scored - All matches
  // ──────────────────────────────────────────────────────────────────────────
  const scoredOver_0_5 = matchScoresL5.filter(m => m.goalsScored > 0.5).length;
  const scoredOver_1_5 = matchScoresL5.filter(m => m.goalsScored > 1.5).length;
  const scoredOver_2_5 = matchScoresL5.filter(m => m.goalsScored > 2.5).length;
  const scoredOver_3_5 = matchScoresL5.filter(m => m.goalsScored > 3.5).length;
  const scoredOver_4_5 = matchScoresL5.filter(m => m.goalsScored > 4.5).length;
  const failedToScore = matchScoresL5.filter(m => m.goalsScored === 0).length;

  const over_0_5_goals_scored_pct_l5 = parseFloat(((scoredOver_0_5 / countL5) * 100).toFixed(2));
  const over_1_5_goals_scored_pct_l5 = parseFloat(((scoredOver_1_5 / countL5) * 100).toFixed(2));
  const over_2_5_goals_scored_pct_l5 = parseFloat(((scoredOver_2_5 / countL5) * 100).toFixed(2));
  const over_3_5_goals_scored_pct_l5 = parseFloat(((scoredOver_3_5 / countL5) * 100).toFixed(2));
  const over_4_5_goals_scored_pct_l5 = parseFloat(((scoredOver_4_5 / countL5) * 100).toFixed(2));
  const failed_to_score_pct_l5 = parseFloat(((failedToScore / countL5) * 100).toFixed(2));

  // ──────────────────────────────────────────────────────────────────────────
  // Goals Conceded - All matches
  // ──────────────────────────────────────────────────────────────────────────
  const concededOver_0_5 = matchScoresL5.filter(m => m.goalsConceded > 0.5).length;
  const concededOver_1_5 = matchScoresL5.filter(m => m.goalsConceded > 1.5).length;
  const concededOver_2_5 = matchScoresL5.filter(m => m.goalsConceded > 2.5).length;
  const concededOver_3_5 = matchScoresL5.filter(m => m.goalsConceded > 3.5).length;
  const concededOver_4_5 = matchScoresL5.filter(m => m.goalsConceded > 4.5).length;

  const over_0_5_goals_conceded_pct_l5 = parseFloat(((concededOver_0_5 / countL5) * 100).toFixed(2));
  const over_1_5_goals_conceded_pct_l5 = parseFloat(((concededOver_1_5 / countL5) * 100).toFixed(2));
  const over_2_5_goals_conceded_pct_l5 = parseFloat(((concededOver_2_5 / countL5) * 100).toFixed(2));
  const over_3_5_goals_conceded_pct_l5 = parseFloat(((concededOver_3_5 / countL5) * 100).toFixed(2));
  const over_4_5_goals_conceded_pct_l5 = parseFloat(((concededOver_4_5 / countL5) * 100).toFixed(2));

  // ──────────────────────────────────────────────────────────────────────────
  // Goals Scored / Conceded - HOME matches
  // ──────────────────────────────────────────────────────────────────────────
  let over_0_5_goals_scored_pct_l5h: number | null = null;
  let over_1_5_goals_scored_pct_l5h: number | null = null;
  let over_2_5_goals_scored_pct_l5h: number | null = null;
  let over_3_5_goals_scored_pct_l5h: number | null = null;
  let over_4_5_goals_scored_pct_l5h: number | null = null;
  let failed_to_score_pct_l5h: number | null = null;
  let over_0_5_goals_conceded_pct_l5h: number | null = null;
  let over_1_5_goals_conceded_pct_l5h: number | null = null;
  let over_2_5_goals_conceded_pct_l5h: number | null = null;
  let over_3_5_goals_conceded_pct_l5h: number | null = null;
  let over_4_5_goals_conceded_pct_l5h: number | null = null;

  if (homeCount >= 1) {
    const homeScoredOver_0_5 = homeMatches.filter(m => m.goalsScored > 0.5).length;
    const homeScoredOver_1_5 = homeMatches.filter(m => m.goalsScored > 1.5).length;
    const homeScoredOver_2_5 = homeMatches.filter(m => m.goalsScored > 2.5).length;
    const homeScoredOver_3_5 = homeMatches.filter(m => m.goalsScored > 3.5).length;
    const homeScoredOver_4_5 = homeMatches.filter(m => m.goalsScored > 4.5).length;
    const homeFailedToScore = homeMatches.filter(m => m.goalsScored === 0).length;

    over_0_5_goals_scored_pct_l5h = parseFloat(((homeScoredOver_0_5 / homeCount) * 100).toFixed(2));
    over_1_5_goals_scored_pct_l5h = parseFloat(((homeScoredOver_1_5 / homeCount) * 100).toFixed(2));
    over_2_5_goals_scored_pct_l5h = parseFloat(((homeScoredOver_2_5 / homeCount) * 100).toFixed(2));
    over_3_5_goals_scored_pct_l5h = parseFloat(((homeScoredOver_3_5 / homeCount) * 100).toFixed(2));
    over_4_5_goals_scored_pct_l5h = parseFloat(((homeScoredOver_4_5 / homeCount) * 100).toFixed(2));
    failed_to_score_pct_l5h = parseFloat(((homeFailedToScore / homeCount) * 100).toFixed(2));

    const homeConcededOver_0_5 = homeMatches.filter(m => m.goalsConceded > 0.5).length;
    const homeConcededOver_1_5 = homeMatches.filter(m => m.goalsConceded > 1.5).length;
    const homeConcededOver_2_5 = homeMatches.filter(m => m.goalsConceded > 2.5).length;
    const homeConcededOver_3_5 = homeMatches.filter(m => m.goalsConceded > 3.5).length;
    const homeConcededOver_4_5 = homeMatches.filter(m => m.goalsConceded > 4.5).length;

    over_0_5_goals_conceded_pct_l5h = parseFloat(((homeConcededOver_0_5 / homeCount) * 100).toFixed(2));
    over_1_5_goals_conceded_pct_l5h = parseFloat(((homeConcededOver_1_5 / homeCount) * 100).toFixed(2));
    over_2_5_goals_conceded_pct_l5h = parseFloat(((homeConcededOver_2_5 / homeCount) * 100).toFixed(2));
    over_3_5_goals_conceded_pct_l5h = parseFloat(((homeConcededOver_3_5 / homeCount) * 100).toFixed(2));
    over_4_5_goals_conceded_pct_l5h = parseFloat(((homeConcededOver_4_5 / homeCount) * 100).toFixed(2));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Goals Scored / Conceded - AWAY matches
  // ──────────────────────────────────────────────────────────────────────────
  let over_0_5_goals_scored_pct_l5a: number | null = null;
  let over_1_5_goals_scored_pct_l5a: number | null = null;
  let over_2_5_goals_scored_pct_l5a: number | null = null;
  let over_3_5_goals_scored_pct_l5a: number | null = null;
  let over_4_5_goals_scored_pct_l5a: number | null = null;
  let failed_to_score_pct_l5a: number | null = null;
  let over_0_5_goals_conceded_pct_l5a: number | null = null;
  let over_1_5_goals_conceded_pct_l5a: number | null = null;
  let over_2_5_goals_conceded_pct_l5a: number | null = null;
  let over_3_5_goals_conceded_pct_l5a: number | null = null;
  let over_4_5_goals_conceded_pct_l5a: number | null = null;

  if (awayCount >= 1) {
    const awayScoredOver_0_5 = awayMatches.filter(m => m.goalsScored > 0.5).length;
    const awayScoredOver_1_5 = awayMatches.filter(m => m.goalsScored > 1.5).length;
    const awayScoredOver_2_5 = awayMatches.filter(m => m.goalsScored > 2.5).length;
    const awayScoredOver_3_5 = awayMatches.filter(m => m.goalsScored > 3.5).length;
    const awayScoredOver_4_5 = awayMatches.filter(m => m.goalsScored > 4.5).length;
    const awayFailedToScore = awayMatches.filter(m => m.goalsScored === 0).length;

    over_0_5_goals_scored_pct_l5a = parseFloat(((awayScoredOver_0_5 / awayCount) * 100).toFixed(2));
    over_1_5_goals_scored_pct_l5a = parseFloat(((awayScoredOver_1_5 / awayCount) * 100).toFixed(2));
    over_2_5_goals_scored_pct_l5a = parseFloat(((awayScoredOver_2_5 / awayCount) * 100).toFixed(2));
    over_3_5_goals_scored_pct_l5a = parseFloat(((awayScoredOver_3_5 / awayCount) * 100).toFixed(2));
    over_4_5_goals_scored_pct_l5a = parseFloat(((awayScoredOver_4_5 / awayCount) * 100).toFixed(2));
    failed_to_score_pct_l5a = parseFloat(((awayFailedToScore / awayCount) * 100).toFixed(2));

    const awayConcededOver_0_5 = awayMatches.filter(m => m.goalsConceded > 0.5).length;
    const awayConcededOver_1_5 = awayMatches.filter(m => m.goalsConceded > 1.5).length;
    const awayConcededOver_2_5 = awayMatches.filter(m => m.goalsConceded > 2.5).length;
    const awayConcededOver_3_5 = awayMatches.filter(m => m.goalsConceded > 3.5).length;
    const awayConcededOver_4_5 = awayMatches.filter(m => m.goalsConceded > 4.5).length;

    over_0_5_goals_conceded_pct_l5a = parseFloat(((awayConcededOver_0_5 / awayCount) * 100).toFixed(2));
    over_1_5_goals_conceded_pct_l5a = parseFloat(((awayConcededOver_1_5 / awayCount) * 100).toFixed(2));
    over_2_5_goals_conceded_pct_l5a = parseFloat(((awayConcededOver_2_5 / awayCount) * 100).toFixed(2));
    over_3_5_goals_conceded_pct_l5a = parseFloat(((awayConcededOver_3_5 / awayCount) * 100).toFixed(2));
    over_4_5_goals_conceded_pct_l5a = parseFloat(((awayConcededOver_4_5 / awayCount) * 100).toFixed(2));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 6 - CORNERS METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  // Calculate totals
  const totalCornersFor = matchScoresL5.reduce((sum, m) => sum + m.cornersFor, 0);
  const totalCornersAgainst = matchScoresL5.reduce((sum, m) => sum + m.cornersAgainst, 0);
  const totalCornersInMatches = matchScoresL5.reduce((sum, m) => sum + m.totalCorners, 0);

  // Averages (all matches)
  const avg_corners_l5 = parseFloat((totalCornersInMatches / count).toFixed(2));
  const avg_corners_for_l5 = parseFloat((totalCornersFor / count).toFixed(2));
  const avg_corners_against_l5 = parseFloat((totalCornersAgainst / count).toFixed(2));

  // Batch 12 - avg_match_corners is same as avg_corners (total corners per match)
  const avg_match_corners_l5 = avg_corners_l5;

  // Batch 13/14 - 1H/2H Corners (L5 all matches)
  const avg_1h_corners_l5 = parseFloat((matchScoresL5.reduce((sum, m) => sum + m.firstHalfTotalCorners, 0) / countL5).toFixed(2));
  const avg_1h_corners_for_l5 = parseFloat((matchScoresL5.reduce((sum, m) => sum + m.firstHalfCornersFor, 0) / countL5).toFixed(2));
  const avg_1h_corners_against_l5 = parseFloat((matchScoresL5.reduce((sum, m) => sum + m.firstHalfCornersAgainst, 0) / countL5).toFixed(2));
  const avg_2h_corners_l5 = parseFloat((matchScoresL5.reduce((sum, m) => sum + m.secondHalfTotalCorners, 0) / countL5).toFixed(2));
  const avg_2h_corners_for_l5 = parseFloat((matchScoresL5.reduce((sum, m) => sum + m.secondHalfCornersFor, 0) / countL5).toFixed(2));
  const avg_2h_corners_against_l5 = parseFloat((matchScoresL5.reduce((sum, m) => sum + m.secondHalfCornersAgainst, 0) / countL5).toFixed(2));

  // Percentage metrics (all matches)
  const over10CornersCount = matchScoresL5.filter(m => m.totalCorners >= 10).length;
  const over_10_corners_pct_l5 = parseFloat(((over10CornersCount / countL5) * 100).toFixed(2));

  // Home/Away variants
  let avg_corners_l5h: number | null = null;
  let avg_corners_for_l5h: number | null = null;
  let avg_corners_against_l5h: number | null = null;
  let over_10_corners_pct_l5h: number | null = null;

  let avg_corners_l5a: number | null = null;
  let avg_corners_for_l5a: number | null = null;
  let avg_corners_against_l5a: number | null = null;
  let over_10_corners_pct_l5a: number | null = null;

  // Batch 12 - avg_match_corners variants
  let avg_match_corners_l5h: number | null = null;
  let avg_match_corners_l5a: number | null = null;

  // Batch 13/14 - 1H/2H Corners L5 Home/Away variants
  let avg_1h_corners_l5h: number | null = null;
  let avg_1h_corners_for_l5h: number | null = null;
  let avg_1h_corners_against_l5h: number | null = null;
  let avg_2h_corners_l5h: number | null = null;
  let avg_2h_corners_for_l5h: number | null = null;
  let avg_2h_corners_against_l5h: number | null = null;

  let avg_1h_corners_l5a: number | null = null;
  let avg_1h_corners_for_l5a: number | null = null;
  let avg_1h_corners_against_l5a: number | null = null;
  let avg_2h_corners_l5a: number | null = null;
  let avg_2h_corners_for_l5a: number | null = null;
  let avg_2h_corners_against_l5a: number | null = null;

  const homeMatchesCorners = matchScoresL5.filter(m => m.location === 'home');
  const awayMatchesCorners = matchScoresL5.filter(m => m.location === 'away');

  if (homeMatchesCorners.length > 0) {
    const homeCornersFor = homeMatchesCorners.reduce((sum, m) => sum + m.cornersFor, 0);
    const homeCornersAgainst = homeMatchesCorners.reduce((sum, m) => sum + m.cornersAgainst, 0);
    const homeTotalCorners = homeMatchesCorners.reduce((sum, m) => sum + m.totalCorners, 0);

    avg_corners_l5h = parseFloat((homeTotalCorners / homeMatchesCorners.length).toFixed(2));
    avg_corners_for_l5h = parseFloat((homeCornersFor / homeMatchesCorners.length).toFixed(2));
    avg_corners_against_l5h = parseFloat((homeCornersAgainst / homeMatchesCorners.length).toFixed(2));

    // Batch 12 - avg_match_corners is same as avg_corners
    avg_match_corners_l5h = avg_corners_l5h;

    // Batch 13/14 - 1H/2H Corners (L5 home)
    avg_1h_corners_l5h = parseFloat((homeMatchesCorners.reduce((sum, m) => sum + m.firstHalfTotalCorners, 0) / homeMatchesCorners.length).toFixed(2));
    avg_1h_corners_for_l5h = parseFloat((homeMatchesCorners.reduce((sum, m) => sum + m.firstHalfCornersFor, 0) / homeMatchesCorners.length).toFixed(2));
    avg_1h_corners_against_l5h = parseFloat((homeMatchesCorners.reduce((sum, m) => sum + m.firstHalfCornersAgainst, 0) / homeMatchesCorners.length).toFixed(2));
    avg_2h_corners_l5h = parseFloat((homeMatchesCorners.reduce((sum, m) => sum + m.secondHalfTotalCorners, 0) / homeMatchesCorners.length).toFixed(2));
    avg_2h_corners_for_l5h = parseFloat((homeMatchesCorners.reduce((sum, m) => sum + m.secondHalfCornersFor, 0) / homeMatchesCorners.length).toFixed(2));
    avg_2h_corners_against_l5h = parseFloat((homeMatchesCorners.reduce((sum, m) => sum + m.secondHalfCornersAgainst, 0) / homeMatchesCorners.length).toFixed(2));

    const homeOver10 = homeMatchesCorners.filter(m => m.totalCorners >= 10).length;
    over_10_corners_pct_l5h = parseFloat(((homeOver10 / homeMatchesCorners.length) * 100).toFixed(2));
  }

  if (awayMatchesCorners.length > 0) {
    const awayCornersFor = awayMatchesCorners.reduce((sum, m) => sum + m.cornersFor, 0);
    const awayCornersAgainst = awayMatchesCorners.reduce((sum, m) => sum + m.cornersAgainst, 0);
    const awayTotalCorners = awayMatchesCorners.reduce((sum, m) => sum + m.totalCorners, 0);

    avg_corners_l5a = parseFloat((awayTotalCorners / awayMatchesCorners.length).toFixed(2));
    avg_corners_for_l5a = parseFloat((awayCornersFor / awayMatchesCorners.length).toFixed(2));
    avg_corners_against_l5a = parseFloat((awayCornersAgainst / awayMatchesCorners.length).toFixed(2));

    // Batch 12 - avg_match_corners is same as avg_corners
    avg_match_corners_l5a = avg_corners_l5a;

    // Batch 13/14 - 1H/2H Corners (L5 away)
    avg_1h_corners_l5a = parseFloat((awayMatchesCorners.reduce((sum, m) => sum + m.firstHalfTotalCorners, 0) / awayMatchesCorners.length).toFixed(2));
    avg_1h_corners_for_l5a = parseFloat((awayMatchesCorners.reduce((sum, m) => sum + m.firstHalfCornersFor, 0) / awayMatchesCorners.length).toFixed(2));
    avg_1h_corners_against_l5a = parseFloat((awayMatchesCorners.reduce((sum, m) => sum + m.firstHalfCornersAgainst, 0) / awayMatchesCorners.length).toFixed(2));
    avg_2h_corners_l5a = parseFloat((awayMatchesCorners.reduce((sum, m) => sum + m.secondHalfTotalCorners, 0) / awayMatchesCorners.length).toFixed(2));
    avg_2h_corners_for_l5a = parseFloat((awayMatchesCorners.reduce((sum, m) => sum + m.secondHalfCornersFor, 0) / awayMatchesCorners.length).toFixed(2));
    avg_2h_corners_against_l5a = parseFloat((awayMatchesCorners.reduce((sum, m) => sum + m.secondHalfCornersAgainst, 0) / awayMatchesCorners.length).toFixed(2));

    const awayOver10 = awayMatchesCorners.filter(m => m.totalCorners >= 10).length;
    over_10_corners_pct_l5a = parseFloat(((awayOver10 / awayMatchesCorners.length) * 100).toFixed(2));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 7 - SHOTS METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  // Calculate totals for shots
  const totalShotsFor = matchScoresL5.reduce((sum, m) => sum + m.shotsFor, 0);
  const totalShotsAgainst = matchScoresL5.reduce((sum, m) => sum + m.shotsAgainst, 0);
  const totalShotsInMatches = matchScoresL5.reduce((sum, m) => sum + m.totalShots, 0);
  const totalShotsOnTargetFor = matchScoresL5.reduce((sum, m) => sum + m.shotsOnTargetFor, 0);
  const totalShotsOnTargetAgainst = matchScoresL5.reduce((sum, m) => sum + m.shotsOnTargetAgainst, 0);
  const totalShotsOnTargetInMatches = matchScoresL5.reduce((sum, m) => sum + m.totalShotsOnTarget, 0);

  // Averages (all matches)
  const avg_shots_l5 = parseFloat((totalShotsInMatches / count).toFixed(2));
  const avg_shots_for_l5 = parseFloat((totalShotsFor / count).toFixed(2));
  const avg_shots_against_l5 = parseFloat((totalShotsAgainst / count).toFixed(2));
  const avg_shots_on_target_l5 = parseFloat((totalShotsOnTargetInMatches / count).toFixed(2));
  const avg_shots_on_target_for_l5 = parseFloat((totalShotsOnTargetFor / count).toFixed(2));
  const avg_shots_on_target_against_l5 = parseFloat((totalShotsOnTargetAgainst / count).toFixed(2));

  // Percentage metrics (all matches)
  const over15ShotsCount = matchScoresL5.filter(m => m.totalShots >= 15).length;
  const over5ShotsOnTargetCount = matchScoresL5.filter(m => m.totalShotsOnTarget >= 5).length;
  const over_15_shots_pct_l5 = parseFloat(((over15ShotsCount / countL5) * 100).toFixed(2));
  const over_5_shots_on_target_pct_l5 = parseFloat(((over5ShotsOnTargetCount / countL5) * 100).toFixed(2));

  // Home/Away variants
  let avg_shots_l5h: number | null = null;
  let avg_shots_for_l5h: number | null = null;
  let avg_shots_against_l5h: number | null = null;
  let avg_shots_on_target_l5h: number | null = null;
  let avg_shots_on_target_for_l5h: number | null = null;
  let avg_shots_on_target_against_l5h: number | null = null;
  let over_15_shots_pct_l5h: number | null = null;
  let over_5_shots_on_target_pct_l5h: number | null = null;

  let avg_shots_l5a: number | null = null;
  let avg_shots_for_l5a: number | null = null;
  let avg_shots_against_l5a: number | null = null;
  let avg_shots_on_target_l5a: number | null = null;
  let avg_shots_on_target_for_l5a: number | null = null;
  let avg_shots_on_target_against_l5a: number | null = null;
  let over_15_shots_pct_l5a: number | null = null;
  let over_5_shots_on_target_pct_l5a: number | null = null;

  const homeMatchesShots = matchScoresL5.filter(m => m.location === 'home');
  const awayMatchesShots = matchScoresL5.filter(m => m.location === 'away');

  if (homeMatchesShots.length > 0) {
    const homeShotsFor = homeMatchesShots.reduce((sum, m) => sum + m.shotsFor, 0);
    const homeShotsAgainst = homeMatchesShots.reduce((sum, m) => sum + m.shotsAgainst, 0);
    const homeTotalShots = homeMatchesShots.reduce((sum, m) => sum + m.totalShots, 0);
    const homeShotsOnTargetFor = homeMatchesShots.reduce((sum, m) => sum + m.shotsOnTargetFor, 0);
    const homeShotsOnTargetAgainst = homeMatchesShots.reduce((sum, m) => sum + m.shotsOnTargetAgainst, 0);
    const homeTotalShotsOnTarget = homeMatchesShots.reduce((sum, m) => sum + m.totalShotsOnTarget, 0);

    avg_shots_l5h = parseFloat((homeTotalShots / homeMatchesShots.length).toFixed(2));
    avg_shots_for_l5h = parseFloat((homeShotsFor / homeMatchesShots.length).toFixed(2));
    avg_shots_against_l5h = parseFloat((homeShotsAgainst / homeMatchesShots.length).toFixed(2));
    avg_shots_on_target_l5h = parseFloat((homeTotalShotsOnTarget / homeMatchesShots.length).toFixed(2));
    avg_shots_on_target_for_l5h = parseFloat((homeShotsOnTargetFor / homeMatchesShots.length).toFixed(2));
    avg_shots_on_target_against_l5h = parseFloat((homeShotsOnTargetAgainst / homeMatchesShots.length).toFixed(2));

    const homeOver15 = homeMatchesShots.filter(m => m.totalShots >= 15).length;
    const homeOver5SoT = homeMatchesShots.filter(m => m.totalShotsOnTarget >= 5).length;
    over_15_shots_pct_l5h = parseFloat(((homeOver15 / homeMatchesShots.length) * 100).toFixed(2));
    over_5_shots_on_target_pct_l5h = parseFloat(((homeOver5SoT / homeMatchesShots.length) * 100).toFixed(2));
  }

  if (awayMatchesShots.length > 0) {
    const awayShotsFor = awayMatchesShots.reduce((sum, m) => sum + m.shotsFor, 0);
    const awayShotsAgainst = awayMatchesShots.reduce((sum, m) => sum + m.shotsAgainst, 0);
    const awayTotalShots = awayMatchesShots.reduce((sum, m) => sum + m.totalShots, 0);
    const awayShotsOnTargetFor = awayMatchesShots.reduce((sum, m) => sum + m.shotsOnTargetFor, 0);
    const awayShotsOnTargetAgainst = awayMatchesShots.reduce((sum, m) => sum + m.shotsOnTargetAgainst, 0);
    const awayTotalShotsOnTarget = awayMatchesShots.reduce((sum, m) => sum + m.totalShotsOnTarget, 0);

    avg_shots_l5a = parseFloat((awayTotalShots / awayMatchesShots.length).toFixed(2));
    avg_shots_for_l5a = parseFloat((awayShotsFor / awayMatchesShots.length).toFixed(2));
    avg_shots_against_l5a = parseFloat((awayShotsAgainst / awayMatchesShots.length).toFixed(2));
    avg_shots_on_target_l5a = parseFloat((awayTotalShotsOnTarget / awayMatchesShots.length).toFixed(2));
    avg_shots_on_target_for_l5a = parseFloat((awayShotsOnTargetFor / awayMatchesShots.length).toFixed(2));
    avg_shots_on_target_against_l5a = parseFloat((awayShotsOnTargetAgainst / awayMatchesShots.length).toFixed(2));

    const awayOver15 = awayMatchesShots.filter(m => m.totalShots >= 15).length;
    const awayOver5SoT = awayMatchesShots.filter(m => m.totalShotsOnTarget >= 5).length;
    over_15_shots_pct_l5a = parseFloat(((awayOver15 / awayMatchesShots.length) * 100).toFixed(2));
    over_5_shots_on_target_pct_l5a = parseFloat(((awayOver5SoT / awayMatchesShots.length) * 100).toFixed(2));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 8 - SHOTS OFF TARGET METRICS
  // ═══════════════════════════════════════════════════════════════════════════

  // Calculate totals for shots off target
  const totalShotsOffTargetFor = matchScoresL5.reduce((sum, m) => sum + m.shotsOffTargetFor, 0);
  const totalShotsOffTargetAgainst = matchScoresL5.reduce((sum, m) => sum + m.shotsOffTargetAgainst, 0);
  const totalShotsOffTargetInMatches = matchScoresL5.reduce((sum, m) => sum + m.totalShotsOffTarget, 0);

  // Averages (all matches)
  const avg_shots_off_target_l5 = parseFloat((totalShotsOffTargetInMatches / count).toFixed(2));
  const avg_shots_off_target_for_l5 = parseFloat((totalShotsOffTargetFor / count).toFixed(2));
  const avg_shots_off_target_against_l5 = parseFloat((totalShotsOffTargetAgainst / count).toFixed(2));

  // Home/Away variants
  let avg_shots_off_target_l5h: number | null = null;
  let avg_shots_off_target_for_l5h: number | null = null;
  let avg_shots_off_target_against_l5h: number | null = null;

  let avg_shots_off_target_l5a: number | null = null;
  let avg_shots_off_target_for_l5a: number | null = null;
  let avg_shots_off_target_against_l5a: number | null = null;

  const homeMatchesShotsOffTarget = matchScoresL5.filter(m => m.location === 'home');
  const awayMatchesShotsOffTarget = matchScoresL5.filter(m => m.location === 'away');

  if (homeMatchesShotsOffTarget.length > 0) {
    const homeShotsOffTargetFor = homeMatchesShotsOffTarget.reduce((sum, m) => sum + m.shotsOffTargetFor, 0);
    const homeShotsOffTargetAgainst = homeMatchesShotsOffTarget.reduce((sum, m) => sum + m.shotsOffTargetAgainst, 0);
    const homeTotalShotsOffTarget = homeMatchesShotsOffTarget.reduce((sum, m) => sum + m.totalShotsOffTarget, 0);

    avg_shots_off_target_l5h = parseFloat((homeTotalShotsOffTarget / homeMatchesShotsOffTarget.length).toFixed(2));
    avg_shots_off_target_for_l5h = parseFloat((homeShotsOffTargetFor / homeMatchesShotsOffTarget.length).toFixed(2));
    avg_shots_off_target_against_l5h = parseFloat((homeShotsOffTargetAgainst / homeMatchesShotsOffTarget.length).toFixed(2));
  }

  if (awayMatchesShotsOffTarget.length > 0) {
    const awayShotsOffTargetFor = awayMatchesShotsOffTarget.reduce((sum, m) => sum + m.shotsOffTargetFor, 0);
    const awayShotsOffTargetAgainst = awayMatchesShotsOffTarget.reduce((sum, m) => sum + m.shotsOffTargetAgainst, 0);
    const awayTotalShotsOffTarget = awayMatchesShotsOffTarget.reduce((sum, m) => sum + m.totalShotsOffTarget, 0);

    avg_shots_off_target_l5a = parseFloat((awayTotalShotsOffTarget / awayMatchesShotsOffTarget.length).toFixed(2));
    avg_shots_off_target_for_l5a = parseFloat((awayShotsOffTargetFor / awayMatchesShotsOffTarget.length).toFixed(2));
    avg_shots_off_target_against_l5a = parseFloat((awayShotsOffTargetAgainst / awayMatchesShotsOffTarget.length).toFixed(2));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH 9 - LAST 10 MATCHES
  // ═══════════════════════════════════════════════════════════════════════════

  // Initialize L10 variables
  let avg_match_goals_l10: number | null = null;
  let avg_goals_scored_l10: number | null = null;
  let avg_goals_conceded_l10: number | null = null;
  let win_pct_l10: number | null = null;
  let draw_pct_l10: number | null = null;
  let loss_pct_l10: number | null = null;
  let btts_pct_l10: number | null = null;
  let clean_sheet_pct_l10: number | null = null;
  let failed_to_score_pct_l10: number | null = null;
  let over_0_5_match_goals_pct_l10: number | null = null;
  let over_1_5_match_goals_pct_l10: number | null = null;
  let over_2_5_match_goals_pct_l10: number | null = null;
  let over_3_5_match_goals_pct_l10: number | null = null;
  let over_4_5_match_goals_pct_l10: number | null = null;
  let avg_1h_goals_l10: number | null = null;
  let avg_1h_goals_scored_l10: number | null = null;
  let avg_1h_goals_conceded_l10: number | null = null;
  let ht_win_pct_l10: number | null = null;
  let ht_draw_pct_l10: number | null = null;
  let ht_loss_pct_l10: number | null = null;
  let ht_btts_pct_l10: number | null = null;
  let over_0_5_ht_goals_pct_l10: number | null = null;
  let over_1_5_ht_goals_pct_l10: number | null = null;
  let over_2_5_ht_goals_pct_l10: number | null = null;
  let over_3_5_ht_goals_pct_l10: number | null = null;
  let over_4_5_ht_goals_pct_l10: number | null = null;
  let avg_2h_goals_l10: number | null = null;
  let avg_2h_goals_scored_l10: number | null = null;
  let avg_2h_goals_conceded_l10: number | null = null;
  let h2_win_pct_l10: number | null = null;
  let h2_draw_pct_l10: number | null = null;
  let h2_loss_pct_l10: number | null = null;
  let h2_btts_pct_l10: number | null = null;
  let over_0_5_2h_goals_pct_l10: number | null = null;
  let over_1_5_2h_goals_pct_l10: number | null = null;
  let over_2_5_2h_goals_pct_l10: number | null = null;
  let over_3_5_2h_goals_pct_l10: number | null = null;
  let over_4_5_2h_goals_pct_l10: number | null = null;
  let over_0_5_goals_scored_pct_l10: number | null = null;
  let over_1_5_goals_scored_pct_l10: number | null = null;
  let over_2_5_goals_scored_pct_l10: number | null = null;
  let over_3_5_goals_scored_pct_l10: number | null = null;
  let over_4_5_goals_scored_pct_l10: number | null = null;
  let over_0_5_goals_conceded_pct_l10: number | null = null;
  let over_1_5_goals_conceded_pct_l10: number | null = null;
  let over_2_5_goals_conceded_pct_l10: number | null = null;
  let over_3_5_goals_conceded_pct_l10: number | null = null;
  let over_4_5_goals_conceded_pct_l10: number | null = null;
  let avg_corners_l10: number | null = null;
  let avg_corners_for_l10: number | null = null;
  let avg_corners_against_l10: number | null = null;
  let over_10_corners_pct_l10: number | null = null;
  // Batch 12 - avg_match_corners L10 variants
  let avg_match_corners_l10: number | null = null;
  let avg_match_corners_l10h: number | null = null;
  let avg_match_corners_l10a: number | null = null;
  // Batch 13/14 - 1H/2H Corners L10 variants
  let avg_1h_corners_l10: number | null = null;
  let avg_1h_corners_for_l10: number | null = null;
  let avg_1h_corners_against_l10: number | null = null;
  let avg_2h_corners_l10: number | null = null;
  let avg_2h_corners_for_l10: number | null = null;
  let avg_2h_corners_against_l10: number | null = null;
  let avg_1h_corners_l10h: number | null = null;
  let avg_1h_corners_for_l10h: number | null = null;
  let avg_1h_corners_against_l10h: number | null = null;
  let avg_2h_corners_l10h: number | null = null;
  let avg_2h_corners_for_l10h: number | null = null;
  let avg_2h_corners_against_l10h: number | null = null;
  let avg_1h_corners_l10a: number | null = null;
  let avg_1h_corners_for_l10a: number | null = null;
  let avg_1h_corners_against_l10a: number | null = null;
  let avg_2h_corners_l10a: number | null = null;
  let avg_2h_corners_for_l10a: number | null = null;
  let avg_2h_corners_against_l10a: number | null = null;
  let avg_shots_l10: number | null = null;
  let avg_shots_for_l10: number | null = null;
  let avg_shots_against_l10: number | null = null;
  let avg_shots_on_target_l10: number | null = null;
  let avg_shots_on_target_for_l10: number | null = null;
  let avg_shots_on_target_against_l10: number | null = null;
  let over_15_shots_pct_l10: number | null = null;
  let over_5_shots_on_target_pct_l10: number | null = null;
  let avg_shots_off_target_l10: number | null = null;
  let avg_shots_off_target_for_l10: number | null = null;
  let avg_shots_off_target_against_l10: number | null = null;

  // L10 Home/Away variants
  let avg_match_goals_l10h: number | null = null;
  let avg_goals_scored_l10h: number | null = null;
  let avg_goals_conceded_l10h: number | null = null;
  let win_pct_l10h: number | null = null;
  let draw_pct_l10h: number | null = null;
  let loss_pct_l10h: number | null = null;
  let btts_pct_l10h: number | null = null;
  let clean_sheet_pct_l10h: number | null = null;
  let failed_to_score_pct_l10h: number | null = null;
  let over_0_5_match_goals_pct_l10h: number | null = null;
  let over_1_5_match_goals_pct_l10h: number | null = null;
  let over_2_5_match_goals_pct_l10h: number | null = null;
  let over_3_5_match_goals_pct_l10h: number | null = null;
  let over_4_5_match_goals_pct_l10h: number | null = null;
  let over_0_5_goals_scored_pct_l10h: number | null = null;
  let over_1_5_goals_scored_pct_l10h: number | null = null;
  let over_2_5_goals_scored_pct_l10h: number | null = null;
  let over_3_5_goals_scored_pct_l10h: number | null = null;
  let over_4_5_goals_scored_pct_l10h: number | null = null;
  let over_0_5_goals_conceded_pct_l10h: number | null = null;
  let over_1_5_goals_conceded_pct_l10h: number | null = null;
  let over_2_5_goals_conceded_pct_l10h: number | null = null;
  let over_3_5_goals_conceded_pct_l10h: number | null = null;
  let over_4_5_goals_conceded_pct_l10h: number | null = null;
  let avg_corners_l10h: number | null = null;
  let avg_corners_for_l10h: number | null = null;
  let avg_corners_against_l10h: number | null = null;
  let avg_shots_on_target_l10h: number | null = null;
  let avg_shots_on_target_for_l10h: number | null = null;
  let avg_shots_on_target_against_l10h: number | null = null;
  let avg_shots_off_target_l10h: number | null = null;
  let avg_shots_off_target_for_l10h: number | null = null;
  let avg_shots_off_target_against_l10h: number | null = null;

  let avg_match_goals_l10a: number | null = null;
  let avg_goals_scored_l10a: number | null = null;
  let avg_goals_conceded_l10a: number | null = null;
  let win_pct_l10a: number | null = null;
  let draw_pct_l10a: number | null = null;
  let loss_pct_l10a: number | null = null;
  let btts_pct_l10a: number | null = null;
  let clean_sheet_pct_l10a: number | null = null;
  let failed_to_score_pct_l10a: number | null = null;
  let over_0_5_match_goals_pct_l10a: number | null = null;
  let over_1_5_match_goals_pct_l10a: number | null = null;
  let over_2_5_match_goals_pct_l10a: number | null = null;
  let over_3_5_match_goals_pct_l10a: number | null = null;
  let over_4_5_match_goals_pct_l10a: number | null = null;
  let over_0_5_goals_scored_pct_l10a: number | null = null;
  let over_1_5_goals_scored_pct_l10a: number | null = null;
  let over_2_5_goals_scored_pct_l10a: number | null = null;
  let over_3_5_goals_scored_pct_l10a: number | null = null;
  let over_4_5_goals_scored_pct_l10a: number | null = null;
  let over_0_5_goals_conceded_pct_l10a: number | null = null;
  let over_1_5_goals_conceded_pct_l10a: number | null = null;
  let over_2_5_goals_conceded_pct_l10a: number | null = null;
  let over_3_5_goals_conceded_pct_l10a: number | null = null;
  let over_4_5_goals_conceded_pct_l10a: number | null = null;
  let avg_corners_l10a: number | null = null;
  let avg_corners_for_l10a: number | null = null;
  let avg_corners_against_l10a: number | null = null;
  let avg_shots_on_target_l10a: number | null = null;
  let avg_shots_on_target_for_l10a: number | null = null;
  let avg_shots_on_target_against_l10a: number | null = null;
  let avg_shots_off_target_l10a: number | null = null;
  let avg_shots_off_target_for_l10a: number | null = null;
  let avg_shots_off_target_against_l10a: number | null = null;

  // Batch 11 - 2H L10 Home/Away variants
  let h2_win_pct_l10h: number | null = null;
  let h2_draw_pct_l10h: number | null = null;
  let h2_loss_pct_l10h: number | null = null;
  let h2_btts_pct_l10h: number | null = null;
  let h2_win_pct_l10a: number | null = null;
  let h2_draw_pct_l10a: number | null = null;
  let h2_loss_pct_l10a: number | null = null;
  let h2_btts_pct_l10a: number | null = null;

  // Batch 15 - L10 Home/Away HT & 2H Goals
  let avg_1h_goals_l10h: number | null = null;
  let avg_1h_goals_scored_l10h: number | null = null;
  let avg_1h_goals_conceded_l10h: number | null = null;
  let ht_win_pct_l10h: number | null = null;
  let ht_draw_pct_l10h: number | null = null;
  let ht_loss_pct_l10h: number | null = null;
  let ht_btts_pct_l10h: number | null = null;
  let over_0_5_ht_goals_pct_l10h: number | null = null;
  let over_1_5_ht_goals_pct_l10h: number | null = null;
  let over_2_5_ht_goals_pct_l10h: number | null = null;
  let over_3_5_ht_goals_pct_l10h: number | null = null;
  let over_4_5_ht_goals_pct_l10h: number | null = null;
  let avg_2h_goals_l10h: number | null = null;
  let avg_2h_goals_scored_l10h: number | null = null;
  let avg_2h_goals_conceded_l10h: number | null = null;
  let over_0_5_2h_goals_pct_l10h: number | null = null;
  let over_1_5_2h_goals_pct_l10h: number | null = null;
  let over_2_5_2h_goals_pct_l10h: number | null = null;
  let over_3_5_2h_goals_pct_l10h: number | null = null;
  let over_4_5_2h_goals_pct_l10h: number | null = null;
  let avg_1h_goals_l10a: number | null = null;
  let avg_1h_goals_scored_l10a: number | null = null;
  let avg_1h_goals_conceded_l10a: number | null = null;
  let ht_win_pct_l10a: number | null = null;
  let ht_draw_pct_l10a: number | null = null;
  let ht_loss_pct_l10a: number | null = null;
  let ht_btts_pct_l10a: number | null = null;
  let over_0_5_ht_goals_pct_l10a: number | null = null;
  let over_1_5_ht_goals_pct_l10a: number | null = null;
  let over_2_5_ht_goals_pct_l10a: number | null = null;
  let over_3_5_ht_goals_pct_l10a: number | null = null;
  let over_4_5_ht_goals_pct_l10a: number | null = null;
  let avg_2h_goals_l10a: number | null = null;
  let avg_2h_goals_scored_l10a: number | null = null;
  let avg_2h_goals_conceded_l10a: number | null = null;
  let over_0_5_2h_goals_pct_l10a: number | null = null;
  let over_1_5_2h_goals_pct_l10a: number | null = null;
  let over_2_5_2h_goals_pct_l10a: number | null = null;
  let over_3_5_2h_goals_pct_l10a: number | null = null;
  let over_4_5_2h_goals_pct_l10a: number | null = null;

  // Only calculate L10 if we have enough matches (matchScores can have up to 40)
  if (matchScores.length >= 10) {
    const matchScoresL10 = matchScores.slice(0, 10);
    const countL10 = matchScoresL10.length;

    // Goal-based metrics
    const totalGoalsScoredL10 = matchScoresL10.reduce((sum, m) => sum + m.goalsScored, 0);
    const totalGoalsConcededL10 = matchScoresL10.reduce((sum, m) => sum + m.goalsConceded, 0);
    const totalMatchGoalsL10 = matchScoresL10.reduce((sum, m) => sum + m.totalGoals, 0);

    avg_match_goals_l10 = parseFloat((totalMatchGoalsL10 / countL10).toFixed(2));
    avg_goals_scored_l10 = parseFloat((totalGoalsScoredL10 / countL10).toFixed(2));
    avg_goals_conceded_l10 = parseFloat((totalGoalsConcededL10 / countL10).toFixed(2));

    // Win/Draw/Loss percentages
    const winsL10 = matchScoresL10.filter(m => m.isWin).length;
    const drawsL10 = matchScoresL10.filter(m => m.isDraw).length;
    const lossesL10 = matchScoresL10.filter(m => m.isLoss).length;

    win_pct_l10 = parseFloat(((winsL10 / countL10) * 100).toFixed(2));
    draw_pct_l10 = parseFloat(((drawsL10 / countL10) * 100).toFixed(2));
    loss_pct_l10 = parseFloat(((lossesL10 / countL10) * 100).toFixed(2));

    // BTTS, Clean Sheets, Failed to Score
    const bttsL10 = matchScoresL10.filter(m => m.btts).length;
    const cleanSheetsL10 = matchScoresL10.filter(m => m.cleanSheet).length;
    const failedToScoreL10 = matchScoresL10.filter(m => m.goalsScored === 0).length;

    btts_pct_l10 = parseFloat(((bttsL10 / countL10) * 100).toFixed(2));
    clean_sheet_pct_l10 = parseFloat(((cleanSheetsL10 / countL10) * 100).toFixed(2));
    failed_to_score_pct_l10 = parseFloat(((failedToScoreL10 / countL10) * 100).toFixed(2));

    // Over/Under Match Goals
    const over05L10 = matchScoresL10.filter(m => m.totalGoals >= 0.5).length;
    const over15L10 = matchScoresL10.filter(m => m.totalGoals >= 1.5).length;
    const over25L10 = matchScoresL10.filter(m => m.totalGoals >= 2.5).length;
    const over35L10 = matchScoresL10.filter(m => m.totalGoals >= 3.5).length;
    const over45L10 = matchScoresL10.filter(m => m.totalGoals >= 4.5).length;

    over_0_5_match_goals_pct_l10 = parseFloat(((over05L10 / countL10) * 100).toFixed(2));
    over_1_5_match_goals_pct_l10 = parseFloat(((over15L10 / countL10) * 100).toFixed(2));
    over_2_5_match_goals_pct_l10 = parseFloat(((over25L10 / countL10) * 100).toFixed(2));
    over_3_5_match_goals_pct_l10 = parseFloat(((over35L10 / countL10) * 100).toFixed(2));
    over_4_5_match_goals_pct_l10 = parseFloat(((over45L10 / countL10) * 100).toFixed(2));

    // Half-time metrics
    const total1hGoalsL10 = matchScoresL10.reduce((sum, m) => sum + (m.htGoalsScored + m.htGoalsConceded), 0);
    const total1hGoalsScoredL10 = matchScoresL10.reduce((sum, m) => sum + m.htGoalsScored, 0);
    const total1hGoalsConcededL10 = matchScoresL10.reduce((sum, m) => sum + m.htGoalsConceded, 0);

    avg_1h_goals_l10 = parseFloat((total1hGoalsL10 / countL10).toFixed(2));
    avg_1h_goals_scored_l10 = parseFloat((total1hGoalsScoredL10 / countL10).toFixed(2));
    avg_1h_goals_conceded_l10 = parseFloat((total1hGoalsConcededL10 / countL10).toFixed(2));

    const htWinsL10 = matchScoresL10.filter(m => m.htGoalsScored > m.htGoalsConceded).length;
    const htDrawsL10 = matchScoresL10.filter(m => m.htGoalsScored === m.htGoalsConceded).length;
    const htLossesL10 = matchScoresL10.filter(m => m.htGoalsScored < m.htGoalsConceded).length;
    const htBttsL10 = matchScoresL10.filter(m => m.htGoalsScored > 0 && m.htGoalsConceded > 0).length;

    ht_win_pct_l10 = parseFloat(((htWinsL10 / countL10) * 100).toFixed(2));
    ht_draw_pct_l10 = parseFloat(((htDrawsL10 / countL10) * 100).toFixed(2));
    ht_loss_pct_l10 = parseFloat(((htLossesL10 / countL10) * 100).toFixed(2));
    ht_btts_pct_l10 = parseFloat(((htBttsL10 / countL10) * 100).toFixed(2));

    const htOver05L10 = matchScoresL10.filter(m => (m.htGoalsScored + m.htGoalsConceded) >= 0.5).length;
    const htOver15L10 = matchScoresL10.filter(m => (m.htGoalsScored + m.htGoalsConceded) >= 1.5).length;
    const htOver25L10 = matchScoresL10.filter(m => (m.htGoalsScored + m.htGoalsConceded) >= 2.5).length;
    const htOver35L10 = matchScoresL10.filter(m => (m.htGoalsScored + m.htGoalsConceded) >= 3.5).length;
    const htOver45L10 = matchScoresL10.filter(m => (m.htGoalsScored + m.htGoalsConceded) >= 4.5).length;

    over_0_5_ht_goals_pct_l10 = parseFloat(((htOver05L10 / countL10) * 100).toFixed(2));
    over_1_5_ht_goals_pct_l10 = parseFloat(((htOver15L10 / countL10) * 100).toFixed(2));
    over_2_5_ht_goals_pct_l10 = parseFloat(((htOver25L10 / countL10) * 100).toFixed(2));
    over_3_5_ht_goals_pct_l10 = parseFloat(((htOver35L10 / countL10) * 100).toFixed(2));
    over_4_5_ht_goals_pct_l10 = parseFloat(((htOver45L10 / countL10) * 100).toFixed(2));

    // Second-half metrics
    const total2hGoalsL10 = matchScoresL10.reduce((sum, m) => sum + (m.secondHalfGoalsScored + m.secondHalfGoalsConceded), 0);
    const total2hGoalsScoredL10 = matchScoresL10.reduce((sum, m) => sum + m.secondHalfGoalsScored, 0);
    const total2hGoalsConcededL10 = matchScoresL10.reduce((sum, m) => sum + m.secondHalfGoalsConceded, 0);

    avg_2h_goals_l10 = parseFloat((total2hGoalsL10 / countL10).toFixed(2));
    avg_2h_goals_scored_l10 = parseFloat((total2hGoalsScoredL10 / countL10).toFixed(2));
    avg_2h_goals_conceded_l10 = parseFloat((total2hGoalsConcededL10 / countL10).toFixed(2));

    const h2WinsL10 = matchScoresL10.filter(m => m.secondHalfGoalsScored > m.secondHalfGoalsConceded).length;
    const h2DrawsL10 = matchScoresL10.filter(m => m.secondHalfGoalsScored === m.secondHalfGoalsConceded).length;
    const h2LossesL10 = matchScoresL10.filter(m => m.secondHalfGoalsScored < m.secondHalfGoalsConceded).length;
    const h2BttsL10 = matchScoresL10.filter(m => m.secondHalfGoalsScored > 0 && m.secondHalfGoalsConceded > 0).length;

    h2_win_pct_l10 = parseFloat(((h2WinsL10 / countL10) * 100).toFixed(2));
    h2_draw_pct_l10 = parseFloat(((h2DrawsL10 / countL10) * 100).toFixed(2));
    h2_loss_pct_l10 = parseFloat(((h2LossesL10 / countL10) * 100).toFixed(2));
    h2_btts_pct_l10 = parseFloat(((h2BttsL10 / countL10) * 100).toFixed(2));

    const h2Over05L10 = matchScoresL10.filter(m => (m.secondHalfGoalsScored + m.secondHalfGoalsConceded) >= 0.5).length;
    const h2Over15L10 = matchScoresL10.filter(m => (m.secondHalfGoalsScored + m.secondHalfGoalsConceded) >= 1.5).length;
    const h2Over25L10 = matchScoresL10.filter(m => (m.secondHalfGoalsScored + m.secondHalfGoalsConceded) >= 2.5).length;
    const h2Over35L10 = matchScoresL10.filter(m => (m.secondHalfGoalsScored + m.secondHalfGoalsConceded) >= 3.5).length;
    const h2Over45L10 = matchScoresL10.filter(m => (m.secondHalfGoalsScored + m.secondHalfGoalsConceded) >= 4.5).length;

    over_0_5_2h_goals_pct_l10 = parseFloat(((h2Over05L10 / countL10) * 100).toFixed(2));
    over_1_5_2h_goals_pct_l10 = parseFloat(((h2Over15L10 / countL10) * 100).toFixed(2));
    over_2_5_2h_goals_pct_l10 = parseFloat(((h2Over25L10 / countL10) * 100).toFixed(2));
    over_3_5_2h_goals_pct_l10 = parseFloat(((h2Over35L10 / countL10) * 100).toFixed(2));
    over_4_5_2h_goals_pct_l10 = parseFloat(((h2Over45L10 / countL10) * 100).toFixed(2));

    // Over/Under Goals Scored
    const overSc05L10 = matchScoresL10.filter(m => m.goalsScored >= 0.5).length;
    const overSc15L10 = matchScoresL10.filter(m => m.goalsScored >= 1.5).length;
    const overSc25L10 = matchScoresL10.filter(m => m.goalsScored >= 2.5).length;
    const overSc35L10 = matchScoresL10.filter(m => m.goalsScored >= 3.5).length;
    const overSc45L10 = matchScoresL10.filter(m => m.goalsScored >= 4.5).length;

    over_0_5_goals_scored_pct_l10 = parseFloat(((overSc05L10 / countL10) * 100).toFixed(2));
    over_1_5_goals_scored_pct_l10 = parseFloat(((overSc15L10 / countL10) * 100).toFixed(2));
    over_2_5_goals_scored_pct_l10 = parseFloat(((overSc25L10 / countL10) * 100).toFixed(2));
    over_3_5_goals_scored_pct_l10 = parseFloat(((overSc35L10 / countL10) * 100).toFixed(2));
    over_4_5_goals_scored_pct_l10 = parseFloat(((overSc45L10 / countL10) * 100).toFixed(2));

    // Over/Under Goals Conceded
    const overConc05L10 = matchScoresL10.filter(m => m.goalsConceded >= 0.5).length;
    const overConc15L10 = matchScoresL10.filter(m => m.goalsConceded >= 1.5).length;
    const overConc25L10 = matchScoresL10.filter(m => m.goalsConceded >= 2.5).length;
    const overConc35L10 = matchScoresL10.filter(m => m.goalsConceded >= 3.5).length;
    const overConc45L10 = matchScoresL10.filter(m => m.goalsConceded >= 4.5).length;

    over_0_5_goals_conceded_pct_l10 = parseFloat(((overConc05L10 / countL10) * 100).toFixed(2));
    over_1_5_goals_conceded_pct_l10 = parseFloat(((overConc15L10 / countL10) * 100).toFixed(2));
    over_2_5_goals_conceded_pct_l10 = parseFloat(((overConc25L10 / countL10) * 100).toFixed(2));
    over_3_5_goals_conceded_pct_l10 = parseFloat(((overConc35L10 / countL10) * 100).toFixed(2));
    over_4_5_goals_conceded_pct_l10 = parseFloat(((overConc45L10 / countL10) * 100).toFixed(2));

    // Corners
    const totalCornersForL10 = matchScoresL10.reduce((sum, m) => sum + m.cornersFor, 0);
    const totalCornersAgainstL10 = matchScoresL10.reduce((sum, m) => sum + m.cornersAgainst, 0);
    const totalCornersL10 = matchScoresL10.reduce((sum, m) => sum + m.totalCorners, 0);

    avg_corners_l10 = parseFloat((totalCornersL10 / countL10).toFixed(2));
    avg_corners_for_l10 = parseFloat((totalCornersForL10 / countL10).toFixed(2));
    avg_corners_against_l10 = parseFloat((totalCornersAgainstL10 / countL10).toFixed(2));

    // Batch 12 - avg_match_corners is same as avg_corners
    avg_match_corners_l10 = avg_corners_l10;

    // Batch 13/14 - 1H/2H Corners (L10 all matches)
    avg_1h_corners_l10 = parseFloat((matchScoresL10.reduce((sum, m) => sum + m.firstHalfTotalCorners, 0) / countL10).toFixed(2));
    avg_1h_corners_for_l10 = parseFloat((matchScoresL10.reduce((sum, m) => sum + m.firstHalfCornersFor, 0) / countL10).toFixed(2));
    avg_1h_corners_against_l10 = parseFloat((matchScoresL10.reduce((sum, m) => sum + m.firstHalfCornersAgainst, 0) / countL10).toFixed(2));
    avg_2h_corners_l10 = parseFloat((matchScoresL10.reduce((sum, m) => sum + m.secondHalfTotalCorners, 0) / countL10).toFixed(2));
    avg_2h_corners_for_l10 = parseFloat((matchScoresL10.reduce((sum, m) => sum + m.secondHalfCornersFor, 0) / countL10).toFixed(2));
    avg_2h_corners_against_l10 = parseFloat((matchScoresL10.reduce((sum, m) => sum + m.secondHalfCornersAgainst, 0) / countL10).toFixed(2));

    const over10CornersL10 = matchScoresL10.filter(m => m.totalCorners >= 10).length;
    over_10_corners_pct_l10 = parseFloat(((over10CornersL10 / countL10) * 100).toFixed(2));

    // Shots
    const totalShotsForL10 = matchScoresL10.reduce((sum, m) => sum + m.shotsFor, 0);
    const totalShotsAgainstL10 = matchScoresL10.reduce((sum, m) => sum + m.shotsAgainst, 0);
    const totalShotsL10 = matchScoresL10.reduce((sum, m) => sum + m.totalShots, 0);
    const totalShotsOnTargetForL10 = matchScoresL10.reduce((sum, m) => sum + m.shotsOnTargetFor, 0);
    const totalShotsOnTargetAgainstL10 = matchScoresL10.reduce((sum, m) => sum + m.shotsOnTargetAgainst, 0);
    const totalShotsOnTargetL10 = matchScoresL10.reduce((sum, m) => sum + m.totalShotsOnTarget, 0);

    avg_shots_l10 = parseFloat((totalShotsL10 / countL10).toFixed(2));
    avg_shots_for_l10 = parseFloat((totalShotsForL10 / countL10).toFixed(2));
    avg_shots_against_l10 = parseFloat((totalShotsAgainstL10 / countL10).toFixed(2));
    avg_shots_on_target_l10 = parseFloat((totalShotsOnTargetL10 / countL10).toFixed(2));
    avg_shots_on_target_for_l10 = parseFloat((totalShotsOnTargetForL10 / countL10).toFixed(2));
    avg_shots_on_target_against_l10 = parseFloat((totalShotsOnTargetAgainstL10 / countL10).toFixed(2));

    const over15ShotsL10 = matchScoresL10.filter(m => m.totalShots >= 15).length;
    const over5SoTL10 = matchScoresL10.filter(m => m.totalShotsOnTarget >= 5).length;

    over_15_shots_pct_l10 = parseFloat(((over15ShotsL10 / countL10) * 100).toFixed(2));
    over_5_shots_on_target_pct_l10 = parseFloat(((over5SoTL10 / countL10) * 100).toFixed(2));

    // Shots Off Target
    const totalShotsOffTargetForL10 = matchScoresL10.reduce((sum, m) => sum + m.shotsOffTargetFor, 0);
    const totalShotsOffTargetAgainstL10 = matchScoresL10.reduce((sum, m) => sum + m.shotsOffTargetAgainst, 0);
    const totalShotsOffTargetL10 = matchScoresL10.reduce((sum, m) => sum + m.totalShotsOffTarget, 0);

    avg_shots_off_target_l10 = parseFloat((totalShotsOffTargetL10 / countL10).toFixed(2));
    avg_shots_off_target_for_l10 = parseFloat((totalShotsOffTargetForL10 / countL10).toFixed(2));
    avg_shots_off_target_against_l10 = parseFloat((totalShotsOffTargetAgainstL10 / countL10).toFixed(2));

    // ═══════════════════════════════════════════════════════════════════════════
    // BATCH 10 - LAST 10 MATCHES HOME/AWAY VARIANTS
    // ═══════════════════════════════════════════════════════════════════════════

    // Filter L10 matches by location
    const homeMatchesL10 = matchScoresL10.filter(m => m.location === 'home');
    const awayMatchesL10 = matchScoresL10.filter(m => m.location === 'away');

    // HOME VARIANTS (L10H)
    if (homeMatchesL10.length > 0) {
      const countH = homeMatchesL10.length;

      // Goals
      const totalGoalsScoredH = homeMatchesL10.reduce((sum, m) => sum + m.goalsScored, 0);
      const totalGoalsConcededH = homeMatchesL10.reduce((sum, m) => sum + m.goalsConceded, 0);
      const totalMatchGoalsH = homeMatchesL10.reduce((sum, m) => sum + m.totalGoals, 0);

      avg_match_goals_l10h = parseFloat((totalMatchGoalsH / countH).toFixed(2));
      avg_goals_scored_l10h = parseFloat((totalGoalsScoredH / countH).toFixed(2));
      avg_goals_conceded_l10h = parseFloat((totalGoalsConcededH / countH).toFixed(2));

      // Results
      const winsH = homeMatchesL10.filter(m => m.isWin).length;
      const drawsH = homeMatchesL10.filter(m => m.isDraw).length;
      const lossesH = homeMatchesL10.filter(m => m.isLoss).length;

      win_pct_l10h = parseFloat(((winsH / countH) * 100).toFixed(2));
      draw_pct_l10h = parseFloat(((drawsH / countH) * 100).toFixed(2));
      loss_pct_l10h = parseFloat(((lossesH / countH) * 100).toFixed(2));

      // BTTS, Clean Sheets, Failed to Score
      const bttsH = homeMatchesL10.filter(m => m.btts).length;
      const cleanSheetsH = homeMatchesL10.filter(m => m.cleanSheet).length;
      const failedToScoreH = homeMatchesL10.filter(m => m.goalsScored === 0).length;

      btts_pct_l10h = parseFloat(((bttsH / countH) * 100).toFixed(2));
      clean_sheet_pct_l10h = parseFloat(((cleanSheetsH / countH) * 100).toFixed(2));
      failed_to_score_pct_l10h = parseFloat(((failedToScoreH / countH) * 100).toFixed(2));

      // Over/Under Match Goals
      const over05H = homeMatchesL10.filter(m => m.totalGoals >= 0.5).length;
      const over15H = homeMatchesL10.filter(m => m.totalGoals >= 1.5).length;
      const over25H = homeMatchesL10.filter(m => m.totalGoals >= 2.5).length;
      const over35H = homeMatchesL10.filter(m => m.totalGoals >= 3.5).length;
      const over45H = homeMatchesL10.filter(m => m.totalGoals >= 4.5).length;

      over_0_5_match_goals_pct_l10h = parseFloat(((over05H / countH) * 100).toFixed(2));
      over_1_5_match_goals_pct_l10h = parseFloat(((over15H / countH) * 100).toFixed(2));
      over_2_5_match_goals_pct_l10h = parseFloat(((over25H / countH) * 100).toFixed(2));
      over_3_5_match_goals_pct_l10h = parseFloat(((over35H / countH) * 100).toFixed(2));
      over_4_5_match_goals_pct_l10h = parseFloat(((over45H / countH) * 100).toFixed(2));

      // Over/Under Goals Scored
      const overSc05H = homeMatchesL10.filter(m => m.goalsScored >= 0.5).length;
      const overSc15H = homeMatchesL10.filter(m => m.goalsScored >= 1.5).length;
      const overSc25H = homeMatchesL10.filter(m => m.goalsScored >= 2.5).length;
      const overSc35H = homeMatchesL10.filter(m => m.goalsScored >= 3.5).length;
      const overSc45H = homeMatchesL10.filter(m => m.goalsScored >= 4.5).length;

      over_0_5_goals_scored_pct_l10h = parseFloat(((overSc05H / countH) * 100).toFixed(2));
      over_1_5_goals_scored_pct_l10h = parseFloat(((overSc15H / countH) * 100).toFixed(2));
      over_2_5_goals_scored_pct_l10h = parseFloat(((overSc25H / countH) * 100).toFixed(2));
      over_3_5_goals_scored_pct_l10h = parseFloat(((overSc35H / countH) * 100).toFixed(2));
      over_4_5_goals_scored_pct_l10h = parseFloat(((overSc45H / countH) * 100).toFixed(2));

      // Over/Under Goals Conceded
      const overConc05H = homeMatchesL10.filter(m => m.goalsConceded >= 0.5).length;
      const overConc15H = homeMatchesL10.filter(m => m.goalsConceded >= 1.5).length;
      const overConc25H = homeMatchesL10.filter(m => m.goalsConceded >= 2.5).length;
      const overConc35H = homeMatchesL10.filter(m => m.goalsConceded >= 3.5).length;
      const overConc45H = homeMatchesL10.filter(m => m.goalsConceded >= 4.5).length;

      over_0_5_goals_conceded_pct_l10h = parseFloat(((overConc05H / countH) * 100).toFixed(2));
      over_1_5_goals_conceded_pct_l10h = parseFloat(((overConc15H / countH) * 100).toFixed(2));
      over_2_5_goals_conceded_pct_l10h = parseFloat(((overConc25H / countH) * 100).toFixed(2));
      over_3_5_goals_conceded_pct_l10h = parseFloat(((overConc35H / countH) * 100).toFixed(2));
      over_4_5_goals_conceded_pct_l10h = parseFloat(((overConc45H / countH) * 100).toFixed(2));

      // Corners
      const totalCornersForH = homeMatchesL10.reduce((sum, m) => sum + m.cornersFor, 0);
      const totalCornersAgainstH = homeMatchesL10.reduce((sum, m) => sum + m.cornersAgainst, 0);
      const totalCornersH = homeMatchesL10.reduce((sum, m) => sum + m.totalCorners, 0);

      avg_corners_l10h = parseFloat((totalCornersH / countH).toFixed(2));
      avg_corners_for_l10h = parseFloat((totalCornersForH / countH).toFixed(2));
      avg_corners_against_l10h = parseFloat((totalCornersAgainstH / countH).toFixed(2));

      // Batch 12 - avg_match_corners is same as avg_corners
      avg_match_corners_l10h = avg_corners_l10h;

      // Batch 13/14 - 1H/2H Corners (L10 home)
      avg_1h_corners_l10h = parseFloat((homeMatchesL10.reduce((sum, m) => sum + m.firstHalfTotalCorners, 0) / countH).toFixed(2));
      avg_1h_corners_for_l10h = parseFloat((homeMatchesL10.reduce((sum, m) => sum + m.firstHalfCornersFor, 0) / countH).toFixed(2));
      avg_1h_corners_against_l10h = parseFloat((homeMatchesL10.reduce((sum, m) => sum + m.firstHalfCornersAgainst, 0) / countH).toFixed(2));
      avg_2h_corners_l10h = parseFloat((homeMatchesL10.reduce((sum, m) => sum + m.secondHalfTotalCorners, 0) / countH).toFixed(2));
      avg_2h_corners_for_l10h = parseFloat((homeMatchesL10.reduce((sum, m) => sum + m.secondHalfCornersFor, 0) / countH).toFixed(2));
      avg_2h_corners_against_l10h = parseFloat((homeMatchesL10.reduce((sum, m) => sum + m.secondHalfCornersAgainst, 0) / countH).toFixed(2));

      // Shots on target
      const totalShotsOnTargetForH = homeMatchesL10.reduce((sum, m) => sum + m.shotsOnTargetFor, 0);
      const totalShotsOnTargetAgainstH = homeMatchesL10.reduce((sum, m) => sum + m.shotsOnTargetAgainst, 0);
      const totalShotsOnTargetH = homeMatchesL10.reduce((sum, m) => sum + m.totalShotsOnTarget, 0);

      avg_shots_on_target_l10h = parseFloat((totalShotsOnTargetH / countH).toFixed(2));
      avg_shots_on_target_for_l10h = parseFloat((totalShotsOnTargetForH / countH).toFixed(2));
      avg_shots_on_target_against_l10h = parseFloat((totalShotsOnTargetAgainstH / countH).toFixed(2));

      // Shots off target
      const totalShotsOffTargetForH = homeMatchesL10.reduce((sum, m) => sum + m.shotsOffTargetFor, 0);
      const totalShotsOffTargetAgainstH = homeMatchesL10.reduce((sum, m) => sum + m.shotsOffTargetAgainst, 0);
      const totalShotsOffTargetH = homeMatchesL10.reduce((sum, m) => sum + m.totalShotsOffTarget, 0);

      avg_shots_off_target_l10h = parseFloat((totalShotsOffTargetH / countH).toFixed(2));
      avg_shots_off_target_for_l10h = parseFloat((totalShotsOffTargetForH / countH).toFixed(2));
      avg_shots_off_target_against_l10h = parseFloat((totalShotsOffTargetAgainstH / countH).toFixed(2));

      // 2H Results (Batch 11)
      const h2WinsH = homeMatchesL10.filter(m => m.secondHalfGoalsScored > m.secondHalfGoalsConceded).length;
      const h2DrawsH = homeMatchesL10.filter(m => m.secondHalfGoalsScored === m.secondHalfGoalsConceded).length;
      const h2LossesH = homeMatchesL10.filter(m => m.secondHalfGoalsScored < m.secondHalfGoalsConceded).length;
      const h2BttsH = homeMatchesL10.filter(m => m.secondHalfGoalsScored > 0 && m.secondHalfGoalsConceded > 0).length;

      h2_win_pct_l10h = parseFloat(((h2WinsH / countH) * 100).toFixed(2));
      h2_draw_pct_l10h = parseFloat(((h2DrawsH / countH) * 100).toFixed(2));
      h2_loss_pct_l10h = parseFloat(((h2LossesH / countH) * 100).toFixed(2));
      h2_btts_pct_l10h = parseFloat(((h2BttsH / countH) * 100).toFixed(2));

      // Batch 15 - Half Time metrics (L10 Home)
      const htGoalsH = homeMatchesL10.reduce((sum, m) => sum + m.htTotalGoals, 0);
      const htGoalsScoredH = homeMatchesL10.reduce((sum, m) => sum + m.htGoalsScored, 0);
      const htGoalsConcededH = homeMatchesL10.reduce((sum, m) => sum + m.htGoalsConceded, 0);

      avg_1h_goals_l10h = parseFloat((htGoalsH / countH).toFixed(2));
      avg_1h_goals_scored_l10h = parseFloat((htGoalsScoredH / countH).toFixed(2));
      avg_1h_goals_conceded_l10h = parseFloat((htGoalsConcededH / countH).toFixed(2));

      const htWinsH = homeMatchesL10.filter(m => m.htGoalsScored > m.htGoalsConceded).length;
      const htDrawsH = homeMatchesL10.filter(m => m.htGoalsScored === m.htGoalsConceded).length;
      const htLossesH = homeMatchesL10.filter(m => m.htGoalsScored < m.htGoalsConceded).length;
      const htBttsH = homeMatchesL10.filter(m => m.htGoalsScored > 0 && m.htGoalsConceded > 0).length;

      ht_win_pct_l10h = parseFloat(((htWinsH / countH) * 100).toFixed(2));
      ht_draw_pct_l10h = parseFloat(((htDrawsH / countH) * 100).toFixed(2));
      ht_loss_pct_l10h = parseFloat(((htLossesH / countH) * 100).toFixed(2));
      ht_btts_pct_l10h = parseFloat(((htBttsH / countH) * 100).toFixed(2));

      const htOver05H = homeMatchesL10.filter(m => m.htTotalGoals >= 0.5).length;
      const htOver15H = homeMatchesL10.filter(m => m.htTotalGoals >= 1.5).length;
      const htOver25H = homeMatchesL10.filter(m => m.htTotalGoals >= 2.5).length;
      const htOver35H = homeMatchesL10.filter(m => m.htTotalGoals >= 3.5).length;
      const htOver45H = homeMatchesL10.filter(m => m.htTotalGoals >= 4.5).length;

      over_0_5_ht_goals_pct_l10h = parseFloat(((htOver05H / countH) * 100).toFixed(2));
      over_1_5_ht_goals_pct_l10h = parseFloat(((htOver15H / countH) * 100).toFixed(2));
      over_2_5_ht_goals_pct_l10h = parseFloat(((htOver25H / countH) * 100).toFixed(2));
      over_3_5_ht_goals_pct_l10h = parseFloat(((htOver35H / countH) * 100).toFixed(2));
      over_4_5_ht_goals_pct_l10h = parseFloat(((htOver45H / countH) * 100).toFixed(2));

      // Batch 15 - Second Half metrics (L10 Home)
      const shGoalsH = homeMatchesL10.reduce((sum, m) => sum + m.secondHalfTotalGoals, 0);
      const shGoalsScoredH = homeMatchesL10.reduce((sum, m) => sum + m.secondHalfGoalsScored, 0);
      const shGoalsConcededH = homeMatchesL10.reduce((sum, m) => sum + m.secondHalfGoalsConceded, 0);

      avg_2h_goals_l10h = parseFloat((shGoalsH / countH).toFixed(2));
      avg_2h_goals_scored_l10h = parseFloat((shGoalsScoredH / countH).toFixed(2));
      avg_2h_goals_conceded_l10h = parseFloat((shGoalsConcededH / countH).toFixed(2));

      const shOver05H = homeMatchesL10.filter(m => m.secondHalfTotalGoals >= 0.5).length;
      const shOver15H = homeMatchesL10.filter(m => m.secondHalfTotalGoals >= 1.5).length;
      const shOver25H = homeMatchesL10.filter(m => m.secondHalfTotalGoals >= 2.5).length;
      const shOver35H = homeMatchesL10.filter(m => m.secondHalfTotalGoals >= 3.5).length;
      const shOver45H = homeMatchesL10.filter(m => m.secondHalfTotalGoals >= 4.5).length;

      over_0_5_2h_goals_pct_l10h = parseFloat(((shOver05H / countH) * 100).toFixed(2));
      over_1_5_2h_goals_pct_l10h = parseFloat(((shOver15H / countH) * 100).toFixed(2));
      over_2_5_2h_goals_pct_l10h = parseFloat(((shOver25H / countH) * 100).toFixed(2));
      over_3_5_2h_goals_pct_l10h = parseFloat(((shOver35H / countH) * 100).toFixed(2));
      over_4_5_2h_goals_pct_l10h = parseFloat(((shOver45H / countH) * 100).toFixed(2));
    }

    // AWAY VARIANTS (L10A)
    if (awayMatchesL10.length > 0) {
      const countA = awayMatchesL10.length;

      // Goals
      const totalGoalsScoredA = awayMatchesL10.reduce((sum, m) => sum + m.goalsScored, 0);
      const totalGoalsConcededA = awayMatchesL10.reduce((sum, m) => sum + m.goalsConceded, 0);
      const totalMatchGoalsA = awayMatchesL10.reduce((sum, m) => sum + m.totalGoals, 0);

      avg_match_goals_l10a = parseFloat((totalMatchGoalsA / countA).toFixed(2));
      avg_goals_scored_l10a = parseFloat((totalGoalsScoredA / countA).toFixed(2));
      avg_goals_conceded_l10a = parseFloat((totalGoalsConcededA / countA).toFixed(2));

      // Results
      const winsA = awayMatchesL10.filter(m => m.isWin).length;
      const drawsA = awayMatchesL10.filter(m => m.isDraw).length;
      const lossesA = awayMatchesL10.filter(m => m.isLoss).length;

      win_pct_l10a = parseFloat(((winsA / countA) * 100).toFixed(2));
      draw_pct_l10a = parseFloat(((drawsA / countA) * 100).toFixed(2));
      loss_pct_l10a = parseFloat(((lossesA / countA) * 100).toFixed(2));

      // BTTS, Clean Sheets, Failed to Score
      const bttsA = awayMatchesL10.filter(m => m.btts).length;
      const cleanSheetsA = awayMatchesL10.filter(m => m.cleanSheet).length;
      const failedToScoreA = awayMatchesL10.filter(m => m.goalsScored === 0).length;

      btts_pct_l10a = parseFloat(((bttsA / countA) * 100).toFixed(2));
      clean_sheet_pct_l10a = parseFloat(((cleanSheetsA / countA) * 100).toFixed(2));
      failed_to_score_pct_l10a = parseFloat(((failedToScoreA / countA) * 100).toFixed(2));

      // Over/Under Match Goals
      const over05A = awayMatchesL10.filter(m => m.totalGoals >= 0.5).length;
      const over15A = awayMatchesL10.filter(m => m.totalGoals >= 1.5).length;
      const over25A = awayMatchesL10.filter(m => m.totalGoals >= 2.5).length;
      const over35A = awayMatchesL10.filter(m => m.totalGoals >= 3.5).length;
      const over45A = awayMatchesL10.filter(m => m.totalGoals >= 4.5).length;

      over_0_5_match_goals_pct_l10a = parseFloat(((over05A / countA) * 100).toFixed(2));
      over_1_5_match_goals_pct_l10a = parseFloat(((over15A / countA) * 100).toFixed(2));
      over_2_5_match_goals_pct_l10a = parseFloat(((over25A / countA) * 100).toFixed(2));
      over_3_5_match_goals_pct_l10a = parseFloat(((over35A / countA) * 100).toFixed(2));
      over_4_5_match_goals_pct_l10a = parseFloat(((over45A / countA) * 100).toFixed(2));

      // Over/Under Goals Scored
      const overSc05A = awayMatchesL10.filter(m => m.goalsScored >= 0.5).length;
      const overSc15A = awayMatchesL10.filter(m => m.goalsScored >= 1.5).length;
      const overSc25A = awayMatchesL10.filter(m => m.goalsScored >= 2.5).length;
      const overSc35A = awayMatchesL10.filter(m => m.goalsScored >= 3.5).length;
      const overSc45A = awayMatchesL10.filter(m => m.goalsScored >= 4.5).length;

      over_0_5_goals_scored_pct_l10a = parseFloat(((overSc05A / countA) * 100).toFixed(2));
      over_1_5_goals_scored_pct_l10a = parseFloat(((overSc15A / countA) * 100).toFixed(2));
      over_2_5_goals_scored_pct_l10a = parseFloat(((overSc25A / countA) * 100).toFixed(2));
      over_3_5_goals_scored_pct_l10a = parseFloat(((overSc35A / countA) * 100).toFixed(2));
      over_4_5_goals_scored_pct_l10a = parseFloat(((overSc45A / countA) * 100).toFixed(2));

      // Over/Under Goals Conceded
      const overConc05A = awayMatchesL10.filter(m => m.goalsConceded >= 0.5).length;
      const overConc15A = awayMatchesL10.filter(m => m.goalsConceded >= 1.5).length;
      const overConc25A = awayMatchesL10.filter(m => m.goalsConceded >= 2.5).length;
      const overConc35A = awayMatchesL10.filter(m => m.goalsConceded >= 3.5).length;
      const overConc45A = awayMatchesL10.filter(m => m.goalsConceded >= 4.5).length;

      over_0_5_goals_conceded_pct_l10a = parseFloat(((overConc05A / countA) * 100).toFixed(2));
      over_1_5_goals_conceded_pct_l10a = parseFloat(((overConc15A / countA) * 100).toFixed(2));
      over_2_5_goals_conceded_pct_l10a = parseFloat(((overConc25A / countA) * 100).toFixed(2));
      over_3_5_goals_conceded_pct_l10a = parseFloat(((overConc35A / countA) * 100).toFixed(2));
      over_4_5_goals_conceded_pct_l10a = parseFloat(((overConc45A / countA) * 100).toFixed(2));

      // Corners
      const totalCornersForA = awayMatchesL10.reduce((sum, m) => sum + m.cornersFor, 0);
      const totalCornersAgainstA = awayMatchesL10.reduce((sum, m) => sum + m.cornersAgainst, 0);
      const totalCornersA = awayMatchesL10.reduce((sum, m) => sum + m.totalCorners, 0);

      avg_corners_l10a = parseFloat((totalCornersA / countA).toFixed(2));
      avg_corners_for_l10a = parseFloat((totalCornersForA / countA).toFixed(2));
      avg_corners_against_l10a = parseFloat((totalCornersAgainstA / countA).toFixed(2));

      // Batch 12 - avg_match_corners is same as avg_corners
      avg_match_corners_l10a = avg_corners_l10a;

      // Batch 13/14 - 1H/2H Corners (L10 away)
      avg_1h_corners_l10a = parseFloat((awayMatchesL10.reduce((sum, m) => sum + m.firstHalfTotalCorners, 0) / countA).toFixed(2));
      avg_1h_corners_for_l10a = parseFloat((awayMatchesL10.reduce((sum, m) => sum + m.firstHalfCornersFor, 0) / countA).toFixed(2));
      avg_1h_corners_against_l10a = parseFloat((awayMatchesL10.reduce((sum, m) => sum + m.firstHalfCornersAgainst, 0) / countA).toFixed(2));
      avg_2h_corners_l10a = parseFloat((awayMatchesL10.reduce((sum, m) => sum + m.secondHalfTotalCorners, 0) / countA).toFixed(2));
      avg_2h_corners_for_l10a = parseFloat((awayMatchesL10.reduce((sum, m) => sum + m.secondHalfCornersFor, 0) / countA).toFixed(2));
      avg_2h_corners_against_l10a = parseFloat((awayMatchesL10.reduce((sum, m) => sum + m.secondHalfCornersAgainst, 0) / countA).toFixed(2));

      // Shots on target
      const totalShotsOnTargetForA = awayMatchesL10.reduce((sum, m) => sum + m.shotsOnTargetFor, 0);
      const totalShotsOnTargetAgainstA = awayMatchesL10.reduce((sum, m) => sum + m.shotsOnTargetAgainst, 0);
      const totalShotsOnTargetA = awayMatchesL10.reduce((sum, m) => sum + m.totalShotsOnTarget, 0);

      avg_shots_on_target_l10a = parseFloat((totalShotsOnTargetA / countA).toFixed(2));
      avg_shots_on_target_for_l10a = parseFloat((totalShotsOnTargetForA / countA).toFixed(2));
      avg_shots_on_target_against_l10a = parseFloat((totalShotsOnTargetAgainstA / countA).toFixed(2));

      // Shots off target
      const totalShotsOffTargetForA = awayMatchesL10.reduce((sum, m) => sum + m.shotsOffTargetFor, 0);
      const totalShotsOffTargetAgainstA = awayMatchesL10.reduce((sum, m) => sum + m.shotsOffTargetAgainst, 0);
      const totalShotsOffTargetA = awayMatchesL10.reduce((sum, m) => sum + m.totalShotsOffTarget, 0);

      avg_shots_off_target_l10a = parseFloat((totalShotsOffTargetA / countA).toFixed(2));
      avg_shots_off_target_for_l10a = parseFloat((totalShotsOffTargetForA / countA).toFixed(2));
      avg_shots_off_target_against_l10a = parseFloat((totalShotsOffTargetAgainstA / countA).toFixed(2));

      // 2H Results (Batch 11)
      const h2WinsA = awayMatchesL10.filter(m => m.secondHalfGoalsScored > m.secondHalfGoalsConceded).length;
      const h2DrawsA = awayMatchesL10.filter(m => m.secondHalfGoalsScored === m.secondHalfGoalsConceded).length;
      const h2LossesA = awayMatchesL10.filter(m => m.secondHalfGoalsScored < m.secondHalfGoalsConceded).length;
      const h2BttsA = awayMatchesL10.filter(m => m.secondHalfGoalsScored > 0 && m.secondHalfGoalsConceded > 0).length;

      h2_win_pct_l10a = parseFloat(((h2WinsA / countA) * 100).toFixed(2));
      h2_draw_pct_l10a = parseFloat(((h2DrawsA / countA) * 100).toFixed(2));
      h2_loss_pct_l10a = parseFloat(((h2LossesA / countA) * 100).toFixed(2));
      h2_btts_pct_l10a = parseFloat(((h2BttsA / countA) * 100).toFixed(2));

      // Batch 15 - Half Time metrics (L10 Away)
      const htGoalsA = awayMatchesL10.reduce((sum, m) => sum + m.htTotalGoals, 0);
      const htGoalsScoredA = awayMatchesL10.reduce((sum, m) => sum + m.htGoalsScored, 0);
      const htGoalsConcededA = awayMatchesL10.reduce((sum, m) => sum + m.htGoalsConceded, 0);

      avg_1h_goals_l10a = parseFloat((htGoalsA / countA).toFixed(2));
      avg_1h_goals_scored_l10a = parseFloat((htGoalsScoredA / countA).toFixed(2));
      avg_1h_goals_conceded_l10a = parseFloat((htGoalsConcededA / countA).toFixed(2));

      const htWinsA = awayMatchesL10.filter(m => m.htGoalsScored > m.htGoalsConceded).length;
      const htDrawsA = awayMatchesL10.filter(m => m.htGoalsScored === m.htGoalsConceded).length;
      const htLossesA = awayMatchesL10.filter(m => m.htGoalsScored < m.htGoalsConceded).length;
      const htBttsA = awayMatchesL10.filter(m => m.htGoalsScored > 0 && m.htGoalsConceded > 0).length;

      ht_win_pct_l10a = parseFloat(((htWinsA / countA) * 100).toFixed(2));
      ht_draw_pct_l10a = parseFloat(((htDrawsA / countA) * 100).toFixed(2));
      ht_loss_pct_l10a = parseFloat(((htLossesA / countA) * 100).toFixed(2));
      ht_btts_pct_l10a = parseFloat(((htBttsA / countA) * 100).toFixed(2));

      const htOver05A = awayMatchesL10.filter(m => m.htTotalGoals >= 0.5).length;
      const htOver15A = awayMatchesL10.filter(m => m.htTotalGoals >= 1.5).length;
      const htOver25A = awayMatchesL10.filter(m => m.htTotalGoals >= 2.5).length;
      const htOver35A = awayMatchesL10.filter(m => m.htTotalGoals >= 3.5).length;
      const htOver45A = awayMatchesL10.filter(m => m.htTotalGoals >= 4.5).length;

      over_0_5_ht_goals_pct_l10a = parseFloat(((htOver05A / countA) * 100).toFixed(2));
      over_1_5_ht_goals_pct_l10a = parseFloat(((htOver15A / countA) * 100).toFixed(2));
      over_2_5_ht_goals_pct_l10a = parseFloat(((htOver25A / countA) * 100).toFixed(2));
      over_3_5_ht_goals_pct_l10a = parseFloat(((htOver35A / countA) * 100).toFixed(2));
      over_4_5_ht_goals_pct_l10a = parseFloat(((htOver45A / countA) * 100).toFixed(2));

      // Batch 15 - Second Half metrics (L10 Away)
      const shGoalsA = awayMatchesL10.reduce((sum, m) => sum + m.secondHalfTotalGoals, 0);
      const shGoalsScoredA = awayMatchesL10.reduce((sum, m) => sum + m.secondHalfGoalsScored, 0);
      const shGoalsConcededA = awayMatchesL10.reduce((sum, m) => sum + m.secondHalfGoalsConceded, 0);

      avg_2h_goals_l10a = parseFloat((shGoalsA / countA).toFixed(2));
      avg_2h_goals_scored_l10a = parseFloat((shGoalsScoredA / countA).toFixed(2));
      avg_2h_goals_conceded_l10a = parseFloat((shGoalsConcededA / countA).toFixed(2));

      const shOver05A = awayMatchesL10.filter(m => m.secondHalfTotalGoals >= 0.5).length;
      const shOver15A = awayMatchesL10.filter(m => m.secondHalfTotalGoals >= 1.5).length;
      const shOver25A = awayMatchesL10.filter(m => m.secondHalfTotalGoals >= 2.5).length;
      const shOver35A = awayMatchesL10.filter(m => m.secondHalfTotalGoals >= 3.5).length;
      const shOver45A = awayMatchesL10.filter(m => m.secondHalfTotalGoals >= 4.5).length;

      over_0_5_2h_goals_pct_l10a = parseFloat(((shOver05A / countA) * 100).toFixed(2));
      over_1_5_2h_goals_pct_l10a = parseFloat(((shOver15A / countA) * 100).toFixed(2));
      over_2_5_2h_goals_pct_l10a = parseFloat(((shOver25A / countA) * 100).toFixed(2));
      over_3_5_2h_goals_pct_l10a = parseFloat(((shOver35A / countA) * 100).toFixed(2));
      over_4_5_2h_goals_pct_l10a = parseFloat(((shOver45A / countA) * 100).toFixed(2));
    }
  }

  return {
    // Batch 1
    avg_match_goals_l5,
    avg_goals_scored_l5,
    avg_goals_conceded_l5,
    win_pct_l5,
    btts_pct_l5,
    clean_sheet_pct_l5,
    over_2_5_match_goals_pct_l5,
    over_1_5_match_goals_pct_l5,
    // Batch 2
    over_0_5_match_goals_pct_l5,
    over_3_5_match_goals_pct_l5,
    over_4_5_match_goals_pct_l5,
    draw_pct_l5,
    loss_pct_l5,
    // Batch 3 - Home variants
    avg_match_goals_l5h,
    avg_goals_scored_l5h,
    avg_goals_conceded_l5h,
    win_pct_l5h,
    btts_pct_l5h,
    clean_sheet_pct_l5h,
    over_1_5_match_goals_pct_l5h,
    over_2_5_match_goals_pct_l5h,
    over_0_5_match_goals_pct_l5h,
    over_3_5_match_goals_pct_l5h,
    over_4_5_match_goals_pct_l5h,
    draw_pct_l5h,
    loss_pct_l5h,
    // Batch 3 - Away variants
    avg_match_goals_l5a,
    avg_goals_scored_l5a,
    avg_goals_conceded_l5a,
    win_pct_l5a,
    btts_pct_l5a,
    clean_sheet_pct_l5a,
    over_1_5_match_goals_pct_l5a,
    over_2_5_match_goals_pct_l5a,
    over_0_5_match_goals_pct_l5a,
    over_3_5_match_goals_pct_l5a,
    over_4_5_match_goals_pct_l5a,
    draw_pct_l5a,
    loss_pct_l5a,
    // Batch 4 - Half Time
    avg_1h_goals_l5,
    avg_1h_goals_scored_l5,
    avg_1h_goals_conceded_l5,
    ht_win_pct_l5,
    ht_draw_pct_l5,
    ht_loss_pct_l5,
    ht_btts_pct_l5,
    over_0_5_ht_goals_pct_l5,
    over_1_5_ht_goals_pct_l5,
    over_2_5_ht_goals_pct_l5,
    over_3_5_ht_goals_pct_l5,
    over_4_5_ht_goals_pct_l5,
    // Batch 4 - Second Half
    avg_2h_goals_l5,
    avg_2h_goals_scored_l5,
    avg_2h_goals_conceded_l5,
    '2h_win_pct_l5': secondHalf_win_pct_l5,
    '2h_draw_pct_l5': secondHalf_draw_pct_l5,
    '2h_loss_pct_l5': secondHalf_loss_pct_l5,
    '2h_btts_pct_l5': secondHalf_btts_pct_l5,
    over_0_5_2h_goals_pct_l5,
    over_1_5_2h_goals_pct_l5,
    over_2_5_2h_goals_pct_l5,
    over_3_5_2h_goals_pct_l5,
    over_4_5_2h_goals_pct_l5,
    // Batch 4 - Half Time (Home)
    avg_1h_goals_l5h,
    avg_1h_goals_scored_l5h,
    avg_1h_goals_conceded_l5h,
    ht_win_pct_l5h,
    ht_draw_pct_l5h,
    ht_loss_pct_l5h,
    ht_btts_pct_l5h,
    over_0_5_ht_goals_pct_l5h,
    over_1_5_ht_goals_pct_l5h,
    over_2_5_ht_goals_pct_l5h,
    over_3_5_ht_goals_pct_l5h,
    over_4_5_ht_goals_pct_l5h,
    // Batch 4 - Second Half (Home)
    avg_2h_goals_l5h,
    avg_2h_goals_scored_l5h,
    avg_2h_goals_conceded_l5h,
    '2h_win_pct_l5h': secondHalf_win_pct_l5h,
    '2h_draw_pct_l5h': secondHalf_draw_pct_l5h,
    '2h_loss_pct_l5h': secondHalf_loss_pct_l5h,
    '2h_btts_pct_l5h': secondHalf_btts_pct_l5h,
    over_0_5_2h_goals_pct_l5h,
    over_1_5_2h_goals_pct_l5h,
    over_2_5_2h_goals_pct_l5h,
    over_3_5_2h_goals_pct_l5h,
    over_4_5_2h_goals_pct_l5h,
    // Batch 4 - Half Time (Away)
    avg_1h_goals_l5a,
    avg_1h_goals_scored_l5a,
    avg_1h_goals_conceded_l5a,
    ht_win_pct_l5a,
    ht_draw_pct_l5a,
    ht_loss_pct_l5a,
    ht_btts_pct_l5a,
    over_0_5_ht_goals_pct_l5a,
    over_1_5_ht_goals_pct_l5a,
    over_2_5_ht_goals_pct_l5a,
    over_3_5_ht_goals_pct_l5a,
    over_4_5_ht_goals_pct_l5a,
    // Batch 4 - Second Half (Away)
    avg_2h_goals_l5a,
    avg_2h_goals_scored_l5a,
    avg_2h_goals_conceded_l5a,
    '2h_win_pct_l5a': secondHalf_win_pct_l5a,
    '2h_draw_pct_l5a': secondHalf_draw_pct_l5a,
    '2h_loss_pct_l5a': secondHalf_loss_pct_l5a,
    '2h_btts_pct_l5a': secondHalf_btts_pct_l5a,
    over_0_5_2h_goals_pct_l5a,
    over_1_5_2h_goals_pct_l5a,
    over_2_5_2h_goals_pct_l5a,
    over_3_5_2h_goals_pct_l5a,
    over_4_5_2h_goals_pct_l5a,
    // Batch 5 - Goals Scored
    over_0_5_goals_scored_pct_l5,
    over_1_5_goals_scored_pct_l5,
    over_2_5_goals_scored_pct_l5,
    over_3_5_goals_scored_pct_l5,
    over_4_5_goals_scored_pct_l5,
    failed_to_score_pct_l5,
    // Batch 5 - Goals Conceded
    over_0_5_goals_conceded_pct_l5,
    over_1_5_goals_conceded_pct_l5,
    over_2_5_goals_conceded_pct_l5,
    over_3_5_goals_conceded_pct_l5,
    over_4_5_goals_conceded_pct_l5,
    // Batch 5 - Goals Scored (Home)
    over_0_5_goals_scored_pct_l5h,
    over_1_5_goals_scored_pct_l5h,
    over_2_5_goals_scored_pct_l5h,
    over_3_5_goals_scored_pct_l5h,
    over_4_5_goals_scored_pct_l5h,
    failed_to_score_pct_l5h,
    // Batch 5 - Goals Conceded (Home)
    over_0_5_goals_conceded_pct_l5h,
    over_1_5_goals_conceded_pct_l5h,
    over_2_5_goals_conceded_pct_l5h,
    over_3_5_goals_conceded_pct_l5h,
    over_4_5_goals_conceded_pct_l5h,
    // Batch 5 - Goals Scored (Away)
    over_0_5_goals_scored_pct_l5a,
    over_1_5_goals_scored_pct_l5a,
    over_2_5_goals_scored_pct_l5a,
    over_3_5_goals_scored_pct_l5a,
    over_4_5_goals_scored_pct_l5a,
    failed_to_score_pct_l5a,
    // Batch 5 - Goals Conceded (Away)
    over_0_5_goals_conceded_pct_l5a,
    over_1_5_goals_conceded_pct_l5a,
    over_2_5_goals_conceded_pct_l5a,
    over_3_5_goals_conceded_pct_l5a,
    over_4_5_goals_conceded_pct_l5a,
    // Batch 6 - Corners
    avg_corners_l5,
    avg_corners_for_l5,
    avg_corners_against_l5,
    over_10_corners_pct_l5,
    avg_corners_l5h,
    avg_corners_for_l5h,
    avg_corners_against_l5h,
    over_10_corners_pct_l5h,
    avg_corners_l5a,
    avg_corners_for_l5a,
    avg_corners_against_l5a,
    over_10_corners_pct_l5a,
    // Batch 7 - Shots
    avg_shots_l5,
    avg_shots_for_l5,
    avg_shots_against_l5,
    avg_shots_on_target_l5,
    avg_shots_on_target_for_l5,
    avg_shots_on_target_against_l5,
    over_15_shots_pct_l5,
    over_5_shots_on_target_pct_l5,
    avg_shots_l5h,
    avg_shots_for_l5h,
    avg_shots_against_l5h,
    avg_shots_on_target_l5h,
    avg_shots_on_target_for_l5h,
    avg_shots_on_target_against_l5h,
    over_15_shots_pct_l5h,
    over_5_shots_on_target_pct_l5h,
    avg_shots_l5a,
    avg_shots_for_l5a,
    avg_shots_against_l5a,
    avg_shots_on_target_l5a,
    avg_shots_on_target_for_l5a,
    avg_shots_on_target_against_l5a,
    over_15_shots_pct_l5a,
    over_5_shots_on_target_pct_l5a,
    // Batch 8 - Shots Off Target
    avg_shots_off_target_l5,
    avg_shots_off_target_for_l5,
    avg_shots_off_target_against_l5,
    avg_shots_off_target_l5h,
    avg_shots_off_target_for_l5h,
    avg_shots_off_target_against_l5h,
    avg_shots_off_target_l5a,
    avg_shots_off_target_for_l5a,
    avg_shots_off_target_against_l5a,
    // Batch 9 - Last 10 Matches
    avg_match_goals_l10,
    avg_goals_scored_l10,
    avg_goals_conceded_l10,
    win_pct_l10,
    draw_pct_l10,
    loss_pct_l10,
    btts_pct_l10,
    clean_sheet_pct_l10,
    failed_to_score_pct_l10,
    over_0_5_match_goals_pct_l10,
    over_1_5_match_goals_pct_l10,
    over_2_5_match_goals_pct_l10,
    over_3_5_match_goals_pct_l10,
    over_4_5_match_goals_pct_l10,
    avg_1h_goals_l10,
    avg_1h_goals_scored_l10,
    avg_1h_goals_conceded_l10,
    ht_win_pct_l10,
    ht_draw_pct_l10,
    ht_loss_pct_l10,
    ht_btts_pct_l10,
    over_0_5_ht_goals_pct_l10,
    over_1_5_ht_goals_pct_l10,
    over_2_5_ht_goals_pct_l10,
    over_3_5_ht_goals_pct_l10,
    over_4_5_ht_goals_pct_l10,
    avg_2h_goals_l10,
    avg_2h_goals_scored_l10,
    avg_2h_goals_conceded_l10,
    '2h_win_pct_l10': h2_win_pct_l10,
    '2h_draw_pct_l10': h2_draw_pct_l10,
    '2h_loss_pct_l10': h2_loss_pct_l10,
    '2h_btts_pct_l10': h2_btts_pct_l10,
    over_0_5_2h_goals_pct_l10,
    over_1_5_2h_goals_pct_l10,
    over_2_5_2h_goals_pct_l10,
    over_3_5_2h_goals_pct_l10,
    over_4_5_2h_goals_pct_l10,
    over_0_5_goals_scored_pct_l10,
    over_1_5_goals_scored_pct_l10,
    over_2_5_goals_scored_pct_l10,
    over_3_5_goals_scored_pct_l10,
    over_4_5_goals_scored_pct_l10,
    over_0_5_goals_conceded_pct_l10,
    over_1_5_goals_conceded_pct_l10,
    over_2_5_goals_conceded_pct_l10,
    over_3_5_goals_conceded_pct_l10,
    over_4_5_goals_conceded_pct_l10,
    avg_corners_l10,
    avg_corners_for_l10,
    avg_corners_against_l10,
    over_10_corners_pct_l10,
    avg_shots_l10,
    avg_shots_for_l10,
    avg_shots_against_l10,
    avg_shots_on_target_l10,
    avg_shots_on_target_for_l10,
    avg_shots_on_target_against_l10,
    over_15_shots_pct_l10,
    over_5_shots_on_target_pct_l10,
    avg_shots_off_target_l10,
    avg_shots_off_target_for_l10,
    avg_shots_off_target_against_l10,
    // Batch 10 - Last 10 Home
    avg_match_goals_l10h,
    avg_goals_scored_l10h,
    avg_goals_conceded_l10h,
    win_pct_l10h,
    draw_pct_l10h,
    loss_pct_l10h,
    btts_pct_l10h,
    clean_sheet_pct_l10h,
    failed_to_score_pct_l10h,
    over_0_5_match_goals_pct_l10h,
    over_1_5_match_goals_pct_l10h,
    over_2_5_match_goals_pct_l10h,
    over_3_5_match_goals_pct_l10h,
    over_4_5_match_goals_pct_l10h,
    over_0_5_goals_scored_pct_l10h,
    over_1_5_goals_scored_pct_l10h,
    over_2_5_goals_scored_pct_l10h,
    over_3_5_goals_scored_pct_l10h,
    over_4_5_goals_scored_pct_l10h,
    over_0_5_goals_conceded_pct_l10h,
    over_1_5_goals_conceded_pct_l10h,
    over_2_5_goals_conceded_pct_l10h,
    over_3_5_goals_conceded_pct_l10h,
    over_4_5_goals_conceded_pct_l10h,
    avg_corners_l10h,
    avg_corners_for_l10h,
    avg_corners_against_l10h,
    avg_shots_on_target_l10h,
    avg_shots_on_target_for_l10h,
    avg_shots_on_target_against_l10h,
    avg_shots_off_target_l10h,
    avg_shots_off_target_for_l10h,
    avg_shots_off_target_against_l10h,
    // Batch 10 - Last 10 Away
    avg_match_goals_l10a,
    avg_goals_scored_l10a,
    avg_goals_conceded_l10a,
    win_pct_l10a,
    draw_pct_l10a,
    loss_pct_l10a,
    btts_pct_l10a,
    clean_sheet_pct_l10a,
    failed_to_score_pct_l10a,
    over_0_5_match_goals_pct_l10a,
    over_1_5_match_goals_pct_l10a,
    over_2_5_match_goals_pct_l10a,
    over_3_5_match_goals_pct_l10a,
    over_4_5_match_goals_pct_l10a,
    over_0_5_goals_scored_pct_l10a,
    over_1_5_goals_scored_pct_l10a,
    over_2_5_goals_scored_pct_l10a,
    over_3_5_goals_scored_pct_l10a,
    over_4_5_goals_scored_pct_l10a,
    over_0_5_goals_conceded_pct_l10a,
    over_1_5_goals_conceded_pct_l10a,
    over_2_5_goals_conceded_pct_l10a,
    over_3_5_goals_conceded_pct_l10a,
    over_4_5_goals_conceded_pct_l10a,
    avg_corners_l10a,
    avg_corners_for_l10a,
    avg_corners_against_l10a,
    avg_shots_on_target_l10a,
    avg_shots_on_target_for_l10a,
    avg_shots_on_target_against_l10a,
    avg_shots_off_target_l10a,
    avg_shots_off_target_for_l10a,
    avg_shots_off_target_against_l10a,
    // Batch 11 - 2H L10 Home/Away
    '2h_win_pct_l10h': h2_win_pct_l10h,
    '2h_draw_pct_l10h': h2_draw_pct_l10h,
    '2h_loss_pct_l10h': h2_loss_pct_l10h,
    '2h_btts_pct_l10h': h2_btts_pct_l10h,
    '2h_win_pct_l10a': h2_win_pct_l10a,
    '2h_draw_pct_l10a': h2_draw_pct_l10a,
    '2h_loss_pct_l10a': h2_loss_pct_l10a,
    '2h_btts_pct_l10a': h2_btts_pct_l10a,
    // Batch 15 - L10 Home HT & 2H Goals
    avg_1h_goals_l10h,
    avg_1h_goals_scored_l10h,
    avg_1h_goals_conceded_l10h,
    ht_win_pct_l10h,
    ht_draw_pct_l10h,
    ht_loss_pct_l10h,
    ht_btts_pct_l10h,
    over_0_5_ht_goals_pct_l10h,
    over_1_5_ht_goals_pct_l10h,
    over_2_5_ht_goals_pct_l10h,
    over_3_5_ht_goals_pct_l10h,
    over_4_5_ht_goals_pct_l10h,
    avg_2h_goals_l10h,
    avg_2h_goals_scored_l10h,
    avg_2h_goals_conceded_l10h,
    over_0_5_2h_goals_pct_l10h,
    over_1_5_2h_goals_pct_l10h,
    over_2_5_2h_goals_pct_l10h,
    over_3_5_2h_goals_pct_l10h,
    over_4_5_2h_goals_pct_l10h,
    // Batch 15 - L10 Away HT & 2H Goals
    avg_1h_goals_l10a,
    avg_1h_goals_scored_l10a,
    avg_1h_goals_conceded_l10a,
    ht_win_pct_l10a,
    ht_draw_pct_l10a,
    ht_loss_pct_l10a,
    ht_btts_pct_l10a,
    over_0_5_ht_goals_pct_l10a,
    over_1_5_ht_goals_pct_l10a,
    over_2_5_ht_goals_pct_l10a,
    over_3_5_ht_goals_pct_l10a,
    over_4_5_ht_goals_pct_l10a,
    avg_2h_goals_l10a,
    avg_2h_goals_scored_l10a,
    avg_2h_goals_conceded_l10a,
    over_0_5_2h_goals_pct_l10a,
    over_1_5_2h_goals_pct_l10a,
    over_2_5_2h_goals_pct_l10a,
    over_3_5_2h_goals_pct_l10a,
    over_4_5_2h_goals_pct_l10a,
    // Batch 12 - Corners avg_match
    avg_match_corners_l5,
    avg_match_corners_l5h,
    avg_match_corners_l5a,
    avg_match_corners_l10,
    avg_match_corners_l10h,
    avg_match_corners_l10a,
    // Batch 13 - Half-Time Corners
    avg_1h_corners_l5,
    avg_1h_corners_for_l5,
    avg_1h_corners_against_l5,
    avg_1h_corners_l5h,
    avg_1h_corners_for_l5h,
    avg_1h_corners_against_l5h,
    avg_1h_corners_l5a,
    avg_1h_corners_for_l5a,
    avg_1h_corners_against_l5a,
    avg_1h_corners_l10,
    avg_1h_corners_for_l10,
    avg_1h_corners_against_l10,
    avg_1h_corners_l10h,
    avg_1h_corners_for_l10h,
    avg_1h_corners_against_l10h,
    avg_1h_corners_l10a,
    avg_1h_corners_for_l10a,
    avg_1h_corners_against_l10a,
    // Batch 14 - Second-Half Corners
    avg_2h_corners_l5,
    avg_2h_corners_for_l5,
    avg_2h_corners_against_l5,
    avg_2h_corners_l5h,
    avg_2h_corners_for_l5h,
    avg_2h_corners_against_l5h,
    avg_2h_corners_l5a,
    avg_2h_corners_for_l5a,
    avg_2h_corners_against_l5a,
    avg_2h_corners_l10,
    avg_2h_corners_for_l10,
    avg_2h_corners_against_l10,
    avg_2h_corners_l10h,
    avg_2h_corners_for_l10h,
    avg_2h_corners_against_l10h,
    avg_2h_corners_l10a,
    avg_2h_corners_for_l10a,
    avg_2h_corners_against_l10a,
    // Batch 16 - H2H (placeholder, filled by calculatePreMatchMetrics)
    avg_h2h_match_goals_l5: null,
    avg_h2h_1h_goals_l5: null,
    avg_h2h_2h_goals_l5: null,
    avg_h2h_match_corners_l5: null,
    avg_h2h_1h_corners_l5: null,
    avg_h2h_2h_corners_l5: null,
    avg_h2h_shots_on_target_l5: null,
    avg_h2h_shots_off_target_l5: null,
    h2h_btts_pct_l5: null,
    h2h_over_0_5_goals_pct_l5: null,
    h2h_over_1_5_goals_pct_l5: null,
    h2h_over_2_5_goals_pct_l5: null,
    h2h_over_3_5_goals_pct_l5: null,
    h2h_over_4_5_goals_pct_l5: null,
    h2h_over_0_5_1h_goals_pct_l5: null,
    h2h_over_1_5_1h_goals_pct_l5: null,
    h2h_over_2_5_1h_goals_pct_l5: null,
    h2h_over_3_5_1h_goals_pct_l5: null,
    h2h_over_4_5_1h_goals_pct_l5: null,
    h2h_over_0_5_2h_goals_pct_l5: null,
    h2h_over_1_5_2h_goals_pct_l5: null,
    h2h_over_2_5_2h_goals_pct_l5: null,
    h2h_over_3_5_2h_goals_pct_l5: null,
    h2h_over_4_5_2h_goals_pct_l5: null,
  };
}

/**
 * Calcule les métriques Head-to-Head à partir des fixtures H2H.
 * Ces métriques sont identiques pour les deux équipes (stats au niveau match).
 */
function calculateH2HMetrics(h2hFixtures: any[]): Partial<TeamPreMatchMetrics> {
  if (!h2hFixtures || h2hFixtures.length < 2) {
    return {};
  }

  const fixtures = h2hFixtures.slice(0, 5);
  const count = fixtures.length;

  // Extract scores from each H2H fixture (use first participant as reference)
  const h2hScores: Array<{
    totalGoals: number;
    htTotalGoals: number;
    shTotalGoals: number;
    totalCorners: number;
    firstHalfTotalCorners: number;
    secondHalfTotalCorners: number;
    totalShotsOnTarget: number;
    totalShotsOffTarget: number;
    btts: boolean;
  }> = [];

  for (const fixture of fixtures) {
    const scores = fixture.scores || [];
    const statistics = fixture.statistics || [];
    const events = fixture.events || [];

    // Get both teams' scores
    const currentScores = scores.filter((s: any) => s.description === 'CURRENT');
    const htScores = scores.filter((s: any) => s.description === 'HALFTIME');

    if (currentScores.length < 2) continue;

    const goals1 = currentScores[0]?.score?.goals ?? 0;
    const goals2 = currentScores[1]?.score?.goals ?? 0;
    const totalGoals = goals1 + goals2;

    // Half-time
    let htTotalGoals = 0;
    if (htScores.length >= 2) {
      const htGoals1 = htScores[0]?.score?.goals ?? 0;
      const htGoals2 = htScores[1]?.score?.goals ?? 0;
      htTotalGoals = htGoals1 + htGoals2;
    }
    const shTotalGoals = totalGoals - htTotalGoals;

    // Corners (full-time from statistics)
    const cornerStats = statistics.filter((s: any) => s.type_id === 34);
    const corners1 = cornerStats[0]?.data?.value ?? 0;
    const corners2 = cornerStats[1]?.data?.value ?? 0;
    const totalCorners = corners1 + corners2;

    // 1H/2H corners from events
    const cornerEvents = events.filter((e: any) =>
      e.type_id === 17 || (e.type?.code && e.type.code.toLowerCase() === 'corner')
    );
    const firstHalfTotalCorners = cornerEvents.filter((e: any) => e.minute <= 45).length;
    const secondHalfTotalCorners = cornerEvents.filter((e: any) => e.minute > 45).length;

    // Shots on target (type_id 86) and off target (type_id 41)
    const sotStats = statistics.filter((s: any) => s.type_id === 86);
    const sot1 = sotStats[0]?.data?.value ?? 0;
    const sot2 = sotStats[1]?.data?.value ?? 0;
    const totalShotsOnTarget = sot1 + sot2;

    const softStats = statistics.filter((s: any) => s.type_id === 41);
    const soft1 = softStats[0]?.data?.value ?? 0;
    const soft2 = softStats[1]?.data?.value ?? 0;
    const totalShotsOffTarget = soft1 + soft2;

    h2hScores.push({
      totalGoals,
      htTotalGoals,
      shTotalGoals,
      totalCorners,
      firstHalfTotalCorners,
      secondHalfTotalCorners,
      totalShotsOnTarget,
      totalShotsOffTarget,
      btts: goals1 > 0 && goals2 > 0,
    });
  }

  if (h2hScores.length < 2) return {};

  const n = h2hScores.length;

  // Averages
  const avg_h2h_match_goals_l5 = parseFloat((h2hScores.reduce((s, m) => s + m.totalGoals, 0) / n).toFixed(2));
  const avg_h2h_1h_goals_l5 = parseFloat((h2hScores.reduce((s, m) => s + m.htTotalGoals, 0) / n).toFixed(2));
  const avg_h2h_2h_goals_l5 = parseFloat((h2hScores.reduce((s, m) => s + m.shTotalGoals, 0) / n).toFixed(2));
  const avg_h2h_match_corners_l5 = parseFloat((h2hScores.reduce((s, m) => s + m.totalCorners, 0) / n).toFixed(2));
  const avg_h2h_1h_corners_l5 = parseFloat((h2hScores.reduce((s, m) => s + m.firstHalfTotalCorners, 0) / n).toFixed(2));
  const avg_h2h_2h_corners_l5 = parseFloat((h2hScores.reduce((s, m) => s + m.secondHalfTotalCorners, 0) / n).toFixed(2));
  const avg_h2h_shots_on_target_l5 = parseFloat((h2hScores.reduce((s, m) => s + m.totalShotsOnTarget, 0) / n).toFixed(2));
  const avg_h2h_shots_off_target_l5 = parseFloat((h2hScores.reduce((s, m) => s + m.totalShotsOffTarget, 0) / n).toFixed(2));

  // Percentages
  const h2h_btts_pct_l5 = parseFloat(((h2hScores.filter(m => m.btts).length / n) * 100).toFixed(2));

  // Over/Under full-time goals
  const h2h_over_0_5_goals_pct_l5 = parseFloat(((h2hScores.filter(m => m.totalGoals >= 0.5).length / n) * 100).toFixed(2));
  const h2h_over_1_5_goals_pct_l5 = parseFloat(((h2hScores.filter(m => m.totalGoals >= 1.5).length / n) * 100).toFixed(2));
  const h2h_over_2_5_goals_pct_l5 = parseFloat(((h2hScores.filter(m => m.totalGoals >= 2.5).length / n) * 100).toFixed(2));
  const h2h_over_3_5_goals_pct_l5 = parseFloat(((h2hScores.filter(m => m.totalGoals >= 3.5).length / n) * 100).toFixed(2));
  const h2h_over_4_5_goals_pct_l5 = parseFloat(((h2hScores.filter(m => m.totalGoals >= 4.5).length / n) * 100).toFixed(2));

  // Over/Under 1H goals
  const h2h_over_0_5_1h_goals_pct_l5 = parseFloat(((h2hScores.filter(m => m.htTotalGoals >= 0.5).length / n) * 100).toFixed(2));
  const h2h_over_1_5_1h_goals_pct_l5 = parseFloat(((h2hScores.filter(m => m.htTotalGoals >= 1.5).length / n) * 100).toFixed(2));
  const h2h_over_2_5_1h_goals_pct_l5 = parseFloat(((h2hScores.filter(m => m.htTotalGoals >= 2.5).length / n) * 100).toFixed(2));
  const h2h_over_3_5_1h_goals_pct_l5 = parseFloat(((h2hScores.filter(m => m.htTotalGoals >= 3.5).length / n) * 100).toFixed(2));
  const h2h_over_4_5_1h_goals_pct_l5 = parseFloat(((h2hScores.filter(m => m.htTotalGoals >= 4.5).length / n) * 100).toFixed(2));

  // Over/Under 2H goals
  const h2h_over_0_5_2h_goals_pct_l5 = parseFloat(((h2hScores.filter(m => m.shTotalGoals >= 0.5).length / n) * 100).toFixed(2));
  const h2h_over_1_5_2h_goals_pct_l5 = parseFloat(((h2hScores.filter(m => m.shTotalGoals >= 1.5).length / n) * 100).toFixed(2));
  const h2h_over_2_5_2h_goals_pct_l5 = parseFloat(((h2hScores.filter(m => m.shTotalGoals >= 2.5).length / n) * 100).toFixed(2));
  const h2h_over_3_5_2h_goals_pct_l5 = parseFloat(((h2hScores.filter(m => m.shTotalGoals >= 3.5).length / n) * 100).toFixed(2));
  const h2h_over_4_5_2h_goals_pct_l5 = parseFloat(((h2hScores.filter(m => m.shTotalGoals >= 4.5).length / n) * 100).toFixed(2));

  return {
    avg_h2h_match_goals_l5,
    avg_h2h_1h_goals_l5,
    avg_h2h_2h_goals_l5,
    avg_h2h_match_corners_l5,
    avg_h2h_1h_corners_l5,
    avg_h2h_2h_corners_l5,
    avg_h2h_shots_on_target_l5,
    avg_h2h_shots_off_target_l5,
    h2h_btts_pct_l5,
    h2h_over_0_5_goals_pct_l5,
    h2h_over_1_5_goals_pct_l5,
    h2h_over_2_5_goals_pct_l5,
    h2h_over_3_5_goals_pct_l5,
    h2h_over_4_5_goals_pct_l5,
    h2h_over_0_5_1h_goals_pct_l5,
    h2h_over_1_5_1h_goals_pct_l5,
    h2h_over_2_5_1h_goals_pct_l5,
    h2h_over_3_5_1h_goals_pct_l5,
    h2h_over_4_5_1h_goals_pct_l5,
    h2h_over_0_5_2h_goals_pct_l5,
    h2h_over_1_5_2h_goals_pct_l5,
    h2h_over_2_5_2h_goals_pct_l5,
    h2h_over_3_5_2h_goals_pct_l5,
    h2h_over_4_5_2h_goals_pct_l5,
  };
}

/**
 * Calcule les métriques pré-match pour home et away.
 */
export function calculatePreMatchMetrics(
  homeFixtures: any[],
  awayFixtures: any[],
  homeParticipantId: number,
  awayParticipantId: number,
  h2hFixtures?: any[],
): CalculatedPreMatch {
  const home = calculateTeamMetrics(homeFixtures, homeParticipantId);
  const away = calculateTeamMetrics(awayFixtures, awayParticipantId);

  // Calculate H2H metrics (same for both teams)
  if (h2hFixtures && h2hFixtures.length > 0) {
    const h2h = calculateH2HMetrics(h2hFixtures);
    Object.assign(home, h2h);
    Object.assign(away, h2h);
  }

  return { home, away };
}
