import { Module } from '@nestjs/common';

import { SupabaseModule } from '../supabase/supabase.module';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

@Module({
  imports: [SupabaseModule],
  controllers: [TelegramController],
  providers: [TelegramService],
})
export class TelegramModule {}
