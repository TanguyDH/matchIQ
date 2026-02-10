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
        `${this.baseUrl}/livescores/inplay?api_token=${this.apiKey}&include=scores;participants;league`
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

        // Get scores
        const homeScoreObj = fixture.scores?.find((s: any) => s.participant === 'home');
        const awayScoreObj = fixture.scores?.find((s: any) => s.participant === 'away');

        return {
          id: fixture.id,
          homeTeam: homeParticipant?.name || 'Unknown',
          awayTeam: awayParticipant?.name || 'Unknown',
          homeScore: homeScoreObj?.goals ?? 0,
          awayScore: awayScoreObj?.goals ?? 0,
          minute: fixture.state?.minute ?? 0,
          status: fixture.state?.state || 'LIVE',
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
