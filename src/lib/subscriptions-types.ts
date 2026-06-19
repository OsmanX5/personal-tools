import type { Currency } from "@/lib/networth-types";

export type SubscriptionStatus = "Active" | "Paused" | "Cancelled";

export type SubscriptionBillingCycle =
  | "Weekly"
  | "Monthly"
  | "Every 6 Months"
  | "Yearly";

export type ReminderUnit = "days" | "weeks";

export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  "Active",
  "Paused",
  "Cancelled",
];

export const SUBSCRIPTION_BILLING_CYCLES: SubscriptionBillingCycle[] = [
  "Weekly",
  "Monthly",
  "Every 6 Months",
  "Yearly",
];

export const REMINDER_UNITS: ReminderUnit[] = ["days", "weeks"];

export interface Subscription {
  _id: string;
  name: string;
  description: string;
  amount: number;
  currency: Currency;
  billingCycle: SubscriptionBillingCycle;
  nextRenewalDate: string;
  status: SubscriptionStatus;
  autoRenew: boolean;
  reminderLead: number;
  reminderUnit: ReminderUnit;
  tags: string[];
  budgetExpenseId?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionFormData = Omit<
  Subscription,
  "_id" | "createdAt" | "updatedAt" | "budgetExpenseId"
>;

export const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  Active:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-200 dark:border-emerald-700/50",
  Paused:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/12 dark:text-amber-200 dark:border-amber-500/40",
  Cancelled:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/25 dark:text-rose-200 dark:border-rose-700/50",
};

export function normalizeTags(tags: string[]): string[] {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0),
    ),
  );
}

export function toMonthlyAmount(
  amount: number,
  billingCycle: SubscriptionBillingCycle,
): number {
  if (billingCycle === "Weekly") return (amount * 52) / 12;
  if (billingCycle === "Monthly") return amount;
  if (billingCycle === "Every 6 Months") return amount / 6;
  return amount / 12;
}
