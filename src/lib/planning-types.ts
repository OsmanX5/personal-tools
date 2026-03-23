import type { Currency, ExchangeRates } from "@/lib/networth-types";

// ── Income Stream ────────────────────────────────────────────────────

export type IncomeStreamType = "Salary" | "Freelance" | "Other";

export const INCOME_STREAM_TYPES: IncomeStreamType[] = [
  "Salary",
  "Freelance",
  "Other",
];

export const INCOME_STREAM_TYPE_COLORS: Record<IncomeStreamType, string> = {
  Salary:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
  Freelance:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900",
  Other:
    "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-950/40 dark:text-gray-400 dark:border-gray-800",
};

export interface IncomeStream {
  _id: string;
  name: string;
  type: IncomeStreamType;
  defaultAmount: number;
  currency: Currency;
  isActive: boolean;
  startDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type IncomeStreamFormData = Omit<
  IncomeStream,
  "_id" | "createdAt" | "updatedAt"
>;

// ── Income Entry ─────────────────────────────────────────────────────

export interface IncomeEntry {
  _id: string;
  streamId: string;
  amount: number;
  currency: Currency;
  month: number;
  year: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type IncomeEntryFormData = Omit<
  IncomeEntry,
  "_id" | "createdAt" | "updatedAt"
>;

/** Virtual entry: not yet saved in DB, shows default amount */
export interface VirtualIncomeEntry {
  _id: null;
  streamId: string;
  streamName: string;
  streamType: IncomeStreamType;
  amount: number;
  currency: Currency;
  month: number;
  year: number;
  notes?: string;
  isVirtual: true;
}

export type IncomeEntryRow =
  | (IncomeEntry & {
      streamName: string;
      streamType: IncomeStreamType;
      isVirtual: false;
    })
  | VirtualIncomeEntry;

// ── Emergency Fund ───────────────────────────────────────────────────

export type EmergencyFundTargetType = "months" | "fixed" | "both";

export const EMERGENCY_FUND_TARGET_TYPES: EmergencyFundTargetType[] = [
  "months",
  "fixed",
  "both",
];

export interface EmergencyFundConfig {
  _id: string;
  targetType: EmergencyFundTargetType;
  targetMonths: number;
  fixedTargetAmount?: number;
  fixedTargetCurrency: Currency;
  createdAt: string;
  updatedAt: string;
}

export type EmergencyFundConfigFormData = Omit<
  EmergencyFundConfig,
  "_id" | "createdAt" | "updatedAt"
>;

export interface EmergencyFundStatus {
  currentAmount: number;
  targetAmount: number;
  percentFilled: number;
  monthsOfExpensesCovered: number;
  isFullyFunded: boolean;
}

// ── Financial Snapshot ───────────────────────────────────────────────

export interface FinancialSnapshot {
  totalNetWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  emergencyFund: EmergencyFundStatus;
  displayCurrency: Currency;
  avgMonthlyExpenses: number;
  avgMonthlyIncome: number;
  avgMonthlySavings: number;
  /** Recurring baseline + avg non-recurring */
  projectedMonthlyExpenses: number;
  /** Sum of all active recurring expenses normalised to monthly */
  recurringMonthlyTotal: number;
  /** Average non-recurring expenses per month (last 6 months) */
  avgNonRecurringMonthly: number;
  /** Spent so far + remaining recurring for the current month */
  currentMonthExpectedTotal: number;
}

// ── Projections ──────────────────────────────────────────────────────

export type ProjectionHorizon = "3m" | "6m" | "12m" | "2y" | "5y";

export const PROJECTION_HORIZONS: ProjectionHorizon[] = [
  "3m",
  "6m",
  "12m",
  "2y",
  "5y",
];

export const HORIZON_MONTHS: Record<ProjectionHorizon, number> = {
  "3m": 3,
  "6m": 6,
  "12m": 12,
  "2y": 24,
  "5y": 60,
};

export const HORIZON_LABELS: Record<ProjectionHorizon, string> = {
  "3m": "3 Months",
  "6m": "6 Months",
  "12m": "1 Year",
  "2y": "2 Years",
  "5y": "5 Years",
};

export interface Projection {
  horizon: ProjectionHorizon;
  months: number;
  projectedNetWorth: number;
  projectedSavings: number;
  monthlyContribution: number;
}

export interface ProjectionsData {
  projections: Projection[];
  emergencyFundFullDate: string | null;
  monthsToEmergencyFundFull: number | null;
}

// ── Utilities ────────────────────────────────────────────────────────

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
