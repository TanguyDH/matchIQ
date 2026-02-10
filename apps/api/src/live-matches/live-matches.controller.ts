import { Controller, Get } from '@nestjs/common';
import { LiveMatchesService } from './live-matches.service';

@Controller('live-matches')
export class LiveMatchesController {
  constructor(private readonly liveMatchesService: LiveMatchesService) {}

  @Get()
  async getLiveMatches() {
    return this.liveMatchesService.getLiveMatches();
  }
}
