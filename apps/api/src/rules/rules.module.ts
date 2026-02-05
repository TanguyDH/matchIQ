import { Module } from '@nestjs/common';

import { StrategiesModule } from '../strategies/strategies.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { RulesController } from './rules.controller';
import { RulesService } from './rules.service';

@Module({
  imports: [SupabaseModule, StrategiesModule],
  controllers: [RulesController],
  providers: [RulesService],
})
export class RulesModule {}
