import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard';
import { UserId } from '../auth/user-id.decorator';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { CreateStrategyDto, CreateStrategySchema } from './dto/create-strategy.dto';
import { PatchStrategyDto, PatchStrategySchema } from './dto/patch-strategy.dto';
import { StrategiesService } from './strategies.service';

@Controller('strategies')
@UseGuards(AuthGuard)
export class StrategiesController {
  constructor(private readonly service: StrategiesService) {}

  @Get()
  findAll(@UserId() userId: string) {
    return this.service.findAll(userId);
  }

  @Get(':id')
  findOne(@UserId() userId: string, @Param('id') id: string) {
    return this.service.findOne(userId, id);
  }

  @Post()
  create(@UserId() userId: string, @Body(new ZodValidationPipe(CreateStrategySchema)) dto: CreateStrategyDto) {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  update(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PatchStrategySchema)) dto: PatchStrategyDto,
  ) {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@UserId() userId: string, @Param('id') id: string) {
    return this.service.delete(userId, id);
  }
}
