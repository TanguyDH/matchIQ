# @matchiq/worker

Background worker service that continuously scans live matches and triggers strategy alerts.

## Overview

The worker is responsible for:
- Polling live matches every 15 seconds (configurable)
- Loading active strategies from the database
- Evaluating strategies using the rule-engine
- Creating triggers (with deduplication)
- Sending Telegram alerts
- Updating performance statistics

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Worker Service                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  15s  ┌──────────────────────────────┐   │
│  │ Main Loop    │──────▶│ Scanner Service               │   │
│  └──────────────┘       │ - Load active strategies      │   │
│                         │ - Poll live matches           │   │
│                         │ - Evaluate using rule-engine  │   │
│                         └───────────┬───────────────────┘   │
│                                     │                        │
│                         ┌───────────▼───────────────────┐   │
│                         │ Trigger Created?              │   │
│                         └───────────┬───────────────────┘   │
│                                     │                        │
│                    ┌────────────────┼────────────────┐      │
│                    │                │                │       │
│          ┌─────────▼──────┐  ┌─────▼──────┐  ┌─────▼───┐  │
│          │ Trigger Service│  │  Telegram  │  │Performance│ │
│          │ (DB dedup)     │  │  Service   │  │ Service   │ │
│          └────────────────┘  └────────────┘  └───────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Phase 5 Implementation

**Current Phase:** Phase 5 (Worker MVP)

**Features:**
- ✅ Mock match provider (simulates live matches)
- ✅ 15-second polling interval
- ✅ Strategy evaluation using rule-engine
- ✅ Trigger creation with DB unique constraint deduplication
- ✅ Telegram alerts
- ✅ Performance tracking

**Not Yet Implemented:**
- ❌ Redis deduplication (Phase 6)
- ❌ BullMQ queues (Phase 6)
- ❌ Real match provider API integration
- ❌ PRE_MATCH alert type handling

## Setup

### 1. Environment Variables

Create a `.env` file (see `.env.example`):

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Polling interval (optional, default: 15000ms)
POLL_INTERVAL=15000
```

**Important:** The worker uses the **service role key**, not the anon key. This bypasses RLS and allows the worker to access all strategies.

### 2. Create Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow the prompts
3. Copy the bot token to `TELEGRAM_BOT_TOKEN`
4. Start a chat with your bot and send any message
5. Get your chat ID from: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
6. Copy the chat ID to `TELEGRAM_CHAT_ID`

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Worker

```bash
# Development (with hot reload)
npm run start:dev

# Production
npm run start
```

## Mock Match Provider

The worker uses a mock provider in Phase 5 to simulate live matches. The mock provider:

- Generates 2 fake matches (Manchester United vs Liverpool, Barcelona vs Real Madrid)
- Progressively updates match statistics over time
- Simulates goals, corners, shots with realistic probabilities
- Advances the match minute with each tick

This allows testing the full worker pipeline without a real API integration.

## Database Deduplication

The worker enforces deduplication at the database level using a unique constraint:

```sql
UNIQUE (strategy_id, match_id)
```

When a trigger is created:
1. Worker attempts to insert into `triggers` table
2. If the combo already exists, PostgreSQL returns error code `23505`
3. Worker catches this and skips (no alert sent, no performance update)
4. This ensures each strategy triggers at most once per match

## Telegram Alerts

When a strategy matches, the worker sends a formatted Telegram message:

```
🚨 Strategy Triggered: High-scoring matches

⚽ Match: Manchester United vs Liverpool
📊 Score: 2 - 1
⏱ Minute: 67'

✅ Matched Rules:
  • home_goals GTE 2 (actual: 2)
  • total_corners GT 8 (actual: 9)
```

## Performance Tracking

After each trigger, the worker updates the `performance` table:
- Increments `total_triggers`
- Recalculates `hit_rate` (currently always 0% since we don't track HIT/MISS yet)

## Graceful Shutdown

The worker handles `SIGINT` and `SIGTERM` signals for graceful shutdown:

```bash
# Press Ctrl+C to stop
^C
[Worker] Shutting down gracefully...
```

## Development

### Directory Structure

```
src/
├── main.ts                # Entry point, polling loop
├── config.ts              # Environment configuration
├── supabase.ts            # Supabase client
├── scanner.ts             # Main scanning logic
├── mock-provider.ts       # Mock match data generator
├── telegram.ts            # Telegram alert service
├── trigger-service.ts     # Trigger creation with dedup
└── performance-service.ts # Performance stats updates
```

### Adding Real Provider

To replace the mock provider with a real API:

1. Create `src/real-provider.ts`
2. Implement `getLiveMatches()` that:
   - Fetches from real API (e.g., API-Football)
   - Normalizes to `MatchSnapshot` format
   - Handles errors and retries
3. Replace import in `scanner.ts`

## Troubleshooting

### Worker Not Finding Strategies

- Check that strategies exist in the database with `is_active = true`
- Check that strategies have `alert_type = 'IN_PLAY'`
- Check that strategies have at least one rule

### Alerts Not Sending

- Verify `TELEGRAM_BOT_TOKEN` is correct
- Verify `TELEGRAM_CHAT_ID` is correct
- Check bot has started a chat with the user
- Check worker logs for Telegram errors

### Duplicate Triggers

This is expected behavior! The dedup logic prevents:
- Sending duplicate alerts
- Creating multiple trigger records
- Double-counting performance stats

If you see "Duplicate trigger skipped" in logs, it means the worker is correctly preventing duplicates.

## Next Steps (Phase 6)

Phase 6 will add:
- Redis for caching and dedup keys
- BullMQ for queue-based processing
- Separate `scan-tick` and `send-alert` jobs
- Retry logic for failed alerts
- Multiple worker instances support

## License

Private workspace package.
