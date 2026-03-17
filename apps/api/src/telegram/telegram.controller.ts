import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/user-id.decorator';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly service: TelegramService) {}

  /**
   * Returns a one-time Telegram deep link the user can click to start the bot.
   * The link embeds a short-lived token; the bot's /start handler validates it.
   */
  @Get('link-url')
  @UseGuards(AuthGuard)
  getLinkUrl(@UserId() userId: string) {
    return this.service.getLinkUrl(userId);
  }

  /**
   * Returns whether the user's Telegram is linked.
   */
  @Get('status')
  @UseGuards(AuthGuard)
  getStatus(@UserId() userId: string) {
    return this.service.getStatus(userId);
  }

  /**
   * Removes the Telegram link for the user.
   */
  @Delete('disconnect')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  disconnect(@UserId() userId: string) {
    return this.service.disconnect(userId);
  }

  /**
   * Telegram webhook — called by Telegram when a user sends a message to the bot.
   * No auth guard: Telegram does not send a Bearer token.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(@Body() body: Record<string, unknown>) {
    return this.service.handleWebhook(body);
  }
}
