import { Injectable } from '@nestjs/common';

export interface LiveMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  status: string;
  league: string;
}

interface Period {
  type_id: number;
  minutes?: number | null;
  ticking?: boolean;
  ended?: number | boolean | null;
}

/**
 * Calculates match minute from periods.
 * IMPORTANT: period.minutes is CUMULATIVE (total time since match start).
 */
function calculateMatchMinute(periods: Period[]): number {
  if (!periods || periods.length === 0) return 0;

  // Find the currently ticking period
  const tickingPeriod = periods.find(p => p?.ticking);
  if (tickingPeriod) {
    return tickingPeriod.minutes ?? 0;
  }

  // No ticking period - sum up completed periods
  let minute = 0;
  for (const period of periods) {
    if (!period || !period.ended) continue;

    if (period.type_id === 1) minute += 45;
    else if (period.type_id === 2) minute += 45;
    else if (period.type_id === 3) minute += 15;
    else if (period.type_id === 4) minute += 15;
    else minute += period.minutes ?? 0;
  }
  return minute;
}

@Injectable()
export class LiveMatchesService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.SPORTMONKS_API_KEY || '';
    this.baseUrl = process.env.SPORTMONKS_BASE_URL || 'https://api.sportmonks.com/v3/football';
  }

  async getLiveMatches(): Promise<LiveMatch[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/livescores/inplay?api_token=${this.apiKey}&include=state;periods;scores;participants;league`
      );

      if (!response.ok) {
        throw new Error(`SportMonks API error: ${response.status}`);
      }

      const data: any = await response.json();

      // Handle case where there are no live matches
      if (!data.data) {
        return [];
      }

      const liveMatches: LiveMatch[] = data.data.map((fixture: any) => {
        // Find home and away participants
        const homeParticipant = fixture.participants?.find((p: any) => p.meta?.location === 'home');
        const awayParticipant = fixture.participants?.find((p: any) => p.meta?.location === 'away');

        // Get CURRENT scores (not halftime, not full-time)
        // SportMonks score types: type_id 1477 or description 'CURRENT' = current live score
        let homeScoreObj = fixture.scores?.find((s: any) =>
          (s.description === 'CURRENT' || s.type_id === 1477) &&
          (s.score?.participant === 'home' || s.participant === 'home')
        );
        let awayScoreObj = fixture.scores?.find((s: any) =>
          (s.description === 'CURRENT' || s.type_id === 1477) &&
          (s.score?.participant === 'away' || s.participant === 'away')
        );

        // Fallback: if no CURRENT score found, take any home/away score
        if (!homeScoreObj) {
          homeScoreObj = fixture.scores?.find((s: any) =>
            s.score?.participant === 'home' || s.participant === 'home'
          );
        }
        if (!awayScoreObj) {
          awayScoreObj = fixture.scores?.find((s: any) =>
            s.score?.participant === 'away' || s.participant === 'away'
          );
        }

        // Calculate match minute using shared timer utility
        const periods = fixture.periods || [];
        const minute = calculateMatchMinute(periods);

        // Get state
        const stateName = fixture.state?.state || 'LIVE';

        return {
          id: fixture.id,
          homeTeam: homeParticipant?.name || 'Unknown',
          awayTeam: awayParticipant?.name || 'Unknown',
          homeScore: homeScoreObj?.score?.goals ?? 0,
          awayScore: awayScoreObj?.score?.goals ?? 0,
          minute,
          status: stateName,
          league: fixture.league?.name || 'Unknown League',
        };
      });

      return liveMatches;
    } catch (error) {
      console.error('[LiveMatchesService] Error fetching live matches:', error);
      throw error;
    }
  }
}
