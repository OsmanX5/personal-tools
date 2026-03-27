import type { Currency, ExchangeRates } from "@/lib/networth-types";

// ── Expense ──────────────────────────────────────────────────────────

export type ExpenseCategory =
  | "Food & Groceries"
  | "Transport"
  | "Rent / Housing"
  | "Utilities"
  | "Entertainment"
  | "Health & Fitness"
  | "Education"
  | "Clothing"
  | "Subscriptions"
  | "Loaning Friends"
  | "Family Support"
  | "Other";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Food & Groceries",
  "Transport",
  "Rent / Housing",
  "Utilities",
  "Entertainment",
  "Health & Fitness",
  "Education",
  "Clothing",
  "Subscriptions",
  "Loaning Friends",
  "Family Support",
  "Other",
];

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  "Food & Groceries": "#22c55e",
  Transport: "#3b82f6",
  "Rent / Housing": "#f59e0b",
  Utilities: "#06b6d4",
  Entertainment: "#a855f7",
  "Health & Fitness": "#ec4899",
  Education: "#6366f1",
  Clothing: "#f97316",
  Subscriptions: "#84cc16",
  "Loaning Friends": "#ef4444",
  "Family Support": "#e879f9",
  Other: "#94a3b8",
};

export const CATEGORY_BG_COLORS: Record<ExpenseCategory, string> = {
  "Food & Groceries":
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/25 dark:text-green-200 dark:border-green-700/50",
  Transport:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/25 dark:text-blue-200 dark:border-blue-700/50",
  "Rent / Housing":
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/12 dark:text-amber-200 dark:border-amber-500/40",
  Utilities:
    "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/25 dark:text-cyan-200 dark:border-cyan-700/50",
  Entertainment:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/25 dark:text-purple-200 dark:border-purple-700/50",
  "Health & Fitness":
    "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/25 dark:text-pink-200 dark:border-pink-700/50",
  Education:
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/25 dark:text-indigo-200 dark:border-indigo-700/50",
  Clothing:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/12 dark:text-orange-200 dark:border-orange-500/40",
  Subscriptions:
    "bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-900/25 dark:text-lime-200 dark:border-lime-700/50",
  "Loaning Friends":
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/25 dark:text-red-200 dark:border-red-700/50",
  "Family Support":
    "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/25 dark:text-fuchsia-200 dark:border-fuchsia-700/50",
  Other:
    "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700/50",
};

// ── Recurring ────────────────────────────────────────────────────────

export type RecurringFrequency =
  | "Weekly"
  | "Monthly"
  | "Every 6 Months"
  | "Yearly";

export const RECURRING_FREQUENCIES: RecurringFrequency[] = [
  "Weekly",
  "Monthly",
  "Every 6 Months",
  "Yearly",
];

// ── Expense interface ────────────────────────────────────────────────

export interface Expense {
  _id: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  description?: string;
  date: string;
  recurring: boolean;
  recurringFrequency?: RecurringFrequency;
  withdrawAccountId?: string;
  // Recurring series fields
  recurringParentId?: string;
  recurringEndDate?: string;
  skipped?: boolean;
  // Runtime-only metadata injected by the API for virtual recurring instances
  recurringMeta?: {
    isVirtual: boolean; // true = synthesized, not a real DB doc
    templateId: string; // _id of the recurring template
    occurrenceDate: string; // ISO date string of this specific occurrence
  };
  createdAt: string;
  updatedAt: string;
}

export type EditScope = "single" | "future";

export type ExpenseFormData = Omit<
  Expense,
  "_id" | "createdAt" | "updatedAt" | "recurringMeta"
>;

// ── Category Budget ──────────────────────────────────────────────────

export interface CategoryBudget {
  _id: string;
  category: ExpenseCategory;
  limitAmount: number;
  currency: Currency;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export type CategoryBudgetFormData = Omit<
  CategoryBudget,
  "_id" | "createdAt" | "updatedAt"
>;

// ── Future Plan ──────────────────────────────────────────────────────

export type PlanPriority = "High" | "Medium" | "Low";
export type PlanStatus = "Active" | "Completed" | "Cancelled";

export const PLAN_PRIORITIES: PlanPriority[] = ["High", "Medium", "Low"];
export const PLAN_STATUSES: PlanStatus[] = ["Active", "Completed", "Cancelled"];

export const PRIORITY_COLORS: Record<PlanPriority, string> = {
  High: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/25 dark:text-red-200 dark:border-red-700/50",
  Medium:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/12 dark:text-amber-200 dark:border-amber-500/40",
  Low: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/25 dark:text-green-200 dark:border-green-700/50",
};

export const PLAN_STATUS_COLORS: Record<PlanStatus, string> = {
  Active:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/25 dark:text-blue-200 dark:border-blue-700/50",
  Completed:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-200 dark:border-emerald-700/50",
  Cancelled:
    "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700/50",
};

export interface FuturePlan {
  _id: string;
  name: string;
  description?: string;
  estimatedCost: number;
  amountSaved: number;
  currency: Currency;
  targetDate?: string;
  priority: PlanPriority;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
}

export type FuturePlanFormData = Omit<
  FuturePlan,
  "_id" | "createdAt" | "updatedAt"
>;

// ── Utilities ────────────────────────────────────────────────────────

export function calcMonthlySavingsNeeded(
  estimatedCost: number,
  amountSaved: number,
  targetDate?: string,
): number | null {
  if (!targetDate) return null;
  const remaining = estimatedCost - amountSaved;
  if (remaining <= 0) return 0;
  const now = new Date();
  const target = new Date(targetDate);
  const monthsDiff =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth());
  if (monthsDiff <= 0) return remaining;
  return Math.ceil((remaining / monthsDiff) * 100) / 100;
}

export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
  rates: ExchangeRates,
): number {
  if (from === to) return amount;
  const inUsd = amount / rates[from];
  return inUsd * rates[to];
}
