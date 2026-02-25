import { config } from './config';

/**
 * In-memory cache for league standings.
 * Standings are fetched once per season and cached.
 */

interface Standing {
  participant_id: number; // SportMonks uses participant_id, not team_id
  position: number;
  points: number;
  played?: number;
  won?: number;
  draw?: number;
  lost?: number;
}

interface StandingsCache {
  standings: Standing[];
  fetchedAt: number; // timestamp
}

// Cache map: season_id -> standings
const cache = new Map<number, StandingsCache>();

// Cache TTL: 1 hour (standings don't change that often during a match)
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Fetches standings for a season from SportMonks API.
 */
async function fetchStandingsForSeason(seasonId: number): Promise<Standing[]> {
  try {
    const response = await fetch(
      `${config.sportmonks.baseUrl}/standings/seasons/${seasonId}?api_token=${config.sportmonks.key}`
    );

    if (!response.ok) {
      console.warn(`[StandingsCache] Failed to fetch standings for season ${seasonId}: ${response.status}`);
      return [];
    }

    const data = await response.json();

    // SportMonks returns standings in data array
    // Each standing has: team_id, position, points, played, won, draw, lost
    const standings = data.data || [];

    console.log(`[StandingsCache] Fetched ${standings.length} standings for season ${seasonId}`);

    return standings;
  } catch (error) {
    console.error(`[StandingsCache] Error fetching standings for season ${seasonId}:`, error);
    return [];
  }
}

/**
 * Gets standings for a season (from cache or fresh fetch).
 */
export async function getStandingsForSeason(seasonId: number): Promise<Standing[]> {
  const now = Date.now();
  const cached = cache.get(seasonId);

  // Return cached if still valid
  if (cached && (now - cached.fetchedAt) < CACHE_TTL_MS) {
    return cached.standings;
  }

  // Fetch fresh standings
  const standings = await fetchStandingsForSeason(seasonId);

  // Cache the result
  cache.set(seasonId, {
    standings,
    fetchedAt: now,
  });

  return standings;
}

/**
 * Gets position for a team (participant) in a season.
 */
export async function getTeamPosition(seasonId: number, participantId: number): Promise<number | undefined> {
  const standings = await getStandingsForSeason(seasonId);
  const standing = standings.find((s) => s.participant_id === participantId);

  return standing?.position;
}

/**
 * Clears the cache (useful for testing).
 */
export function clearStandingsCache(): void {
  cache.clear();
  console.log('[StandingsCache] Cache cleared');
}

/**
 * Gets cache stats (for monitoring).
 */
export function getCacheStats() {
  return {
    cachedSeasons: cache.size,
    seasons: Array.from(cache.keys()),
  };
}
