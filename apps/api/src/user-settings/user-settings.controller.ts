import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/user-id.decorator';
import { UserSettingsService } from './user-settings.service';

@Controller('user-settings')
@UseGuards(AuthGuard)
export class UserSettingsController {
  constructor(private readonly service: UserSettingsService) {}

  @Get()
  getSettings(@UserId() userId: string) {
    return this.service.getSettings(userId);
  }

  @Put()
  updateSettings(
    @UserId() userId: string,
    @Body() body: { default_league_ids: number[] | null },
  ) {
    return this.service.updateSettings(userId, body.default_league_ids ?? null);
  }
}
