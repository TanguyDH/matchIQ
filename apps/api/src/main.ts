import 'reflect-metadata';

import path from 'path';
import dotenv from 'dotenv';

// Load shared env file before anything else.
// __dirname points to apps/api/src (ts-node) or apps/api/dist (compiled) —
// both need three levels up to reach the monorepo root.
dotenv.config({ path: path.resolve(__dirname, '../../../infra/.env') });

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { validateEnv } from './config/env';

async function bootstrap() {
  // Fail fast: every required env var must be present before the module tree boots.
  const env = validateEnv();

  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(env.PORT);
  console.log(`MatchIQ API listening on port ${env.PORT}`);
}

void bootstrap();
