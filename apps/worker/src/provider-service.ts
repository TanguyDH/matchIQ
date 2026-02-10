import { z } from 'zod';
import type { MatchSnapshot } from '@matchiq/shared-types';
import { config } from './config';
import { extractInPlayMetrics } from './metrics-catalog';
import { readFileSync } from 'fs';
import { join } from 'path';

// ─── Zod Schemas for SportMonks API Response Validation ──────────────────────

const ParticipantSchema = z.object({
  id: z.number(),
  name: z.string(),
  meta: z.object({
    location: z.enum(['home', 'away']),
  }),
});

const ScoreSchema = z.object({
  goals: z.number().nullable(),
  participant: z.enum(['home', 'away']),
});

const StateSchema = z.object({
  id: z.number(),
  state: z.string(), // 'INPLAY', 'NS', 'FT', etc.
  minute: z.number().nullable(),
});

const StatisticDetailSchema = z.object({
  type_id: z.number(), // SportMonks statistic type ID (e.g., 43 = Attacks)
  value: z.object({
    total: z.union([z.number(), z.string(), z.null()]).optional(),
    home: z.union([z.number(), z.string(), z.null()]).optional(),
    away: z.union([z.number(), z.string(), z.null()]).optional(),
  }),
});

const FixtureSchema = z.object({
  id: z.number(),
  state: StateSchema,
  participants: z.array(ParticipantSchema),
  scores: z.array(ScoreSchema),
  statistics: z.array(StatisticDetailSchema).optional(),
});

const LiveFixturesResponseSchema = z.object({
  data: z.array(FixtureSchema).optional(),
  message: z.string().optional(),
});

const OddsBookmakerSchema = z.object({
  id: z.number(),
  name: z.string(),
  markets: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      selections: z.array(
        z.object({
          name: z.string(),
          odds: z.string(),
        }),
      ),
    }),
  ),
});

const FixtureOddsResponseSchema = z.object({
  data: z.object({
    bookmakers: z.array(OddsBookmakerSchema).optional(),
  }),
});

type Fixture = z.infer<typeof FixtureSchema>;
type OddsBookmaker = z.infer<typeof OddsBookmakerSchema>;

// ─── SportMonks Statistic Type IDs ───────────────────────────────────────────

const SPORTMONKS_STAT_IDS = {
  GOALS: 52,
  SHOTS_TOTAL: 42,
  SHOTS_ON_TARGET: 86,
  SHOTS_OFF_TARGET: 41,
  SHOTS_INSIDE_BOX: 49,
  SHOTS_OUTSIDE_BOX: 50,
  SHOTS_BLOCKED: 58,
  ATTACKS: 43,
  DANGEROUS_ATTACKS: 44,
  CORNERS: 34,
  OFFSIDES: 51,
  BALL_POSSESSION: 45,
  PASSES: 80,
  ACCURATE_PASSES: 81,
  PASS_PERCENTAGE: 82,
  YELLOW_CARDS: 84,
  RED_CARDS: 83,
  FOULS: 56,
  SAVES: 57,
  KEY_PASSES: 117,
  COUNTER_ATTACKS: 1527,
} as const;

// ─── Provider Service ─────────────────────────────────────────────────────────

/**
 * SportMonks API provider service.
 * Fetches live fixtures, statistics, and odds.
 * All responses are validated with Zod schemas.
 */
export class ProviderService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = config.sportmonks.key;
    this.baseUrl = config.sportmonks.baseUrl;
  }

  /**
   * Fetches all live fixtures.
   * If USE_MOCK_DATA=true, reads from mock-fixtures.json instead of API.
   */
  async fetchLiveFixtures(): Promise<Fixture[]> {
    try {
      let json: any;

      if (config.useMockData) {
        // Load mock fixtures from file
        console.log('[ProviderService] Using mock data from mock-fixtures.json');
        const mockPath = join(__dirname, 'mock-fixtures.json');
        const mockData = readFileSync(mockPath, 'utf-8');
        json = JSON.parse(mockData);
      } else {
        // Fetch from SportMonks API
        const response = await fetch(
          `${this.baseUrl}/livescores/inplay?api_token=${this.apiKey}&include=scores;participants;statistics.type`,
        );

        if (!response.ok) {
          throw new Error(
            `SportMonks fixtures request failed: ${response.status} ${response.statusText}`,
          );
        }

        json = await response.json();
      }

      const validated = LiveFixturesResponseSchema.parse(json);

      if (!validated.data) {
        console.log('[ProviderService] No live fixtures available');
        return [];
      }

      console.log(
        `[ProviderService] Fetched ${validated.data.length} live fixtures${config.useMockData ? ' (mock)' : ''}`,
      );
      return validated.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[ProviderService] Fixture validation error:', error.errors);
      }
      throw error;
    }
  }

  /**
   * Fetches statistics for a specific fixture.
   * Only called when strategies require IN_PLAY metrics.
   * Note: SportMonks includes statistics in the main fixture response,
   * so this method may not be needed if using proper includes.
   */
  async fetchFixtureStats(fixtureId: number): Promise<any[]> {
    try {
      let json: any;

      if (config.useMockData) {
        // Load mock statistics from file
        const mockPath = join(__dirname, 'mock-statistics.json');
        const mockData = JSON.parse(readFileSync(mockPath, 'utf-8'));
        const fixtureData = mockData[fixtureId.toString()];

        if (!fixtureData) {
          console.warn(`[ProviderService] No mock stats for fixture ${fixtureId}`);
          return [];
        }

        return fixtureData.data?.statistics || [];
      } else {
        // Fetch from SportMonks API
        const response = await fetch(
          `${this.baseUrl}/fixtures/${fixtureId}?api_token=${this.apiKey}&include=statistics.type`,
        );

        if (!response.ok) {
          throw new Error(
            `SportMonks stats request failed: ${response.status} ${response.statusText}`,
          );
        }

        json = await response.json();
        return json.data?.statistics || [];
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[ProviderService] Stats validation error:', error.errors);
      }
      throw error;
    }
  }

  /**
   * Fetches odds for a specific fixture.
   * Only called when strategies require ODDS metrics.
   */
  async fetchFixtureOdds(fixtureId: number): Promise<OddsBookmaker[]> {
    try {
      let json: any;

      if (config.useMockData) {
        // Load mock odds from file
        const mockPath = join(__dirname, 'mock-odds.json');
        const mockData = JSON.parse(readFileSync(mockPath, 'utf-8'));
        const fixtureData = mockData[fixtureId.toString()];

        if (!fixtureData) {
          console.warn(`[ProviderService] No mock odds for fixture ${fixtureId}`);
          return [];
        }

        return fixtureData.data?.bookmakers || [];
      } else {
        // Fetch from SportMonks API
        const response = await fetch(
          `${this.baseUrl}/fixtures/${fixtureId}?api_token=${this.apiKey}&include=odds.bookmaker;odds.markets`,
        );

        if (!response.ok) {
          throw new Error(
            `SportMonks odds request failed: ${response.status} ${response.statusText}`,
          );
        }

        json = await response.json();

        const validated = FixtureOddsResponseSchema.parse(json);
        return validated.data.bookmakers || [];
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[ProviderService] Odds validation error:', error.errors);
      }
      throw error;
    }
  }

  /**
   * Normalizes SportMonks fixture data into internal MatchSnapshot format.
   *
   * @param fixture - Raw fixture from SportMonks
   */
  normalizeToMatchSnapshot(fixture: Fixture): MatchSnapshot {
    // Find home and away participants
    const homeParticipant = fixture.participants.find((p) => p.meta.location === 'home');
    const awayParticipant = fixture.participants.find((p) => p.meta.location === 'away');

    if (!homeParticipant || !awayParticipant) {
      throw new Error(`Missing participants for fixture ${fixture.id}`);
    }

    // Get scores
    const homeScoreObj = fixture.scores.find((s) => s.participant === 'home');
    const awayScoreObj = fixture.scores.find((s) => s.participant === 'away');

    const homeScore = homeScoreObj?.goals ?? 0;
    const awayScore = awayScoreObj?.goals ?? 0;

    // Extract IN_PLAY metrics from statistics
    const inPlay: Record<string, number> = {
      home_goals: homeScore,
      away_goals: awayScore,
      match_timer: fixture.state.minute ?? 0, // Match Timer (Minute)
    };

    if (fixture.statistics) {
      for (const stat of fixture.statistics) {
        const statName = this.getStatNameFromTypeId(stat.type_id);
        if (statName && stat.value) {
          // SportMonks provides home/away split
          if (stat.value.home !== undefined && stat.value.home !== null) {
            inPlay[`home_${statName}`] = this.parseStatValue(stat.value.home);
          }
          if (stat.value.away !== undefined && stat.value.away !== null) {
            inPlay[`away_${statName}`] = this.parseStatValue(stat.value.away);
          }
        }
      }
    }

    // Determine if match is live
    const isLive = ['INPLAY', 'HT', 'LIVE'].includes(fixture.state.state);

    return {
      id: fixture.id.toString(),
      homeTeam: homeParticipant.name,
      awayTeam: awayParticipant.name,
      homeScore,
      awayScore,
      minute: fixture.state.minute ?? 0,
      isLive,
      inPlay,
      preMatch: {}, // TODO: Implement pre-match stats if needed
      odds: {}, // TODO: Extract odds if needed
    };
  }

  /**
   * Maps SportMonks statistic type ID to our internal metric name.
   */
  private getStatNameFromTypeId(typeId: number): string | null {
    const mapping: Record<number, string> = {
      [SPORTMONKS_STAT_IDS.SHOTS_TOTAL]: 'shots_total',
      [SPORTMONKS_STAT_IDS.SHOTS_ON_TARGET]: 'shots_on_target',
      [SPORTMONKS_STAT_IDS.SHOTS_OFF_TARGET]: 'shots_off_target',
      [SPORTMONKS_STAT_IDS.SHOTS_INSIDE_BOX]: 'shots_inside_box',
      [SPORTMONKS_STAT_IDS.SHOTS_OUTSIDE_BOX]: 'shots_outside_box',
      [SPORTMONKS_STAT_IDS.SHOTS_BLOCKED]: 'shots_blocked',
      [SPORTMONKS_STAT_IDS.ATTACKS]: 'attacks',
      [SPORTMONKS_STAT_IDS.DANGEROUS_ATTACKS]: 'dangerous_attacks',
      [SPORTMONKS_STAT_IDS.CORNERS]: 'corners',
      [SPORTMONKS_STAT_IDS.OFFSIDES]: 'offsides',
      [SPORTMONKS_STAT_IDS.BALL_POSSESSION]: 'possession',
      [SPORTMONKS_STAT_IDS.PASSES]: 'passes_total',
      [SPORTMONKS_STAT_IDS.ACCURATE_PASSES]: 'passes_accurate',
      [SPORTMONKS_STAT_IDS.PASS_PERCENTAGE]: 'passes_percentage',
      [SPORTMONKS_STAT_IDS.YELLOW_CARDS]: 'yellow_cards',
      [SPORTMONKS_STAT_IDS.RED_CARDS]: 'red_cards',
      [SPORTMONKS_STAT_IDS.FOULS]: 'fouls',
      [SPORTMONKS_STAT_IDS.SAVES]: 'saves',
      [SPORTMONKS_STAT_IDS.KEY_PASSES]: 'key_passes',
      [SPORTMONKS_STAT_IDS.COUNTER_ATTACKS]: 'counter_attacks',
    };

    return mapping[typeId] || null;
  }

  /**
   * Parses statistic values from SportMonks (can be number, string with %, or null).
   */
  private parseStatValue(value: number | string | null): number {
    if (value === null) return 0;
    if (typeof value === 'number') return value;

    // Handle percentage strings like "65%"
    const match = value.match(/^(\d+(?:\.\d+)?)%?$/);
    if (match) {
      return parseFloat(match[1]);
    }

    return 0;
  }
}
