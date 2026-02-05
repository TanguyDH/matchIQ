import { Module } from '@nestjs/common';

import { SupabaseModule } from '../supabase/supabase.module';
import { StrategiesController } from './strategies.controller';
import { StrategiesService } from './strategies.service';

@Module({
  imports: [SupabaseModule],
  controllers: [StrategiesController],
  providers: [StrategiesService],
  exports: [StrategiesService], // RulesService needs findOne for ownership checks
})
export class StrategiesModule {}
