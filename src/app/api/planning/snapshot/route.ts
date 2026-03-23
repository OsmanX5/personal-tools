import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import NetWorthAccount from "@/models/networth_account";
import Expense from "@/models/expense";
import IncomeEntry from "@/models/income_entry";
import EmergencyFundConfig from "@/models/emergency_fund_config";

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  SAR: 3.75,
  EUR: 0.92,
};

function convert(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
) {
  if (from === to) return amount;
  const inUsd = amount / (rates[from] || 1);
  return inUsd * (rates[to] || 1);
}

async function fetchRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return FALLBACK_RATES;
    const data = await res.json();
    return {
      USD: data.rates.USD ?? 1,
      SAR: data.rates.SAR ?? 3.75,
      EUR: data.rates.EUR ?? 0.92,
    };
  } catch {
    return FALLBACK_RATES;
  }
}

export async function GET(request: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const dc = searchParams.get("displayCurrency") || "SAR";

  const rates = await fetchRates();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 1. Fetch NetWorth accounts
  const accounts = await NetWorthAccount.find({ status: "active" });
  let totalNetWorth = 0;
  let emergencyFundCurrent = 0;
  for (const a of accounts) {
    const converted = convert(a.amount, a.currency, dc, rates);
    totalNetWorth += converted;
    if (a.liquidity === "Immediate" || a.liquidity === "Hours") {
      emergencyFundCurrent += converted;
    }
  }

  // 2. Current month income
  const currentEntries = await IncomeEntry.find({
    month: currentMonth,
    year: currentYear,
  });
  let monthlyIncome = 0;
  for (const e of currentEntries) {
    monthlyIncome += convert(e.amount, e.currency, dc, rates);
  }

  // 3. Current month expenses (actual spent so far)
  const monthStart = new Date(currentYear, currentMonth - 1, 1);
  const monthEnd = new Date(currentYear, currentMonth, 1);
  const currentExpenses = await Expense.find({
    date: { $gte: monthStart, $lt: monthEnd },
  });
  let monthlyExpenses = 0;
  for (const e of currentExpenses) {
    monthlyExpenses += convert(e.amount, e.currency, dc, rates);
  }

  // 4. Recurring expense baseline (normalised to monthly)
  const FREQ_TO_MONTHLY: Record<string, number> = {
    Weekly: 52 / 12,
    Monthly: 1,
    "Every 6 Months": 1 / 6,
    Yearly: 1 / 12,
  };

  const recurringExpenses = await Expense.find({ recurring: true });
  let recurringMonthlyTotal = 0;
  for (const e of recurringExpenses) {
    const multiplier = FREQ_TO_MONTHLY[e.recurringFrequency || "Monthly"] ?? 1;
    recurringMonthlyTotal +=
      convert(e.amount, e.currency, dc, rates) * multiplier;
  }

  // 5. Average non-recurring expenses (last 6 months)
  const sixMonthsAgo = new Date(currentYear, currentMonth - 7, 1);
  const pastNonRecurring = await Expense.find({
    date: { $gte: sixMonthsAgo, $lt: monthStart },
    recurring: { $ne: true },
  });
  let pastNonRecurringTotal = 0;
  const nrMonths = new Set<string>();
  for (const e of pastNonRecurring) {
    pastNonRecurringTotal += convert(e.amount, e.currency, dc, rates);
    const d = new Date(e.date);
    nrMonths.add(`${d.getFullYear()}-${d.getMonth()}`);
  }
  const avgNonRecurringMonthly =
    nrMonths.size > 0 ? pastNonRecurringTotal / nrMonths.size : 0;

  const projectedMonthlyExpenses =
    recurringMonthlyTotal + avgNonRecurringMonthly;
  const avgMonthlyExpenses = projectedMonthlyExpenses;

  // 6. Expected total for the current month
  // Recurring items already logged this month
  let currentRecurringSpent = 0;
  for (const e of currentExpenses) {
    if (e.recurring) {
      currentRecurringSpent += convert(e.amount, e.currency, dc, rates);
    }
  }
  const remainingRecurring = Math.max(
    recurringMonthlyTotal - currentRecurringSpent,
    0,
  );
  const currentMonthExpectedTotal = monthlyExpenses + remainingRecurring;

  // 7. Past income (last 6 months)
  const pastIncomeEntries = await IncomeEntry.find({
    $or: buildPastMonthsQuery(currentMonth, currentYear, 6),
  });
  let pastIncomeTotal = 0;
  for (const e of pastIncomeEntries) {
    pastIncomeTotal += convert(e.amount, e.currency, dc, rates);
  }
  const incomeMonths = new Set<string>();
  for (const e of pastIncomeEntries) {
    incomeMonths.add(`${e.year}-${e.month}`);
  }
  const numIncomeMonths = Math.max(incomeMonths.size, 1);
  const avgMonthlyIncome = pastIncomeTotal / numIncomeMonths;

  const avgMonthlySavings = avgMonthlyIncome - projectedMonthlyExpenses;

  // 8. Savings rate (uses projected expenses for forward-looking accuracy)
  const savingsRate =
    monthlyIncome > 0
      ? ((monthlyIncome - projectedMonthlyExpenses) / monthlyIncome) * 100
      : 0;

  // 6. Emergency fund target
  const efConfig = await EmergencyFundConfig.findOne();
  const targetMonths = efConfig?.targetMonths ?? 6;
  const targetType = efConfig?.targetType ?? "months";
  const fixedTarget = efConfig?.fixedTargetAmount
    ? convert(
        efConfig.fixedTargetAmount,
        efConfig.fixedTargetCurrency || "USD",
        dc,
        rates,
      )
    : 0;

  let emergencyTarget: number;
  const monthsBasedTarget = avgMonthlyExpenses * targetMonths;
  if (targetType === "months") {
    emergencyTarget = monthsBasedTarget;
  } else if (targetType === "fixed") {
    emergencyTarget = fixedTarget;
  } else {
    // "both" — use whichever is higher
    emergencyTarget = Math.max(monthsBasedTarget, fixedTarget);
  }

  const percentFilled =
    emergencyTarget > 0
      ? Math.min((emergencyFundCurrent / emergencyTarget) * 100, 100)
      : 100;
  const monthsOfExpensesCovered =
    avgMonthlyExpenses > 0 ? emergencyFundCurrent / avgMonthlyExpenses : 0;

  return NextResponse.json({
    totalNetWorth,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    avgMonthlyExpenses,
    avgMonthlyIncome,
    avgMonthlySavings,
    projectedMonthlyExpenses,
    recurringMonthlyTotal,
    avgNonRecurringMonthly,
    currentMonthExpectedTotal,
    displayCurrency: dc,
    emergencyFund: {
      currentAmount: emergencyFundCurrent,
      targetAmount: emergencyTarget,
      percentFilled,
      monthsOfExpensesCovered,
      isFullyFunded: emergencyFundCurrent >= emergencyTarget,
    },
  });
}

/** Build a $or query for past N months (excluding current month) */
function buildPastMonthsQuery(
  currentMonth: number,
  currentYear: number,
  count: number,
) {
  const conditions: { month: number; year: number }[] = [];
  for (let i = 1; i <= count; i++) {
    let m = currentMonth - i;
    let y = currentYear;
    if (m <= 0) {
      m += 12;
      y -= 1;
    }
    conditions.push({ month: m, year: y });
  }
  return conditions;
}
