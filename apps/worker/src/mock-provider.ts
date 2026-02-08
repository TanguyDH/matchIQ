import type { MatchSnapshot } from '@matchiq/shared-types';

/**
 * Mock match provider for Phase 5.
 * Generates fake live match data for testing.
 * Will be replaced with real API integration in later phases.
 */

interface MockMatchState {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  homeGoals: number;
  awayGoals: number;
  homeCorners: number;
  awayCorners: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homeYellowCards: number;
  awayYellowCards: number;
  homeRedCards: number;
  awayRedCards: number;
  homeFouls: number;
  awayFouls: number;
}

const mockMatches: MockMatchState[] = [
  {
    id: 'mock-match-11',
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    homeScore: 1,
    awayScore: 0,
    minute: 15,
    homeGoals: 1,
    awayGoals: 0,
    homeCorners: 3,
    awayCorners: 2,
    homeShots: 5,
    awayShots: 3,
    homeShotsOnTarget: 2,
    awayShotsOnTarget: 1,
    homeYellowCards: 1,
    awayYellowCards: 0,
    homeRedCards: 0,
    awayRedCards: 0,
    homeFouls: 3,
    awayFouls: 2,
  },
  {
    id: 'mock-match-22',
    homeTeam: 'Barcelona',
    awayTeam: 'Real Madrid',
    homeScore: 1,
    awayScore: 1,
    minute: 20,
    homeGoals: 1,
    awayGoals: 1,
    homeCorners: 4,
    awayCorners: 3,
    homeShots: 7,
    awayShots: 6,
    homeShotsOnTarget: 3,
    awayShotsOnTarget: 2,
    homeYellowCards: 2,
    awayYellowCards: 1,
    homeRedCards: 0,
    awayRedCards: 0,
    homeFouls: 5,
    awayFouls: 4,
  },
];

let tickCount = 0;

/**
 * Simulates match progression over time.
 * HIGH FREQUENCY MODE for testing - events happen frequently!
 */
function progressMatch(match: MockMatchState): void {
  // Progress minute
  if (match.minute < 90) {
    match.minute += Math.floor(Math.random() * 2) + 2; // +2-3 minutes per tick
  }

  // Random events (goals, corners, shots) - MUCH MORE FREQUENT for testing
  if (Math.random() > 0.3) {
    // ~70% chance of home corner
    match.homeCorners++;
  }
  if (Math.random() > 0.3) {
    // ~70% chance of away corner
    match.awayCorners++;
  }
  if (Math.random() > 0.2) {
    // ~80% chance of home shot
    match.homeShots++;
    if (Math.random() > 0.5) {
      // ~50% on target
      match.homeShotsOnTarget++;
    }
  }
  if (Math.random() > 0.2) {
    // ~80% chance of away shot
    match.awayShots++;
    if (Math.random() > 0.5) {
      match.awayShotsOnTarget++;
    }
  }

  // Goals - MUCH MORE FREQUENT for testing
  if (Math.random() > 0.7) {
    // ~30% chance of home goal
    match.homeGoals++;
    match.homeScore++;
  }
  if (Math.random() > 0.7) {
    // ~30% chance of away goal
    match.awayGoals++;
    match.awayScore++;
  }

  // Fouls
  if (Math.random() > 0.4) {
    // ~60% chance of home foul
    match.homeFouls++;
  }
  if (Math.random() > 0.4) {
    // ~60% chance of away foul
    match.awayFouls++;
  }

  // Yellow cards (less frequent)
  if (Math.random() > 0.85) {
    // ~15% chance of home yellow
    match.homeYellowCards++;
  }
  if (Math.random() > 0.85) {
    // ~15% chance of away yellow
    match.awayYellowCards++;
  }

  // Red cards (very rare)
  if (Math.random() > 0.98) {
    // ~2% chance of home red
    match.homeRedCards++;
  }
  if (Math.random() > 0.98) {
    // ~2% chance of away red
    match.awayRedCards++;
  }
}

/**
 * Fetches current live matches (mock implementation).
 * Simulates match progression over time.
 */
export function getLiveMatches(): MatchSnapshot[] {
  tickCount++;

  // Progress all matches
  for (const match of mockMatches) {
    progressMatch(match);
  }

  // Convert to MatchSnapshot format
  const snapshots: MatchSnapshot[] = mockMatches.map((match) => ({
    id: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    minute: match.minute,
    isLive: match.minute < 90,
    inPlay: {
      home_goals: match.homeGoals,
      away_goals: match.awayGoals,
      home_corners: match.homeCorners,
      away_corners: match.awayCorners,
      home_shots: match.homeShots,
      away_shots: match.awayShots,
      home_shots_on_target: match.homeShotsOnTarget,
      away_shots_on_target: match.awayShotsOnTarget,
      home_yellow_cards: match.homeYellowCards,
      away_yellow_cards: match.awayYellowCards,
      home_red_cards: match.homeRedCards,
      away_red_cards: match.awayRedCards,
      home_fouls: match.homeFouls,
      away_fouls: match.awayFouls,
    },
    preMatch: {},
    odds: {
      home_win: 2.1,
      away_win: 3.5,
      draw: 3.2,
    },
  }));

  console.log(
    `[MockProvider] Tick ${tickCount}: ${snapshots.length} live matches`,
  );
  return snapshots;
}

/**
 * Resets all mock matches to initial state.
 * Useful for testing.
 */
export function resetMockMatches(): void {
  tickCount = 0;
  for (const match of mockMatches) {
    match.homeScore = 0;
    match.awayScore = 0;
    match.minute = 0;
    match.homeGoals = 0;
    match.awayGoals = 0;
    match.homeCorners = 0;
    match.awayCorners = 0;
    match.homeShots = 0;
    match.awayShots = 0;
    match.homeShotsOnTarget = 0;
    match.awayShotsOnTarget = 0;
    match.homeYellowCards = 0;
    match.awayYellowCards = 0;
    match.homeRedCards = 0;
    match.awayRedCards = 0;
    match.homeFouls = 0;
    match.awayFouls = 0;
  }
  console.log('[MockProvider] Matches reset to initial state');
}
