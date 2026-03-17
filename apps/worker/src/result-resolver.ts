import { supabase } from './supabase';
import { config } from './config';
import { evaluateOutcome, type MatchResult } from './outcome-evaluator';
import { recordOutcome } from './performance-service';
import { getStatsAtMinute } from './stats-timeline';

// SportMonks statistic type IDs
const STAT = {
  CORNERS: 34,
  YELLOW_CARDS: 84,
  RED_CARDS: 83,
} as const;

interface FinalMatchData {
  homeFinal: number;
  awayFinal: number;
  homeHT: number;
  awayHT: number;
  cornersHome: number | null;
  cornersAway: number | null;
  cornersHomeHT: number | null;
  cornersAwayHT: number | null;
  cardsHome: number | null;
  cardsAway: number | null;
  cardsHomeHT: number | null;
  cardsAwayHT: number | null;
  isFinished: boolean;
}

/**
 * Fetches the final score + statistics of a finished fixture from SportMonks.
 * Returns null if the match is not finished yet or data is unavailable.
 */
async function fetchFinalData(matchId: string): Promise<FinalMatchData | null> {
  try {
    const url =
      `${config.sportmonks.baseUrl}/fixtures/${matchId}` +
      `?api_token=${config.sportmonks.key}` +
      `&include=scores;state;statistics;periods;events;participants`;
    const res = await fetch(url);

    if (!res.ok) {
      console.warn(
        `[ResultResolver] SportMonks ${res.status} for fixture ${matchId}`,
      );
      return null;
    }

    const json = (await res.json()) as any;
    const fixture = json?.data;
    if (!fixture) return null;

    // state_id 5 = finished in SportMonks
    const isFinished = fixture.state_id === 5;

    // ── Scores ────────────────────────────────────────────────────────────────
    const scores: any[] = fixture.scores ?? [];
    const ftHome =
      scores.find(
        (s: any) =>
          s.description === 'CURRENT' && s.score?.participant === 'home',
      )?.score?.goals ?? 0;
    const ftAway =
      scores.find(
        (s: any) =>
          s.description === 'CURRENT' && s.score?.participant === 'away',
      )?.score?.goals ?? 0;
    const htHome =
      scores.find(
        (s: any) =>
          s.description === 'HALFTIME' && s.score?.participant === 'home',
      )?.score?.goals ?? 0;
    const htAway =
      scores.find(
        (s: any) =>
          s.description === 'HALFTIME' && s.score?.participant === 'away',
      )?.score?.goals ?? 0;

    // ── Periods — identify 1st half and 2nd half period IDs ──────────────────
    const periods: any[] = fixture.periods ?? [];
    // SportMonks period type_id: 1 = first half, 2 = second half
    const firstHalfPeriodId = periods.find((p: any) => p.type_id === 1)?.id ?? null;
    const secondHalfPeriodId = periods.find((p: any) => p.type_id === 2)?.id ?? null;

    // ── Statistics ────────────────────────────────────────────────────────────
    const statistics: any[] = fixture.statistics ?? [];

    const extractStat = (
      typeId: number,
      location: 'home' | 'away',
      periodId: number | null | 'FT',
    ): number | null => {
      let stat: any;
      if (periodId === 'FT') {
        // FT total: prefer row with null/undefined period_id, fallback to any
        stat =
          statistics.find(
            (s: any) =>
              s.type_id === typeId &&
              s.location === location &&
              (s.period_id === null || s.period_id === undefined),
          ) ??
          statistics.find(
            (s: any) => s.type_id === typeId && s.location === location,
          );
      } else if (periodId !== null) {
        stat = statistics.find(
          (s: any) =>
            s.type_id === typeId &&
            s.location === location &&
            s.period_id === periodId,
        );
      }
      if (!stat) return null;
      const val = stat?.data?.value ?? stat?.value?.total ?? null;
      return val !== null ? Number(val) : null;
    };

    const cornersHome = extractStat(STAT.CORNERS, 'home', 'FT');
    const cornersAway = extractStat(STAT.CORNERS, 'away', 'FT');
    const cornersHomeHT = extractStat(STAT.CORNERS, 'home', firstHalfPeriodId);
    const cornersAwayHT = extractStat(STAT.CORNERS, 'away', firstHalfPeriodId);

    const yellowHome = extractStat(STAT.YELLOW_CARDS, 'home', 'FT') ?? 0;
    const yellowAway = extractStat(STAT.YELLOW_CARDS, 'away', 'FT') ?? 0;
    const redHome = extractStat(STAT.RED_CARDS, 'home', 'FT') ?? 0;
    const redAway = extractStat(STAT.RED_CARDS, 'away', 'FT') ?? 0;
    const yellowHomeHT = extractStat(STAT.YELLOW_CARDS, 'home', firstHalfPeriodId);
    const yellowAwayHT = extractStat(STAT.YELLOW_CARDS, 'away', firstHalfPeriodId);
    const redHomeHT = extractStat(STAT.RED_CARDS, 'home', firstHalfPeriodId);
    const redAwayHT = extractStat(STAT.RED_CARDS, 'away', firstHalfPeriodId);

    // ── Cards per half via events (type 19=yellow, 20=red, with exact minute) ──
    const events: any[] = fixture.events ?? [];
    const participants: any[] = fixture.participants ?? [];
    const homeParticipantId =
      participants.find((p: any) => p.meta?.location === 'home')?.id ?? null;
    const awayParticipantId =
      participants.find((p: any) => p.meta?.location === 'away')?.id ?? null;

    const cardEvents = events.filter(
      (e: any) => e.type_id === 19 || e.type_id === 20,
    );

    const countCards = (
      teamId: number | null,
      minMinute: number,
      maxMinute: number,
    ): number | null => {
      if (teamId === null) return null;
      return cardEvents.filter(
        (e: any) =>
          e.participant_id === teamId &&
          e.minute > minMinute &&
          e.minute <= maxMinute,
      ).length;
    };

    // FT cards from events (more reliable per-minute; fallback to stats)
    const cardsHomeFT = countCards(homeParticipantId, 0, 120);
    const cardsAwayFT = countCards(awayParticipantId, 0, 120);
    const cardsHome =
      cardsHomeFT !== null
        ? cardsHomeFT
        : yellowHome > 0 || redHome > 0
          ? yellowHome + redHome
          : null;
    const cardsAway =
      cardsAwayFT !== null
        ? cardsAwayFT
        : yellowAway > 0 || redAway > 0
          ? yellowAway + redAway
          : null;

    // 1H cards: minute 1–45 (extra time in 1H counted up to 45+N, usually minute <= 45)
    const cardsHomeHT = countCards(homeParticipantId, 0, 45);
    const cardsAwayHT = countCards(awayParticipantId, 0, 45);

    void secondHalfPeriodId; // available for future use
    void yellowHomeHT;
    void yellowAwayHT;
    void redHomeHT;
    void redAwayHT;

    return {
      homeFinal: ftHome,
      awayFinal: ftAway,
      homeHT: htHome,
      awayHT: htAway,
      cornersHome,
      cornersAway,
      cornersHomeHT,
      cornersAwayHT,
      cardsHome,
      cardsAway,
      cardsHomeHT,
      cardsAwayHT,
      isFinished,
    };
  } catch (err) {
    console.error(`[ResultResolver] Failed to fetch fixture ${matchId}:`, err);
    return null;
  }
}

/**
 * Resolves HIT/MISS for all pending triggers whose match has finished.
 * Called at the end of each scan cycle.
 */
export async function resolveFinishedMatches(): Promise<void> {
  const { data: triggers, error } = await supabase
    .from('triggers')
    .select(
      'id, match_id, strategy_id, score_home, score_away, evidence_json, strategies(desired_outcome)',
    )
    .is('result', null)
    .limit(50);

  if (error) {
    console.error('[ResultResolver] Failed to load pending triggers:', error);
    return;
  }

  if (!triggers || triggers.length === 0) return;

  console.log(
    `[ResultResolver] Checking ${triggers.length} unresolved trigger(s)...`,
  );

  // Group triggers by match_id to avoid fetching the same fixture multiple times
  const byMatch = new Map<string, typeof triggers>();
  for (const trigger of triggers) {
    const list = byMatch.get(trigger.match_id) ?? [];
    list.push(trigger);
    byMatch.set(trigger.match_id, list);
  }

  for (const [matchId, matchTriggers] of byMatch) {
    const data = await fetchFinalData(matchId);

    if (!data || !data.isFinished) continue;

    const homeSH = data.homeFinal - data.homeHT;
    const awaySH = data.awayFinal - data.awayHT;

    // 1H stats from timeline: last snapshot at or before minute 45
    const htStats = await getStatsAtMinute(matchId, 45);
    const cornersHomeHT =
      htStats?.stats['home_corners'] != null
        ? Math.round(htStats.stats['home_corners'])
        : null;
    const cornersAwayHT =
      htStats?.stats['away_corners'] != null
        ? Math.round(htStats.stats['away_corners'])
        : null;

    // 1H cards from timeline (overrides event-based count if available)
    const cardsHomeHTFromTimeline =
      htStats?.stats['home_yellow_cards'] != null
        ? Math.round(
            (htStats.stats['home_yellow_cards'] ?? 0) +
              (htStats.stats['home_red_cards'] ?? 0),
          )
        : null;
    const cardsAwayHTFromTimeline =
      htStats?.stats['away_yellow_cards'] != null
        ? Math.round(
            (htStats.stats['away_yellow_cards'] ?? 0) +
              (htStats.stats['away_red_cards'] ?? 0),
          )
        : null;

    console.log(
      `[ResultResolver] Match ${matchId} finished: ` +
        `${data.homeFinal}-${data.awayFinal} ` +
        `(HT: ${data.homeHT}-${data.awayHT}, ` +
        `corners FT: ${data.cornersHome ?? '?'}-${data.cornersAway ?? '?'}, ` +
        `corners HT: ${cornersHomeHT ?? '?'}-${cornersAwayHT ?? '?'})`,
    );

    for (const trigger of matchTriggers) {
      const strategyRaw = trigger.strategies as unknown;
      const strategy = Array.isArray(strategyRaw)
        ? strategyRaw[0]
        : (strategyRaw as { desired_outcome: string | null } | null);
      const desiredOutcome = strategy?.desired_outcome;

      if (!desiredOutcome) {
        await resolveTrigger(trigger.id, trigger.strategy_id, 'MISS');
        continue;
      }

      // Pre-match odds from evidence_json (for FAV/UND resolution)
      const evidence = trigger.evidence_json as Record<string, any> | null;
      const homeOdds = evidence?.odds?.prematch_home_win as number | undefined;
      const awayOdds = evidence?.odds?.prematch_away_win as number | undefined;

      // Corners at trigger time from evidence_json (for "Since Picked" corner outcomes)
      const cornersAtTrigger =
        typeof evidence?.corners_total === 'number'
          ? (evidence.corners_total as number)
          : null;

      const matchResult: MatchResult = {
        homeFinal: data.homeFinal,
        awayFinal: data.awayFinal,
        homeHT: data.homeHT,
        awayHT: data.awayHT,
        homeSH,
        awaySH,
        cornersHome: data.cornersHome,
        cornersAway: data.cornersAway,
        cornersHomeHT,
        cornersAwayHT,
        cardsHome: data.cardsHome,
        cardsAway: data.cardsAway,
        cardsHomeHT: cardsHomeHTFromTimeline ?? data.cardsHomeHT,
        cardsAwayHT: cardsAwayHTFromTimeline ?? data.cardsAwayHT,
        homeAtTrigger: trigger.score_home ?? null,
        awayAtTrigger: trigger.score_away ?? null,
        cornersAtTrigger,
        homeOdds,
        awayOdds,
      };

      const result = evaluateOutcome(desiredOutcome, matchResult);

      if (result === null) {
        console.log(
          `[ResultResolver] Cannot evaluate outcome "${desiredOutcome}" for trigger ${trigger.id} — skipped`,
        );
        continue;
      }

      await resolveTrigger(trigger.id, trigger.strategy_id, result);
    }
  }
}

async function resolveTrigger(
  triggerId: string,
  strategyId: string,
  result: 'HIT' | 'MISS',
): Promise<void> {
  const { error } = await supabase
    .from('triggers')
    .update({ result })
    .eq('id', triggerId)
    .is('result', null); // Safety: never overwrite an already-resolved trigger

  if (error) {
    console.error(
      `[ResultResolver] Failed to update trigger ${triggerId}:`,
      error,
    );
    return;
  }

  console.log(`[ResultResolver] Trigger ${triggerId} → ${result}`);

  await recordOutcome(strategyId, result);
}
