export type GoalStatus = "Active" | "Achieved" | "Abandoned";

export type BmiCategory = "Underweight" | "Normal" | "Overweight" | "Obese";

export interface WeightEntry {
  _id: string;
  weight: number; // kg
  bmi: number;
  date: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export type WeightEntryFormData = Omit<
  WeightEntry,
  "_id" | "bmi" | "createdAt" | "updatedAt"
>;

export interface UserSettings {
  _id?: string;
  height: number | null; // cm
  updatedAt?: string;
}

export interface WeightGoal {
  _id: string;
  targetWeight: number; // kg
  startWeight: number; // kg
  targetDate?: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export type WeightGoalFormData = Omit<
  WeightGoal,
  "_id" | "createdAt" | "updatedAt"
>;

export const GOAL_STATUSES: GoalStatus[] = ["Active", "Achieved", "Abandoned"];

export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  if (heightM <= 0) return 0;
  return Math.round((weightKg / (heightM * heightM)) * 100) / 100;
}

export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export const BMI_CATEGORY_COLORS: Record<BmiCategory, string> = {
  Underweight:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/25 dark:text-blue-200 dark:border-blue-700/50",
  Normal:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-200 dark:border-emerald-700/50",
  Overweight:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/12 dark:text-amber-200 dark:border-amber-500/40",
  Obese:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/25 dark:text-rose-200 dark:border-rose-700/50",
};

export const GOAL_STATUS_COLORS: Record<GoalStatus, string> = {
  Active:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/25 dark:text-blue-200 dark:border-blue-700/50",
  Achieved:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-200 dark:border-emerald-700/50",
  Abandoned:
    "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700/50",
};

export const BMI_TARGET_THRESHOLDS = [25, 30, 35] as const;

export function weightForBmi(bmi: number, heightCm: number): number {
  const heightM = heightCm / 100;
  if (heightM <= 0) return 0;
  return Math.round(bmi * heightM * heightM * 10) / 10;
}

export interface WeightTrend {
  kgPerDay: number;
  samples: number;
}

export function computeWeightTrend(
  entries: WeightEntry[],
  windowDays = 30,
): WeightTrend | null {
  if (entries.length < 2) return null;

  const now = Date.now();
  const cutoff = now - windowDays * 24 * 60 * 60 * 1000;
  const points = entries
    .map((e) => ({ t: new Date(e.date).getTime(), w: e.weight }))
    .filter((p) => p.t >= cutoff)
    .sort((a, b) => a.t - b.t);

  if (points.length < 2) return null;

  // Least-squares slope on (days, weight)
  const dayMs = 24 * 60 * 60 * 1000;
  const xs = points.map((p) => (p.t - points[0].t) / dayMs);
  const ys = points.map((p) => p.w);
  const n = points.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  if (den === 0) return null;

  return { kgPerDay: num / den, samples: n };
}

export interface BmiTargetProjection {
  reached: boolean;
  deltaKg: number; // currentWeight - targetWeight (positive = need to lose)
  etaDays: number | null;
  converging: boolean;
}

export function projectBmiTarget(
  currentWeight: number,
  targetWeight: number,
  kgPerDay: number | null,
): BmiTargetProjection {
  const deltaKg = currentWeight - targetWeight;
  const reached = Math.abs(deltaKg) < 0.1;

  if (reached || kgPerDay == null) {
    return { reached, deltaKg, etaDays: null, converging: false };
  }

  // Need to lose if delta > 0 (kgPerDay should be negative); gain if delta < 0
  const converging =
    (deltaKg > 0 && kgPerDay < 0) || (deltaKg < 0 && kgPerDay > 0);
  const etaDays = converging ? Math.abs(deltaKg / kgPerDay) : null;

  return { reached, deltaKg, etaDays, converging };
}
