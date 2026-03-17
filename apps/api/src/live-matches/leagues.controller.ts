import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

export interface LeagueDto {
  id: number;
  name: string;
  countryCode?: string;
}

// In-memory cache — leagues change at most once a season
let cachedLeagues: LeagueDto[] | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

@Controller('leagues')
@UseGuards(AuthGuard)
export class LeaguesController {
  @Get()
  async getLeagues(): Promise<LeagueDto[]> {
    if (cachedLeagues && Date.now() < cacheExpiresAt) {
      return cachedLeagues;
    }

    const apiKey = process.env.SPORTMONKS_API_KEY ?? '';
    const baseUrl = process.env.SPORTMONKS_BASE_URL ?? 'https://api.sportmonks.com/v3/football';

    try {
      const res = await fetch(
        `${baseUrl}/leagues?api_token=${apiKey}&include=country&per_page=150`,
      );

      if (!res.ok) {
        return cachedLeagues ?? [];
      }

      const json = await res.json() as any;
      const raw: any[] = json?.data ?? [];

      const leagues: LeagueDto[] = raw
        .map((l) => ({
          id: l.id as number,
          name: l.name as string,
          countryCode: l.country?.iso2 as string | undefined,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      cachedLeagues = leagues;
      cacheExpiresAt = Date.now() + CACHE_TTL_MS;

      return leagues;
    } catch {
      return cachedLeagues ?? [];
    }
  }
}
