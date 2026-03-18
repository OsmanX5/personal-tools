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
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900",
  Transport:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
  "Rent / Housing":
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  Utilities:
    "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900",
  Entertainment:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900",
  "Health & Fitness":
    "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900",
  Education:
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900",
  Clothing:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900",
  Subscriptions:
    "bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-950/40 dark:text-lime-300 dark:border-lime-900",
  "Loaning Friends":
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
  "Family Support":
    "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-900",
  Other:
    "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-950/40 dark:text-gray-400 dark:border-gray-800",
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
  createdAt: string;
  updatedAt: string;
}

export type ExpenseFormData = Omit<Expense, "_id" | "createdAt" | "updatedAt">;

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
  High: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
  Medium:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  Low: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900",
};

export const PLAN_STATUS_COLORS: Record<PlanStatus, string> = {
  Active:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
  Completed:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  Cancelled:
    "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-950/40 dark:text-gray-400 dark:border-gray-800",
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
