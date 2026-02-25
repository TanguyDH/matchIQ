/**
 * METRICS CATALOG — IN_PLAY Metrics
 *
 * This file defines ALL supported in-play metrics and how they map
 * from API-Football data to our internal MatchSnapshot format.
 *
 * Each metric is extracted for both HOME and AWAY teams separately.
 */

/**
 * TeamStatistics structure from API-Football.
 * Each team has an array of statistics with type and value.
 */
export interface TeamStatistics {
  team: {
    id: number;
    name: string;
  };
  statistics: Array<{
    type: string;
    value: number | string | null;
  }>;
}

// ────────────────────────────────────────────────────────────────────────────
// SUPPORTED METRICS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Complete list of all supported in-play metrics.
 * Each metric is stored as:
 * - home_{metric}: value for home team
 * - away_{metric}: value for away team
 */
export const IN_PLAY_METRICS = {
  // ─── Core Match Stats ───────────────────────────────────────────────────
  goals: {
    description: 'Goals scored',
    apiField: 'Goals',
    type: 'number',
    example: { home: 2, away: 1 },
  },

  // ─── Shots ──────────────────────────────────────────────────────────────
  shots_total: {
    description: 'Total shots (on target + off target)',
    apiField: 'Total Shots',
    type: 'number',
    example: { home: 15, away: 12 },
  },
  shots_on_target: {
    description: 'Shots on target',
    apiField: 'Shots on Goal',
    type: 'number',
    example: { home: 7, away: 5 },
  },
  shots_off_target: {
    description: 'Shots off target',
    apiField: 'Shots off Goal',
    type: 'number',
    example: { home: 8, away: 7 },
  },
  shots_blocked: {
    description: 'Shots blocked by defenders',
    apiField: 'Blocked Shots',
    type: 'number',
    example: { home: 3, away: 2 },
  },
  shots_inside_box: {
    description: 'Shots from inside the penalty box',
    apiField: 'Shots insidebox',
    type: 'number',
    example: { home: 10, away: 8 },
  },
  shots_outside_box: {
    description: 'Shots from outside the penalty box',
    apiField: 'Shots outsidebox',
    type: 'number',
    example: { home: 5, away: 4 },
  },

  // ─── Set Pieces ─────────────────────────────────────────────────────────
  corners: {
    description: 'Corner kicks',
    apiField: 'Corner Kicks',
    type: 'number',
    example: { home: 6, away: 4 },
  },
  offsides: {
    description: 'Offside calls',
    apiField: 'Offsides',
    type: 'number',
    example: { home: 2, away: 1 },
  },

  // ─── Possession & Passes ────────────────────────────────────────────────
  possession: {
    description: 'Ball possession percentage',
    apiField: 'Ball Possession',
    type: 'percentage',
    example: { home: 58, away: 42 },
  },
  passes_total: {
    description: 'Total passes attempted',
    apiField: 'Total passes',
    type: 'number',
    example: { home: 450, away: 320 },
  },
  passes_accurate: {
    description: 'Accurate passes completed',
    apiField: 'Passes accurate',
    type: 'number',
    example: { home: 405, away: 272 },
  },
  passes_percentage: {
    description: 'Pass accuracy percentage',
    apiField: 'Passes %',
    type: 'percentage',
    example: { home: 90, away: 85 },
  },

  // ─── Discipline ─────────────────────────────────────────────────────────
  yellow_cards: {
    description: 'Yellow cards received',
    apiField: 'Yellow Cards',
    type: 'number',
    example: { home: 2, away: 3 },
  },
  red_cards: {
    description: 'Red cards received',
    apiField: 'Red Cards',
    type: 'number',
    example: { home: 0, away: 1 },
  },
  fouls: {
    description: 'Fouls committed',
    apiField: 'Fouls',
    type: 'number',
    example: { home: 8, away: 12 },
  },

  // ─── Goalkeeping ────────────────────────────────────────────────────────
  saves: {
    description: 'Goalkeeper saves',
    apiField: 'Goalkeeper Saves',
    type: 'number',
    example: { home: 4, away: 6 },
  },

  // ─── Expected Goals (Advanced) ──────────────────────────────────────────
  expected_goals: {
    description: 'Expected goals (xG)',
    apiField: 'expected_goals',
    type: 'decimal',
    example: { home: 1.8, away: 1.2 },
  },
} as const;

// ────────────────────────────────────────────────────────────────────────────
// EXTRACTION LOGIC
// ────────────────────────────────────────────────────────────────────────────

/**
 * Extracts all in-play metrics from API-Football statistics.
 *
 * @param homeStats - Statistics for home team
 * @param awayStats - Statistics for away team
 * @returns Record with all metrics in format: { home_metric: value, away_metric: value }
 *
 * @example
 * const inPlay = extractInPlayMetrics(homeStats, awayStats);
 * // Result:
 * // {
 * //   home_goals: 2,
 * //   away_goals: 1,
 * //   home_shots_total: 15,
 * //   away_shots_total: 12,
 * //   ...
 * // }
 */
export function extractInPlayMetrics(
  homeStats?: TeamStatistics,
  awayStats?: TeamStatistics,
): Record<string, number> {
  const metrics: Record<string, number> = {};

  if (!homeStats || !awayStats) {
    return metrics;
  }

  // Build lookup maps for quick access
  const homeMap = buildStatsMap(homeStats);
  const awayMap = buildStatsMap(awayStats);

  // Extract each metric using the catalog
  for (const [metricName, metricDef] of Object.entries(IN_PLAY_METRICS)) {
    const apiField = metricDef.apiField;

    // Extract home value
    const homeValue = homeMap.get(apiField);
    if (homeValue !== undefined) {
      metrics[`home_${metricName}`] = parseValue(homeValue);
    }

    // Extract away value
    const awayValue = awayMap.get(apiField);
    if (awayValue !== undefined) {
      metrics[`away_${metricName}`] = parseValue(awayValue);
    }
  }

  return metrics;
}

/**
 * Builds a map of API field names to values for quick lookup.
 */
function buildStatsMap(stats: TeamStatistics): Map<string, number | string | null> {
  const map = new Map<string, number | string | null>();

  for (const stat of stats.statistics) {
    map.set(stat.type, stat.value);
  }

  return map;
}

/**
 * Parses a stat value from API-Football.
 * Handles: numbers, percentage strings ("58%"), decimal strings ("1.8"), null.
 */
function parseValue(value: number | string | null): number {
  if (value === null) return 0;
  if (typeof value === 'number') return value;

  // Handle percentage strings like "65%"
  if (value.endsWith('%')) {
    const num = parseFloat(value.replace('%', ''));
    return isNaN(num) ? 0 : num;
  }

  // Handle decimal strings like "1.8"
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

// ────────────────────────────────────────────────────────────────────────────
// METRIC CATEGORIES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Metrics grouped by category for UI display.
 */
export const METRIC_CATEGORIES = {
  'Core': ['goals'],
  'Shots': ['shots_total', 'shots_on_target', 'shots_off_target', 'shots_blocked', 'shots_inside_box', 'shots_outside_box'],
  'Set Pieces': ['corners', 'offsides'],
  'Possession': ['possession', 'passes_total', 'passes_accurate', 'passes_percentage'],
  'Discipline': ['yellow_cards', 'red_cards', 'fouls'],
  'Goalkeeping': ['saves'],
  'Advanced': ['expected_goals'],
} as const;

// ────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ────────────────────────────────────────────────────────────────────────────

/**
 * Checks if a metric name is valid.
 */
export function isValidInPlayMetric(metric: string): boolean {
  return metric in IN_PLAY_METRICS;
}

/**
 * Gets the description for a metric.
 */
export function getMetricDescription(metric: string): string | undefined {
  return (IN_PLAY_METRICS as any)[metric]?.description;
}

/**
 * Lists all available metrics.
 */
export function listAllMetrics(): string[] {
  return Object.keys(IN_PLAY_METRICS);
}

// ────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ────────────────────────────────────────────────────────────────────────────

/**
 * Total metrics supported: 19
 *
 * With home/away variants: 38 total values
 *
 * Categories:
 * - Core: 1 metric (goals)
 * - Shots: 6 metrics
 * - Set Pieces: 2 metrics
 * - Possession: 4 metrics
 * - Discipline: 3 metrics
 * - Goalkeeping: 1 metric
 * - Advanced: 1 metric (xG)
 *
 * Example usage in rules:
 * - "goals (HOME) >= 2"           → checks home_goals >= 2
 * - "shots_total (TOTAL) > 20"    → checks (home_shots_total + away_shots_total) > 20
 * - "corners (AWAY) >= 5"         → checks away_corners >= 5
 * - "possession (HOME) > 60"      → checks home_possession > 60
 * - "yellow_cards (EITHER_TEAM) >= 3" → checks max(home_yellow_cards, away_yellow_cards) >= 3
 */
