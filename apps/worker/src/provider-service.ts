import { z } from 'zod';
import type { MatchSnapshot } from '@matchiq/shared-types';
import { calculateMatchMinute } from '@matchiq/shared-types';
import { config } from './config';
import { extractInPlayMetrics } from './metrics-catalog';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getTeamPosition } from './standings-cache';
import { calculatePreMatchMetrics } from './prematch-calculator';

// ─── Zod Schemas for SportMonks API Response Validation ──────────────────────

const ParticipantSchema = z.object({
  id: z.number(),
  name: z.string(),
  meta: z.object({
    location: z.enum(['home', 'away']),
  }),
});

const ScoreSchema = z.object({
  id: z.number().optional(),
  fixture_id: z.number().optional(),
  type_id: z.number().optional(),
  participant_id: z.number().optional(),
  score: z.object({
    goals: z.number().nullable(),
    participant: z.enum(['home', 'away']),
  }),
  description: z.string().optional(),
});

const PeriodSchema = z.object({
  id: z.number(),
  fixture_id: z.number(),
  type_id: z.number(),
  started: z.number().optional(),
  ended: z.number().nullable().optional(),
  ticking: z.boolean().optional(),
  minutes: z.number().nullable().optional(),
  seconds: z.number().nullable().optional(),
  has_timer: z.boolean().optional(),
}).optional();

const StateSchema = z.object({
  id: z.number().optional(),
  state: z.string().optional(), // 'INPLAY', 'NS', 'FT', etc.
  minute: z.number().nullable().optional(),
}).optional();

const StatisticDetailSchema = z.object({
  type_id: z.number(), // SportMonks statistic type ID (e.g., 43 = Attacks)
  participant_id: z.number().optional(),
  location: z.enum(['home', 'away']).optional(),
  data: z.object({
    value: z.union([z.number(), z.string(), z.null()]).optional(),
  }).optional(),
  // Support old format for backward compatibility with mocks
  value: z.object({
    total: z.union([z.number(), z.string(), z.null()]).optional(),
    home: z.union([z.number(), z.string(), z.null()]).optional(),
    away: z.union([z.number(), z.string(), z.null()]).optional(),
  }).optional(),
});

const StandingSchema = z.object({
  team_id: z.number(),
  position: z.number(),
  points: z.number().optional(),
  played: z.number().optional(),
  won: z.number().optional(),
  draw: z.number().optional(),
  lost: z.number().optional(),
}).optional();

const LeagueSchema = z.object({
  id: z.number(),
  name: z.string(),
  country_id: z.number().optional(),
  standings: z.array(StandingSchema).optional(),
}).optional();

const EventSchema = z.object({
  id: z.number(),
  type_id: z.number(),
  participant_id: z.number().optional(),
  minute: z.number().optional(),
  result: z.string().nullable().optional(),
  player_id: z.number().nullable().optional(), // Player coming in (for substitutions)
  related_player_id: z.number().nullable().optional(), // Player going out (for substitutions)
  injured: z.boolean().nullable().optional(), // If player going out is injured
}).optional();

const LatestSchema = z.object({
  form: z.array(z.string()).optional(), // ['W', 'L', 'D', 'W', 'L']
  standing: z.object({
    position: z.number().optional(),
  }).optional(),
}).optional();

const ParticipantWithLatestSchema = ParticipantSchema.extend({
  latest: z.union([LatestSchema, z.array(z.any())]).optional(), // Can be object or array
});

const XGFixtureSchema = z.object({
  home: z.object({
    total: z.number().nullable().optional(),
  }).optional(),
  away: z.object({
    total: z.number().nullable().optional(),
  }).optional(),
}).optional();

const OddsSchema = z.object({
  id: z.number(),
  market_id: z.number(),
  market_description: z.string().optional(),
  label: z.string(),
  value: z.string(),
  total: z.string().nullable().optional(),
  stopped: z.boolean().optional(),
  created_at: z.string().optional(),
}).optional();

const InplayOddsSchema = z.object({
  id: z.number().optional(),
  fixture_id: z.number().optional(),
  market_id: z.number(),
  bookmaker_id: z.number().nullable().optional(),
  label: z.string(),
  value: z.string(),
  total: z.string().nullable().optional(),
  suspended: z.boolean().nullable().optional(),
  stopped: z.boolean().nullable().optional(),
  probability: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  latest_bookmaker_update: z.string().nullable().optional(),
});

const FixtureSchema = z.object({
  id: z.number(),
  season_id: z.number().optional(), // Season ID for fetching standings
  state: StateSchema.optional(),
  participants: z.array(ParticipantWithLatestSchema).optional(),
  scores: z.array(ScoreSchema).optional(),
  statistics: z.array(StatisticDetailSchema).optional(),
  periods: z.array(PeriodSchema).optional(),
  league: LeagueSchema,
  events: z.array(EventSchema).optional(),
  xGFixture: XGFixtureSchema,
  odds: z.array(OddsSchema).optional(),
  has_odds: z.boolean().optional(),
  has_premium_odds: z.boolean().optional(),
  inplayodds: z.array(InplayOddsSchema).optional(),
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

// ─── League to Country Mapping (for flag emojis) ─────────────────────────────

const LEAGUE_COUNTRY_MAP: Record<number, string> = {
  // England
  8: 'GB', // Premier League
  384: 'GB', // Championship
  385: 'GB', // League One
  386: 'GB', // League Two
  // Spain
  564: 'ES', // La Liga
  // Germany
  82: 'DE', // Bundesliga
  // Italy
  207: 'IT', // Serie A
  // France
  301: 'FR', // Ligue 1
  // Portugal
  271: 'PT', // Primeira Liga
  // Netherlands
  72: 'NL', // Eredivisie
  // Belgium
  1399: 'BE', // Pro League
  // Add more as needed...
};

const COUNTRY_FLAGS: Record<string, string> = {
  'GB': '🇬🇧',
  'ES': '🇪🇸',
  'DE': '🇩🇪',
  'IT': '🇮🇹',
  'FR': '🇫🇷',
  'PT': '🇵🇹',
  'NL': '🇳🇱',
  'BE': '🇧🇪',
};

// ─── SportMonks Statistic Type IDs ───────────────────────────────────────────
//
// Note: Some statistics may not be available in live data depending on:
// - Subscription tier (e.g., xG requires Advanced xG add-on for live data)
// - Competition coverage (some leagues have more detailed stats than others)
// - Event type (knockout matches may not have standings/form data)
//
// Missing live stats:
// - xG: Requires Advanced xG add-on (otherwise available 12h+ post-match)
// - Form/Standings: Empty for knockout phases or non-league competitions
//
// Event Type IDs (not statistics):
// - 14 = Goal
// - 16 = Penalty scored
// - 17 = Penalty missed
// - 18 = Substitution
// - 22 = Penalty shootout missed
// - 23 = Penalty shootout scored

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
  FREE_KICKS: 55,
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
  // Verified from live API ✅
  CROSSES: 98, // Total Crosses
  ACCURATE_CROSSES: 99, // Accurate Crosses
  BIG_CHANCES: 580, // Big Chances Created
  BIG_CHANCES_MISSED: 581, // Big Chances Missed
  INTERCEPTIONS: 100,
  SUCCESSFUL_DRIBBLES: 109,
  DRIBBLES_PERCENTAGE: 1605,
  LONG_PASSES: 62,
  SUCCESSFUL_LONG_PASSES: 27264,
  LONG_PASSES_PERCENTAGE: 27265,
  ASSISTS: 79,
  TACKLES: 78,
  GOAL_ATTEMPTS: 54,
  SUCCESSFUL_HEADERS: 65,
  BALL_SAFE: 46,
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
        // Note: xGFixture requires specific add-on (not included in Advanced plan by default)
        // VERIFIED: Adding xGFixture returns 403 Forbidden (subscription doesn't have access)
        // Note: participants.latest gives form/recent fixtures (array of up to 40 fixtures)
        // Note: participants.latest.scores required for pre-match metrics calculation
        // Note: participants.latest.statistics for corners & shots data (types 34, 42, 86)
        // standings must be fetched separately via season endpoint
        const response = await fetch(
          `${this.baseUrl}/livescores/inplay?api_token=${this.apiKey}&include=state;periods;scores;participants;statistics.type;league;events;participants.latest.scores;participants.latest.statistics`,
        );

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Error(
            `SportMonks fixtures request failed: ${response.status} ${response.statusText} — ${body}`,
          );
        }

        json = await response.json();

        // Debug: log first fixture structure (disabled to reduce log noise)
        // if (json.data && json.data[0]) {
        //   console.log('[ProviderService] Sample fixture structure:', JSON.stringify(json.data[0], null, 2));
        // }
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
   * Fetches the 5 most recent completed fixtures for a team.
   * Uses the "fixtures between dates for team" endpoint with sorting.
   *
   * @param teamId - The team ID to fetch fixtures for
   * @returns Array of up to 5 most recent completed fixtures
   */
  async fetchRecentFixtures(teamId: number): Promise<any[]> {
    try {
      // Define date range: last 365 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 365);

      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const start = formatDate(startDate);
      const end = formatDate(endDate);

      // Use the dedicated "fixtures between dates for team" endpoint
      // sortBy=starting_at + order=desc = most recent first
      // We'll filter for completed matches after fetching
      // Include scores + statistics (corners, shots) + events (for per-period corner calculation)
      // Events are needed to split corners by half (minute <= 45 = 1H, > 45 = 2H)
      const url = `${this.baseUrl}/fixtures/between/${start}/${end}/${teamId}?api_token=${this.apiKey}&include=participants,scores,statistics,events&sortBy=starting_at&order=desc`;
      console.log(`[ProviderService] Fetching recent fixtures: /fixtures/between/${start}/${end}/${teamId}`);

      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`[ProviderService] Failed to fetch recent fixtures for team ${teamId}: ${response.status}`);
        return [];
      }

      const json = await response.json() as any;
      const allFixtures = json.data || [];

      // Filter for completed matches (state_id === 5) and take first 10 (for L10 metrics)
      const completedFixtures = allFixtures
        .filter((f: any) => f.state_id === 5)
        .slice(0, 10);

      return completedFixtures;
    } catch (error) {
      console.error(`[ProviderService] Error fetching recent fixtures for team ${teamId}:`, error);
      return [];
    }
  }

  /**
   * Fetches head-to-head fixtures between two teams.
   * Returns up to 5 most recent completed H2H matches.
   */
  async fetchH2HFixtures(teamId1: number, teamId2: number): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/fixtures/head-to-head/${teamId1}/${teamId2}?api_token=${this.apiKey}&include=participants,scores,statistics,events&sortBy=starting_at&order=desc`;
      console.log(`[ProviderService] Fetching H2H fixtures: /fixtures/head-to-head/${teamId1}/${teamId2}`);

      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`[ProviderService] Failed to fetch H2H fixtures: ${response.status}`);
        return [];
      }

      const json = await response.json() as any;
      const allFixtures = json.data || [];

      // Filter for completed matches and take first 5
      const completedFixtures = allFixtures
        .filter((f: any) => f.state_id === 5)
        .slice(0, 5);

      console.log(`[ProviderService] Found ${completedFixtures.length} H2H fixtures`);
      return completedFixtures;
    } catch (error) {
      console.error(`[ProviderService] Error fetching H2H fixtures:`, error);
      return [];
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
   * Fetches and parses pre-match odds for a specific fixture.
   * Returns a flat oddsData map (same keys as match.odds).
   * Pre-match odds don't change once a match starts — cache the result in the scanner.
   */
  async fetchPreMatchOddsData(fixtureId: number): Promise<Record<string, number>> {
    try {
      let pmOddsArray: any[] = [];

      if (config.useMockData) {
        return {};
      }

      const response = await fetch(
        `${this.baseUrl}/fixtures/${fixtureId}?api_token=${this.apiKey}&include=odds`,
      );
      if (!response.ok) {
        console.warn(`[ProviderService] Pre-match odds fetch failed for fixture ${fixtureId}: ${response.status}`);
        return {};
      }
      const json = await response.json();
      pmOddsArray = json?.data?.odds ?? [];

      const oddsData: Record<string, number> = {};

      const getOldest = (odds: any[], label: string, marketId: number) => {
        const filtered = odds.filter((o) => o?.market_id === marketId && o?.label === label);
        if (filtered.length === 0) return null;
        return filtered.sort((a: any, b: any) =>
          (a?.created_at ? new Date(a.created_at).getTime() : 0) -
          (b?.created_at ? new Date(b.created_at).getTime() : 0)
        )[0];
      };

      const oldestByLabel = (odds: any[], label: string) => {
        const filtered = odds.filter((o) => o?.label === label);
        if (filtered.length === 0) return null;
        return filtered.sort((a: any, b: any) =>
          (a?.created_at ? new Date(a.created_at).getTime() : 0) -
          (b?.created_at ? new Date(b.created_at).getTime() : 0)
        )[0];
      };

      const toKeySuffix = (total: string) =>
        total.includes('.') ? total.replace('.', '_') : total + '_0';

      const extractOuByLine = (marketOdds: any[], keyPrefix: string) => {
        const lines = [...new Set(marketOdds.map((o) => o?.total).filter(Boolean))] as string[];
        for (const line of lines) {
          const lineOdds = marketOdds.filter((o) => o?.total === line);
          const over = oldestByLabel(lineOdds, 'Over');
          const under = oldestByLabel(lineOdds, 'Under');
          const suffix = toKeySuffix(line);
          if (over?.value) oddsData[`${keyPrefix}_over_${suffix}`] = parseFloat(over.value);
          if (under?.value) oddsData[`${keyPrefix}_under_${suffix}`] = parseFloat(under.value);
        }
      };

      const pmHome = getOldest(pmOddsArray, 'Home', 1);
      const pmDraw = getOldest(pmOddsArray, 'Draw', 1);
      const pmAway = getOldest(pmOddsArray, 'Away', 1);
      if (pmHome?.value) oddsData.home_pm_odds_1x2 = parseFloat(pmHome.value);
      if (pmDraw?.value) oddsData.pm_odds_1x2_draw = parseFloat(pmDraw.value);
      if (pmAway?.value) oddsData.away_pm_odds_1x2 = parseFloat(pmAway.value);

      extractOuByLine(pmOddsArray.filter((o) => o?.market_id === 80), 'pm_odds_match_goals');

      const pmHtHome = getOldest(pmOddsArray, 'Home', 31);
      const pmHtDraw = getOldest(pmOddsArray, 'Draw', 31);
      const pmHtAway = getOldest(pmOddsArray, 'Away', 31);
      if (pmHtHome?.value) oddsData.home_pm_odds_ht_result = parseFloat(pmHtHome.value);
      if (pmHtDraw?.value) oddsData.pm_odds_ht_result_draw = parseFloat(pmHtDraw.value);
      if (pmHtAway?.value) oddsData.away_pm_odds_ht_result = parseFloat(pmHtAway.value);

      extractOuByLine(pmOddsArray.filter((o) => o?.market_id === 28), 'pm_odds_1h_goals');

      const pmBttsYes = getOldest(pmOddsArray, 'Yes', 14);
      const pmBttsNo  = getOldest(pmOddsArray, 'No',  14);
      if (pmBttsYes?.value) oddsData.pm_odds_btts_yes = parseFloat(pmBttsYes.value);
      if (pmBttsNo?.value)  oddsData.pm_odds_btts_no  = parseFloat(pmBttsNo.value);

      const pmOddGoals  = getOldest(pmOddsArray, 'Odd',  44);
      const pmEvenGoals = getOldest(pmOddsArray, 'Even', 44);
      if (pmOddGoals?.value)  oddsData.pm_odds_odd_goals  = parseFloat(pmOddGoals.value);
      if (pmEvenGoals?.value) oddsData.pm_odds_even_goals = parseFloat(pmEvenGoals.value);

      extractOuByLine(pmOddsArray.filter((o) => o?.market_id === 67), 'pm_odds_corners');
      extractOuByLine(pmOddsArray.filter((o) => o?.market_id === 70), 'pm_odds_corners_1h');

      return oddsData;
    } catch (err) {
      console.warn(`[ProviderService] fetchPreMatchOddsData error for fixture ${fixtureId}:`, err);
      return {};
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
  async normalizeToMatchSnapshot(fixture: Fixture): Promise<MatchSnapshot> {
    // Safely access optional fields
    const participants = fixture.participants ?? [];
    const scores = fixture.scores ?? [];
    const state = fixture.state ?? { state: 'UNKNOWN' };
    const statistics = fixture.statistics ?? [];
    const periods = fixture.periods ?? [];

    // Find home and away participants
    const homeParticipant = participants.find((p) => p.meta.location === 'home');
    const awayParticipant = participants.find((p) => p.meta.location === 'away');

    if (!homeParticipant || !awayParticipant) {
      console.warn(`[ProviderService] Missing participants for fixture ${fixture.id}, skipping`);
      throw new Error(`Missing participants for fixture ${fixture.id}`);
    }

    // Get CURRENT scores (not HT, not FT, but the live current score)
    // SportMonks score types:
    // - type_id 1477 or description 'CURRENT' = current live score
    // - type_id 8 = halftime score
    // - type_id 14 = full-time score
    // - type_id 1540 = extra time score

    // First try to find CURRENT score (live score)
    let homeScoreObj = scores.find((s) =>
      (s.description === 'CURRENT' || (s as any).type_id === 1477) &&
      (s.score?.participant === 'home' || (s as any).participant === 'home')
    );
    let awayScoreObj = scores.find((s) =>
      (s.description === 'CURRENT' || (s as any).type_id === 1477) &&
      (s.score?.participant === 'away' || (s as any).participant === 'away')
    );

    // Fallback: if no CURRENT score, take any score for home/away (for mock data)
    if (!homeScoreObj) {
      homeScoreObj = scores.find((s) =>
        s.score?.participant === 'home' || (s as any).participant === 'home'
      );
    }
    if (!awayScoreObj) {
      awayScoreObj = scores.find((s) =>
        s.score?.participant === 'away' || (s as any).participant === 'away'
      );
    }

    // Extract goals from either nested (API) or flat (mock) structure
    const homeScore = homeScoreObj?.score?.goals ?? (homeScoreObj as any)?.goals ?? 0;
    const awayScore = awayScoreObj?.score?.goals ?? (awayScoreObj as any)?.goals ?? 0;

    // Get current minute using shared timer utility
    const validPeriods = periods.filter((p): p is NonNullable<typeof p> => p != null);
    const minute = validPeriods.length > 0
      ? calculateMatchMinute(validPeriods as any)
      : ((state as any).minute ?? 0); // Fallback to state.minute for mocks

    // Extract IN_PLAY metrics from statistics
    const inPlay: Record<string, number> = {
      home_goals: homeScore,
      away_goals: awayScore,
      match_timer: minute, // Match Timer (Minute) from periods
    };

    // Extract xG from xGFixture (if available with Advanced plan)
    if (fixture.xGFixture) {
      if (fixture.xGFixture.home?.total !== undefined && fixture.xGFixture.home.total !== null) {
        inPlay.home_xg = fixture.xGFixture.home.total;
      }
      if (fixture.xGFixture.away?.total !== undefined && fixture.xGFixture.away.total !== null) {
        inPlay.away_xg = fixture.xGFixture.away.total;
      }
    }

    // Group statistics by type_id and location
    for (const stat of statistics) {
      const statName = this.getStatNameFromTypeId(stat.type_id);
      if (!statName) continue;

      // New API format: individual records with location and data.value
      if (stat.location && stat.data?.value !== undefined && stat.data.value !== null) {
        const prefix = stat.location; // 'home' or 'away'
        inPlay[`${prefix}_${statName}`] = this.parseStatValue(stat.data.value);
      }
      // Old mock format: single record with value.home and value.away
      else if (stat.value) {
        if (stat.value.home !== undefined && stat.value.home !== null) {
          inPlay[`home_${statName}`] = this.parseStatValue(stat.value.home);
        }
        if (stat.value.away !== undefined && stat.value.away !== null) {
          inPlay[`away_${statName}`] = this.parseStatValue(stat.value.away);
        }
      }
    }

    // Set default values for stats that might not be present when value is 0
    // SportMonks doesn't send stats with 0 values, so we need to default them
    // Cards (yellow/red) should default to 0 if not present
    if (inPlay.home_yellow_cards === undefined) inPlay.home_yellow_cards = 0;
    if (inPlay.away_yellow_cards === undefined) inPlay.away_yellow_cards = 0;
    if (inPlay.home_red_cards === undefined) inPlay.home_red_cards = 0;
    if (inPlay.away_red_cards === undefined) inPlay.away_red_cards = 0;

    // Determine if match is live
    const isLive = state.state ? state.state.includes('INPLAY') || state.state === 'HT' : false;

    // Extract league info
    const league = fixture.league?.name;
    const leagueCountry = fixture.league?.id ? LEAGUE_COUNTRY_MAP[fixture.league.id] : undefined;

    // Extract positions from standings cache
    // Fetch standings for this season (cached for 1 hour)
    let homePosition: number | undefined;
    let awayPosition: number | undefined;

    if (fixture.season_id) {
      try {
        homePosition = await getTeamPosition(fixture.season_id, homeParticipant.id);
        awayPosition = await getTeamPosition(fixture.season_id, awayParticipant.id);
      } catch (error) {
        console.warn(`[ProviderService] Failed to fetch positions for season ${fixture.season_id}:`, error);
      }
    }

    // Extract form and calculate pre-match metrics from participants.latest
    // participants.latest is an array of recent fixtures (up to 40) already included in the API response
    // Now includes .scores and .statistics (corners, shots) via the includes parameter
    let homeForm: string[] | undefined;
    let awayForm: string[] | undefined;
    let preMatchData: Record<string, number> = {};

    try {
      // Use participants.latest directly (already fetched in livescores/inplay)
      const homeRecentFixtures = Array.isArray(homeParticipant.latest) ? homeParticipant.latest : [];
      const awayRecentFixtures = Array.isArray(awayParticipant.latest) ? awayParticipant.latest : [];

      if (homeRecentFixtures.length === 0 || awayRecentFixtures.length === 0) {
        console.warn('[ProviderService] participants.latest is empty, cannot extract form');
      }

      homeForm = this.extractFormFromFixtures(homeRecentFixtures, homeParticipant.id);
      awayForm = this.extractFormFromFixtures(awayRecentFixtures, awayParticipant.id);

      // Fetch H2H fixtures for head-to-head metrics
      const h2hFixtures = await this.fetchH2HFixtures(homeParticipant.id, awayParticipant.id);

      // Calculate pre-match metrics from recent fixtures
      const preMatchMetrics = calculatePreMatchMetrics(
        homeRecentFixtures,
        awayRecentFixtures,
        homeParticipant.id,
        awayParticipant.id,
        h2hFixtures,
      );

      // Flatten to single object with home_* and away_* prefixes
      preMatchData = {
        ...Object.entries(preMatchMetrics.home).reduce((acc, [key, val]) => {
          if (val !== null) acc[`home_${key}`] = val;
          return acc;
        }, {} as Record<string, number>),
        ...Object.entries(preMatchMetrics.away).reduce((acc, [key, val]) => {
          if (val !== null) acc[`away_${key}`] = val;
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      console.warn('[ProviderService] Failed to extract form or calculate pre-match metrics:', error);
    }

    // Process events (goals, substitutions, cards)
    const events = fixture.events ?? [];

    // Find last goal from events
    const goalEvents = events
      .filter((e) => e?.type_id === 14) // 14 = Goal event type
      .sort((a, b) => (b?.minute ?? 0) - (a?.minute ?? 0)); // Most recent first

    const lastGoalEvent = goalEvents[0];
    let lastGoal: { team: 'home' | 'away'; minute: number; minutesAgo?: number } | undefined;

    if (lastGoalEvent && lastGoalEvent.minute !== undefined) {
      const goalTeam = lastGoalEvent.participant_id === homeParticipant.id ? 'home' : 'away';
      lastGoal = {
        team: goalTeam,
        minute: lastGoalEvent.minute,
        minutesAgo: minute - lastGoalEvent.minute,
      };
    }

    // Count substitutions from events (type_id 18 = substitution)
    const substitutionEvents = events.filter((e) => e?.type_id === 18);
    const homeSubstitutions = substitutionEvents.filter((e) => e?.participant_id === homeParticipant.id).length;
    const awaySubstitutions = substitutionEvents.filter((e) => e?.participant_id === awayParticipant.id).length;

    // Always add substitutions to inPlay (even if 0)
    inPlay.home_substitutions = homeSubstitutions;
    inPlay.away_substitutions = awaySubstitutions;

    // Count injuries from substitution events (type_id 18 with injured: true)
    const injuryEvents = substitutionEvents.filter((e) => e?.injured === true);
    const homeInjuries = injuryEvents.filter((e) => e?.participant_id === homeParticipant.id).length;
    const awayInjuries = injuryEvents.filter((e) => e?.participant_id === awayParticipant.id).length;

    // Always add injuries to inPlay (even if 0)
    inPlay.home_injuries = homeInjuries;
    inPlay.away_injuries = awayInjuries;

    // Count penalties from events (type_id 16 = scored, 17 = missed)
    const penaltyEvents = events.filter((e) => e?.type_id === 16 || e?.type_id === 17);
    const homePenalties = penaltyEvents.filter((e) => e?.participant_id === homeParticipant.id).length;
    const awayPenalties = penaltyEvents.filter((e) => e?.participant_id === awayParticipant.id).length;

    // Add penalties to inPlay if we have them from events
    if (homePenalties > 0 || awayPenalties > 0) {
      inPlay.home_penalties = homePenalties;
      inPlay.away_penalties = awayPenalties;
    }

    // Find half-time score (ONLY type_id 8, not CURRENT!)
    const halfTimeScores = scores.filter((s) => (s as any).type_id === 8); // 8 = HT score ONLY
    const htHomeScore = halfTimeScores.find((s) =>
      s.score?.participant === 'home' || (s as any).participant === 'home'
    );
    const htAwayScore = halfTimeScores.find((s) =>
      s.score?.participant === 'away' || (s as any).participant === 'away'
    );

    const halfTimeScore = htHomeScore && htAwayScore ? {
      home: htHomeScore.score?.goals ?? (htHomeScore as any).goals ?? 0,
      away: htAwayScore.score?.goals ?? (htAwayScore as any).goals ?? 0,
    } : undefined;

    // Calculate momentum (simple formula based on recent attacking stats)
    const homeMomentum = this.calculateMomentum(inPlay, 'home');
    const awayMomentum = this.calculateMomentum(inPlay, 'away');

    if (homeMomentum !== null) inPlay.home_momentum = homeMomentum;
    if (awayMomentum !== null) inPlay.away_momentum = awayMomentum;

    // Add Match Context metrics to inPlay for rule evaluation
    // These are used by the rule engine for Match Context rules

    // 1. Minutes since last goal
    if (lastGoal && lastGoal.minutesAgo !== undefined) {
      inPlay.minutes_since_last_goal = lastGoal.minutesAgo;
    }

    // 2. League positions (for both home and away)
    if (homePosition !== undefined) {
      inPlay.home_league_position = homePosition;
    }
    if (awayPosition !== undefined) {
      inPlay.away_league_position = awayPosition;
    }

    // 3. Exchange Matched Amount
    // TODO: This requires integration with Betfair/Betdaq API
    // For now, we set it to 0 if not available
    // inPlay.exchange_matched_amount = 0;

    // ─── Extract odds ─────────────────────────────────────────────
    const oddsData: Record<string, number> = {};

    // PRE-MATCH ODDS — from fixture.odds (multiple bookmaker snapshots, oldest = opening line)
    const pmOddsArray: any[] = fixture.odds ?? [];

    const getOldest = (odds: any[], label: string, marketId: number) => {
      const filtered = odds.filter((o) => o?.market_id === marketId && o?.label === label);
      if (filtered.length === 0) return null;
      return filtered.sort((a, b) => {
        const tA = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const tB = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return tA - tB;
      })[0];
    };

    // Pre-match 1X2 (market 1, labels "Home"/"Draw"/"Away")
    const pmHome = getOldest(pmOddsArray, 'Home', 1);
    const pmDraw = getOldest(pmOddsArray, 'Draw', 1);
    const pmAway = getOldest(pmOddsArray, 'Away', 1);
    if (pmHome?.value) oddsData.home_pm_odds_1x2 = parseFloat(pmHome.value);
    if (pmDraw?.value) oddsData.pm_odds_1x2_draw = parseFloat(pmDraw.value);
    if (pmAway?.value) oddsData.away_pm_odds_1x2 = parseFloat(pmAway.value);

    // Helper: from a filtered list, pick oldest entry per label
    const oldestByLabel = (odds: any[], label: string) => {
      const filtered = odds.filter((o) => o?.label === label);
      if (filtered.length === 0) return null;
      return filtered.sort((a: any, b: any) =>
        (a?.created_at ? new Date(a.created_at).getTime() : 0) -
        (b?.created_at ? new Date(b.created_at).getTime() : 0)
      )[0];
    };

    // Helper: total string → key suffix ("8.5" → "8_5", "8" → "8_0")
    const toKeySuffix = (total: string) =>
      total.includes('.') ? total.replace('.', '_') : total + '_0';

    // Helper: extract Over/Under by line from a market's odds
    const extractOuByLine = (marketOdds: any[], keyPrefix: string) => {
      const lines = [...new Set(marketOdds.map((o) => o?.total).filter(Boolean))] as string[];
      for (const line of lines) {
        const lineOdds = marketOdds.filter((o) => o?.total === line);
        const over = oldestByLabel(lineOdds, 'Over');
        const under = oldestByLabel(lineOdds, 'Under');
        const suffix = toKeySuffix(line);
        if (over?.value) oddsData[`${keyPrefix}_over_${suffix}`] = parseFloat(over.value);
        if (under?.value) oddsData[`${keyPrefix}_under_${suffix}`] = parseFloat(under.value);
      }
    };

    // Pre-match Goals O/U (market 80, labels "Over"/"Under", total = line)
    extractOuByLine(pmOddsArray.filter((o) => o?.market_id === 80), 'pm_odds_match_goals');

    // Pre-match HT Result (market 31, labels "Home"/"Draw"/"Away")
    const pmHtHome = getOldest(pmOddsArray, 'Home', 31);
    const pmHtDraw = getOldest(pmOddsArray, 'Draw', 31);
    const pmHtAway = getOldest(pmOddsArray, 'Away', 31);
    if (pmHtHome?.value) oddsData.home_pm_odds_ht_result = parseFloat(pmHtHome.value);
    if (pmHtDraw?.value) oddsData.pm_odds_ht_result_draw = parseFloat(pmHtDraw.value);
    if (pmHtAway?.value) oddsData.away_pm_odds_ht_result = parseFloat(pmHtAway.value);

    // Pre-match 1H Goals O/U (market 28)
    extractOuByLine(pmOddsArray.filter((o) => o?.market_id === 28), 'pm_odds_1h_goals');

    // Pre-match BTTS (market 14)
    const pmBttsYes = getOldest(pmOddsArray, 'Yes', 14);
    const pmBttsNo  = getOldest(pmOddsArray, 'No', 14);
    if (pmBttsYes?.value) oddsData.pm_odds_btts_yes = parseFloat(pmBttsYes.value);
    if (pmBttsNo?.value)  oddsData.pm_odds_btts_no  = parseFloat(pmBttsNo.value);

    // Pre-match BTTS 1H (market 15)
    const pmBtts1hYes = getOldest(pmOddsArray, 'Yes', 15);
    const pmBtts1hNo  = getOldest(pmOddsArray, 'No', 15);
    if (pmBtts1hYes?.value) oddsData.pm_odds_btts_1h_yes = parseFloat(pmBtts1hYes.value);
    if (pmBtts1hNo?.value)  oddsData.pm_odds_btts_1h_no  = parseFloat(pmBtts1hNo.value);

    // Pre-match Odd/Even Goals (market 44)
    const pmOddGoals  = getOldest(pmOddsArray, 'Odd', 44);
    const pmEvenGoals = getOldest(pmOddsArray, 'Even', 44);
    if (pmOddGoals?.value)  oddsData.pm_odds_odd_goals  = parseFloat(pmOddGoals.value);
    if (pmEvenGoals?.value) oddsData.pm_odds_even_goals = parseFloat(pmEvenGoals.value);

    // Pre-match Corners O/U (market 67, labels "Over"/"Under", total = line)
    extractOuByLine(pmOddsArray.filter((o) => o?.market_id === 67), 'pm_odds_corners');

    // Pre-match 1H Corners O/U (market 70)
    extractOuByLine(pmOddsArray.filter((o) => o?.market_id === 70), 'pm_odds_corners_1h');

    // LIVE (IN-PLAY) ODDS — from fixture.inplayodds
    // Labels for 1X2: "1" (home), "X" (draw), "2" (away)
    const liveOddsArray: any[] = fixture.inplayodds ?? [];

    const getLiveOdd = (marketId: number, label: string, total?: string) =>
      liveOddsArray.find((o) =>
        o?.market_id === marketId &&
        o?.label === label &&
        (total === undefined || o?.total === total)
      );

    // Live 1X2 (market 1)
    const liveHome = getLiveOdd(1, '1');
    const liveDraw = getLiveOdd(1, 'X');
    const liveAway = getLiveOdd(1, '2');
    if (liveHome?.value) oddsData.home_live_odds_1x2 = parseFloat(liveHome.value);
    if (liveDraw?.value) oddsData.live_odds_1x2_draw = parseFloat(liveDraw.value);
    if (liveAway?.value) oddsData.away_live_odds_1x2 = parseFloat(liveAway.value);

    // Live HT Result (market 31, same labels "1"/"X"/"2")
    const liveHtHome = getLiveOdd(31, '1');
    const liveHtDraw = getLiveOdd(31, 'X');
    const liveHtAway = getLiveOdd(31, '2');
    if (liveHtHome?.value) oddsData.home_live_odds_ht_result = parseFloat(liveHtHome.value);
    if (liveHtDraw?.value) oddsData.live_odds_ht_result_draw = parseFloat(liveHtDraw.value);
    if (liveHtAway?.value) oddsData.away_live_odds_ht_result = parseFloat(liveHtAway.value);

    // Live Goals O/U (market 4 basic + market 7 extended, labels "Over"/"Under", total = line)
    const liveGoalOdds = liveOddsArray.filter((o) => o?.market_id === 4 || o?.market_id === 7);
    const liveGoalLines = [...new Set(liveGoalOdds.map((o) => o?.total).filter(Boolean))];
    for (const line of liveGoalLines) {
      const keySuffix = (line as string).replace('.', '_');
      const over = liveGoalOdds.find((o) => o?.total === line && o?.label === 'Over');
      const under = liveGoalOdds.find((o) => o?.total === line && o?.label === 'Under');
      if (over?.value) oddsData[`live_odds_match_goals_over_${keySuffix}`] = parseFloat(over.value);
      if (under?.value) oddsData[`live_odds_match_goals_under_${keySuffix}`] = parseFloat(under.value);
    }

    // Live 1st Half Goals (market 28)
    const live1hGoalOdds = liveOddsArray.filter((o) => o?.market_id === 28);
    const live1hLines = [...new Set(live1hGoalOdds.map((o) => o?.total).filter(Boolean))];
    for (const line of live1hLines) {
      const keySuffix = (line as string).replace('.', '_');
      const over = live1hGoalOdds.find((o) => o?.total === line && o?.label === 'Over');
      const under = live1hGoalOdds.find((o) => o?.total === line && o?.label === 'Under');
      if (over?.value) oddsData[`live_odds_1h_goals_over_${keySuffix}`] = parseFloat(over.value);
      if (under?.value) oddsData[`live_odds_1h_goals_under_${keySuffix}`] = parseFloat(under.value);
    }

    // Live BTTS (market 14)
    const liveBttsYes = getLiveOdd(14, 'Yes');
    const liveBttsNo  = getLiveOdd(14, 'No');
    if (liveBttsYes?.value) oddsData.live_odds_btts_yes = parseFloat(liveBttsYes.value);
    if (liveBttsNo?.value)  oddsData.live_odds_btts_no  = parseFloat(liveBttsNo.value);

    // Live BTTS 1st Half (market 15)
    const liveBtts1hYes = getLiveOdd(15, 'Yes');
    const liveBtts1hNo  = getLiveOdd(15, 'No');
    if (liveBtts1hYes?.value) oddsData.live_odds_btts_1h_yes = parseFloat(liveBtts1hYes.value);
    if (liveBtts1hNo?.value)  oddsData.live_odds_btts_1h_no  = parseFloat(liveBtts1hNo.value);

    // Live BTTS 2nd Half (market 16)
    const liveBtts2hYes = getLiveOdd(16, 'Yes');
    const liveBtts2hNo  = getLiveOdd(16, 'No');
    if (liveBtts2hYes?.value) oddsData.live_odds_btts_2h_yes = parseFloat(liveBtts2hYes.value);
    if (liveBtts2hNo?.value)  oddsData.live_odds_btts_2h_no  = parseFloat(liveBtts2hNo.value);

    // Live Goals Odd/Even (market 12)
    const liveOdd  = getLiveOdd(12, 'Odd');
    const liveEven = getLiveOdd(12, 'Even');
    if (liveOdd?.value)  oddsData.live_odds_odd_goals  = parseFloat(liveOdd.value);
    if (liveEven?.value) oddsData.live_odds_even_goals = parseFloat(liveEven.value);

    // Live Match Corners (market 68, labels "Over"/"Under", total = line)
    const liveCornerOdds = liveOddsArray.filter((o) => o?.market_id === 68);
    const liveCornerLines = [...new Set(liveCornerOdds.map((o) => o?.total).filter(Boolean))];
    for (const line of liveCornerLines) {
      const keySuffix = (line as string).replace('.', '_');
      const over  = liveCornerOdds.find((o) => o?.total === line && o?.label === 'Over');
      const under = liveCornerOdds.find((o) => o?.total === line && o?.label === 'Under');
      if (over?.value)  oddsData[`live_odds_corners_over_${keySuffix}`]  = parseFloat(over.value);
      if (under?.value) oddsData[`live_odds_corners_under_${keySuffix}`] = parseFloat(under.value);
    }

    // Live 1st Half Corners (market 70)
    const live1hCornerOdds = liveOddsArray.filter((o) => o?.market_id === 70);
    const live1hCornerLines = [...new Set(live1hCornerOdds.map((o) => o?.total).filter(Boolean))];
    for (const line of live1hCornerLines) {
      const keySuffix = (line as string).replace('.', '_');
      const over  = live1hCornerOdds.find((o) => o?.total === line && o?.label === 'Over');
      const under = live1hCornerOdds.find((o) => o?.total === line && o?.label === 'Under');
      if (over?.value)  oddsData[`live_odds_corners_1h_over_${keySuffix}`]  = parseFloat(over.value);
      if (under?.value) oddsData[`live_odds_corners_1h_under_${keySuffix}`] = parseFloat(under.value);
    }

    return {
      id: fixture.id.toString(),
      homeTeam: homeParticipant.name,
      awayTeam: awayParticipant.name,
      homeScore,
      awayScore,
      minute,
      isLive,
      isHalftime: state?.state === 'HT',
      league,
      leagueId: fixture.league?.id,
      leagueCountry,
      homePosition,
      awayPosition,
      homeForm,
      awayForm,
      lastGoal,
      halfTimeScore,
      inPlay,
      preMatch: preMatchData,
      odds: oddsData,
    };
  }

  /**
   * Extracts form (W/L/D) from recent fixtures.
   * Returns array of ['W', 'L', 'D', 'W', 'L'] representing last 5 matches.
   *
   * result_info examples:
   * - "Game ended in draw" → Draw
   * - "São Paulo won after full-time" → São Paulo won
   * - "Flamengo won after full-time" → Flamengo won
   */
  private extractFormFromFixtures(fixtures: any[], participantId: number): string[] | undefined {
    if (!Array.isArray(fixtures) || fixtures.length === 0) return undefined;

    const form: string[] = [];

    for (const fixture of fixtures.slice(0, 5)) {
      const resultInfo = fixture.result_info?.toLowerCase() || '';
      const fixtureName = fixture.name || '';

      // Skip if we can't determine the result or fixture name
      if (!resultInfo || !fixtureName) continue;

      // Parse fixture name to get team names
      // Format: "Team A vs Team B"
      const teams = fixtureName.split(' vs ');
      if (teams.length !== 2) continue;

      const homeTeamName = teams[0].trim().toLowerCase();
      const awayTeamName = teams[1].trim().toLowerCase();

      // Determine where THIS participant played
      // First try to use meta.location if available
      let location = fixture.meta?.location;

      // If meta.location not available, determine from participants array
      if (!location && fixture.participants) {
        const participant = fixture.participants.find((p: any) => p.id === participantId);
        location = participant?.meta?.location;
      }

      // If still no location, try to infer from fixture name by checking team name match
      // This is a fallback but less reliable for teams with similar names
      if (!location) {
        // Skip this fixture if we can't determine location
        continue;
      }

      // Check for draw first
      if (resultInfo.includes('draw')) {
        form.push('D');
        continue;
      }

      // Determine result based on which team won and where we played
      if (resultInfo.includes('won')) {
        // Check which team won
        const homeWon = resultInfo.includes(homeTeamName);
        const awayWon = resultInfo.includes(awayTeamName);

        if (homeWon && location === 'home') {
          form.push('W'); // We played home and won
        } else if (awayWon && location === 'away') {
          form.push('W'); // We played away and won
        } else if (homeWon && location === 'away') {
          form.push('L'); // Home won but we were away
        } else if (awayWon && location === 'home') {
          form.push('L'); // Away won but we were home
        }
      }
    }

    return form.length > 0 ? form : undefined;
  }

  /**
   * Calculates momentum score for a team based on attacking stats.
   * Simple formula: (dangerous_attacks * 2) + attacks + (shots_on_target * 3)
   */
  private calculateMomentum(inPlay: Record<string, number>, team: 'home' | 'away'): number | null {
    const dangerousAttacks = inPlay[`${team}_dangerous_attacks`] ?? 0;
    const attacks = inPlay[`${team}_attacks`] ?? 0;
    const shotsOnTarget = inPlay[`${team}_shots_on_target`] ?? 0;

    // Return null if we don't have enough data
    if (!dangerousAttacks && !attacks && !shotsOnTarget) return null;

    return Math.round((dangerousAttacks * 2) + attacks + (shotsOnTarget * 3));
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
      [SPORTMONKS_STAT_IDS.FREE_KICKS]: 'free_kicks',
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
      [SPORTMONKS_STAT_IDS.CROSSES]: 'crosses',
      [SPORTMONKS_STAT_IDS.ACCURATE_CROSSES]: 'crosses_accurate',
      [SPORTMONKS_STAT_IDS.BIG_CHANCES]: 'big_chances',
      [SPORTMONKS_STAT_IDS.BIG_CHANCES_MISSED]: 'big_chances_missed',
      [SPORTMONKS_STAT_IDS.INTERCEPTIONS]: 'interceptions',
      [SPORTMONKS_STAT_IDS.SUCCESSFUL_DRIBBLES]: 'successful_dribbles',
      [SPORTMONKS_STAT_IDS.DRIBBLES_PERCENTAGE]: 'dribbles_percentage',
      [SPORTMONKS_STAT_IDS.LONG_PASSES]: 'long_passes',
      [SPORTMONKS_STAT_IDS.SUCCESSFUL_LONG_PASSES]: 'long_passes_accurate',
      [SPORTMONKS_STAT_IDS.LONG_PASSES_PERCENTAGE]: 'long_passes_percentage',
      [SPORTMONKS_STAT_IDS.ASSISTS]: 'assists',
      [SPORTMONKS_STAT_IDS.TACKLES]: 'tackles',
      [SPORTMONKS_STAT_IDS.GOAL_ATTEMPTS]: 'goal_attempts',
      [SPORTMONKS_STAT_IDS.SUCCESSFUL_HEADERS]: 'successful_headers',
      [SPORTMONKS_STAT_IDS.BALL_SAFE]: 'ball_safe',
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
