// ─── Frequency ───────────────────────────────────────────────────────────────

export type HabitFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "custom";

export const HABIT_FREQUENCIES: { value: HabitFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom (every N days)" },
];

// ─── Color palette ────────────────────────────────────────────────────────────

export const HABIT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#64748b", // slate
  "#84cc16", // lime
] as const;

export type HabitColor = (typeof HABIT_COLORS)[number];

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface Habit {
  _id: string;
  name: string;
  description?: string;
  color: string;
  category?: string;
  frequency: HabitFrequency;
  /** For custom frequency: repeat every N days */
  frequencyInterval?: number;
  /** Whether this habit tracks a numeric value (e.g. 8 glasses) */
  hasValue: boolean;
  targetValue?: number;
  unit?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type HabitFormData = Omit<Habit, "_id" | "createdAt" | "updatedAt">;

export interface HabitLog {
  _id: string;
  habitId: string;
  /** ISO date string at midnight UTC of the logged day */
  date: string;
  value?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export type HabitLogFormData = Omit<
  HabitLog,
  "_id" | "createdAt" | "updatedAt"
>;

/** Habit enriched with computed stats */
export interface HabitWithStats extends Habit {
  currentStreak: number;
  longestStreak: number;
  /** Log for "today" if it exists */
  todayLog?: HabitLog;
  /** Most recent 60 days of logs */
  recentLogs: HabitLog[];
}

// ─── Streak helpers ───────────────────────────────────────────────────────────

/** Returns midnight UTC for a given date (or today if omitted) */
export function toMidnightUTC(d: Date = new Date()): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/** Number of whole days between two midnight-UTC dates (b - a) */
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * Return the period length in days for a given frequency.
 * "custom" falls back to `interval` (default 1).
 */
function periodDays(frequency: HabitFrequency, interval = 1): number {
  switch (frequency) {
    case "daily":
      return 1;
    case "weekly":
      return 7;
    case "biweekly":
      return 14;
    case "monthly":
      return 30;
    case "custom":
      return Math.max(1, interval);
  }
}

/**
 * Given a sorted-descending list of log dates and a frequency,
 * compute the current streak (consecutive completed periods ending today or yesterday).
 */
export function calculateCurrentStreak(
  logs: HabitLog[],
  frequency: HabitFrequency,
  interval = 1,
): number {
  if (logs.length === 0) return 0;

  const period = periodDays(frequency, interval);
  const today = toMidnightUTC();

  // Unique days that have a log, sorted ascending
  const logDays = Array.from(
    new Set(logs.map((l) => toMidnightUTC(new Date(l.date)).getTime())),
  )
    .sort((a, b) => a - b)
    .map((t) => new Date(t));

  let streak = 0;
  // Walk backwards from today in period-sized windows
  let windowEnd = today;

  for (let i = logDays.length - 1; i >= 0; i--) {
    const logDay = logDays[i];
    const diff = daysBetween(logDay, windowEnd);
    if (diff >= 0 && diff < period) {
      // log falls within current window → period complete
      streak++;
      windowEnd = new Date(windowEnd.getTime() - period * 86_400_000);
    } else if (diff >= period) {
      // gap found — streak is broken
      break;
    }
  }

  return streak;
}

/**
 * Given a sorted-descending list of log dates and a frequency,
 * compute the all-time longest streak.
 */
export function calculateLongestStreak(
  logs: HabitLog[],
  frequency: HabitFrequency,
  interval = 1,
): number {
  if (logs.length === 0) return 0;

  const period = periodDays(frequency, interval);

  const logDays = Array.from(
    new Set(logs.map((l) => toMidnightUTC(new Date(l.date)).getTime())),
  )
    .sort((a, b) => a - b)
    .map((t) => new Date(t));

  let longest = 1;
  let current = 1;

  for (let i = 1; i < logDays.length; i++) {
    const diff = daysBetween(logDays[i - 1], logDays[i]);
    if (diff <= period) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}
