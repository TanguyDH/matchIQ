import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/user-id.decorator';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { CreateRuleDto, CreateRuleSchema } from './dto/create-rule.dto';
import { RulesService } from './rules.service';

/**
 * Routes are intentionally split across two prefixes to match the spec:
 *   POST   /strategies/:strategyId/rules
 *   GET    /strategies/:strategyId/rules
 *   DELETE /rules/:id
 *
 * Using @Controller() with no prefix and explicit full paths keeps them in one
 * thin controller without a second controller file.
 */
@Controller()
@UseGuards(AuthGuard)
export class RulesController {
  constructor(private readonly service: RulesService) {}

  @Get('strategies/:strategyId/rules')
  findByStrategy(@UserId() userId: string, @Param('strategyId') strategyId: string) {
    return this.service.findByStrategy(userId, strategyId);
  }

  @Post('strategies/:strategyId/rules')
  create(
    @UserId() userId: string,
    @Param('strategyId') strategyId: string,
    @Body(new ZodValidationPipe(CreateRuleSchema)) dto: CreateRuleDto,
  ) {
    return this.service.create(userId, strategyId, dto);
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@UserId() userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }
}
