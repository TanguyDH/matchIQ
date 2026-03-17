import { Module } from '@nestjs/common';
import { LiveMatchesController } from './live-matches.controller';
import { LiveMatchesService } from './live-matches.service';
import { LeaguesController } from './leagues.controller';

@Module({
  controllers: [LiveMatchesController, LeaguesController],
  providers: [LiveMatchesService],
})
export class LiveMatchesModule {}
