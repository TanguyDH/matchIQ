#!/usr/bin/env node

/**
 * CLI entry point for replay mode.
 * Usage: pnpm worker:replay --last=20
 */

import { replayMode } from './replay-mode';

async function main() {
  // Parse CLI arguments
  const args = process.argv.slice(2);
  let limit = 20; // Default

  for (const arg of args) {
    if (arg.startsWith('--last=')) {
      const value = parseInt(arg.replace('--last=', ''), 10);
      if (!isNaN(value) && value > 0) {
        limit = value;
      } else {
        console.error('Invalid --last value. Must be a positive integer.');
        process.exit(1);
      }
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: pnpm worker:replay [options]');
      console.log('');
      console.log('Options:');
      console.log('  --last=N    Replay last N triggers (default: 20)');
      console.log('  --help      Show this help message');
      console.log('');
      console.log('Environment variables:');
      console.log('  DRY_RUN=true    Simulate alerts without sending to Telegram');
      console.log('');
      console.log('Examples:');
      console.log('  pnpm worker:replay');
      console.log('  pnpm worker:replay --last=50');
      console.log('  DRY_RUN=true pnpm worker:replay --last=10');
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      console.error('Use --help for usage information');
      process.exit(1);
    }
  }

  // Run replay mode
  try {
    await replayMode(limit);
    process.exit(0);
  } catch (error) {
    console.error('Replay failed:', error);
    process.exit(1);
  }
}

main();
