import type { RecurringFrequency } from "@/lib/budget-types";

/**
 * Given a recurring template's start date and its frequency, returns all
 * occurrence Date objects that fall within the given calendar month/year,
 * respecting an optional end date (recurringEndDate).
 *
 * Day-of-month overflow is clamped to the last day of the target month
 * (e.g. a template starting Jan 31 → occurrence in Feb is Feb 28/29).
 */
export function getOccurrencesInMonth(
  startDate: Date,
  frequency: RecurringFrequency,
  month: number, // 1-based
  year: number,
  endDate?: Date | null,
): Date[] {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1); // exclusive

  // Template starts after the requested month → no occurrences
  if (startDate >= monthEnd) return [];

  const results: Date[] = [];

  if (frequency === "Monthly") {
    const day = startDate.getDate();
    // Clamp to last day of target month
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const occDay = Math.min(day, lastDayOfMonth);
    const occ = new Date(year, month - 1, occDay);
    if (occ >= monthStart && occ < monthEnd) {
      results.push(occ);
    }
  } else if (frequency === "Yearly") {
    if (startDate.getMonth() + 1 === month) {
      const day = startDate.getDate();
      const lastDayOfMonth = new Date(year, month, 0).getDate();
      const occDay = Math.min(day, lastDayOfMonth);
      const occ = new Date(year, month - 1, occDay);
      if (occ >= monthStart && occ < monthEnd) {
        results.push(occ);
      }
    }
  } else if (frequency === "Every 6 Months") {
    // Every 6 months from the start date
    // Find the first occurrence >= startDate whose month matches
    const startMs = startDate.getTime();
    const SIX_MONTHS_MS = 6 * 30.4375 * 24 * 60 * 60 * 1000; // approx
    // Iterate: start, start+6m, start+12m, ...
    // More reliable: compute by month arithmetic
    const startMonth = startDate.getMonth(); // 0-based
    const startYear = startDate.getFullYear();
    const targetMonth0 = month - 1; // 0-based
    // diffMonths from start to target
    const diffMonths = (year - startYear) * 12 + (targetMonth0 - startMonth);
    if (diffMonths >= 0 && diffMonths % 6 === 0) {
      const day = startDate.getDate();
      const lastDayOfMonth = new Date(year, month, 0).getDate();
      const occDay = Math.min(day, lastDayOfMonth);
      const occ = new Date(year, month - 1, occDay);
      if (occ >= monthStart && occ < monthEnd) {
        results.push(occ);
      }
    }
    // suppress unused import warning
    void startMs;
    void SIX_MONTHS_MS;
  } else if (frequency === "Weekly") {
    // Enumerate every 7-day interval from startDate, collect those in the month
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const MS_PER_WEEK = 7 * MS_PER_DAY;
    // Advance from startDate to the first occurrence >= monthStart
    let cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    if (cursor < monthStart) {
      const daysToAdvance = Math.ceil(
        (monthStart.getTime() - cursor.getTime()) / MS_PER_DAY,
      );
      const weeksToAdvance = Math.floor(daysToAdvance / 7);
      cursor = new Date(cursor.getTime() + weeksToAdvance * MS_PER_WEEK);
    }
    while (cursor < monthEnd) {
      if (cursor >= monthStart) {
        results.push(new Date(cursor));
      }
      cursor = new Date(cursor.getTime() + MS_PER_WEEK);
    }
  }

  // Filter out occurrences after the end date
  if (endDate) {
    const endMs = endDate.getTime();
    return results.filter((d) => d.getTime() <= endMs);
  }
  return results;
}

/**
 * Format a Date as "YYYY-MM-DD" (local time, no timezone shift).
 */
export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
