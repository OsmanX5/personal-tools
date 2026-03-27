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
