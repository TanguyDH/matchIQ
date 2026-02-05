import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RulesModule } from './rules/rules.module';
import { StrategiesModule } from './strategies/strategies.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [SupabaseModule, StrategiesModule, RulesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
