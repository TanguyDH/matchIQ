/**
 * Shared utility for calculating match timer from periods.
 * Used by both API and Worker to ensure consistent timer calculation.
 */

export interface Period {
  id?: number;
  type_id: number;
  minutes?: number | null;
  ticking?: boolean;
  ended?: number | boolean | null;
  started?: number;
}

/**
 * Calculates the current match minute from periods.
 *
 * IMPORTANT: period.minutes is CUMULATIVE (total time since match start), not per-period.
 *
 * @param periods - Array of match periods
 * @returns Current minute of the match
 *
 * @example
 * // During 2nd half at 70th minute:
 * // Period 1: { type_id: 1, minutes: 49, ended: true, ticking: false }
 * // Period 2: { type_id: 2, minutes: 70, ticking: true, ended: false }
 * // Returns: 70
 */
export function calculateMatchMinute(periods: Period[]): number {
  if (!periods || periods.length === 0) {
    return 0;
  }

  // Find the currently ticking period
  const tickingPeriod = periods.find(p => p?.ticking);

  if (tickingPeriod) {
    // Use the cumulative minutes from the ticking period
    // This already includes all previous periods
    return tickingPeriod.minutes ?? 0;
  }

  // No ticking period - match might be at halftime or finished
  // Sum up all completed periods
  let minute = 0;

  for (const period of periods) {
    if (!period || !period.ended) continue;

    // Add full duration based on type_id
    // type_id: 1=1st half, 2=2nd half, 3=ET 1st, 4=ET 2nd
    if (period.type_id === 1) {
      minute += 45; // First half
    } else if (period.type_id === 2) {
      minute += 45; // Second half (total becomes 90)
    } else if (period.type_id === 3) {
      minute += 15; // Extra time 1st half (total becomes 105)
    } else if (period.type_id === 4) {
      minute += 15; // Extra time 2nd half (total becomes 120)
    } else {
      // Fallback: use actual minutes if available
      minute += period.minutes ?? 0;
    }
  }

  return minute;
}
