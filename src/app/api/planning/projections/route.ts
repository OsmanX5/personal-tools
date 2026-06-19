import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import NetWorthAccount from "@/models/networth_account";
import Expense from "@/models/expense";
import IncomeStream from "@/models/income_stream";
import IncomeEntry from "@/models/income_entry";
import EmergencyFundConfig from "@/models/emergency_fund_config";
import { PROJECTION_HORIZONS, HORIZON_MONTHS } from "@/lib/planning-types";

export const dynamic = "force-dynamic";

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

/**
 * Calculate compound interest growth over months
 * @param principal Initial investment amount
 * @param monthlyRate Monthly interest rate (e.g., 0.005 for 0.5%)
 * @param months Number of months to compound over
 * @returns Final amount after compound interest
 */
function calculateCompoundInterest(
  principal: number,
  monthlyRate: number,
  months: number,
): number {
  return principal * Math.pow(1 + monthlyRate, months);
}

/**
 * Calculate compound interest on monthly savings deposits
 * Uses geometric series formula for deposits made at end of each month
 * @param monthlyDeposit Amount deposited each month
 * @param monthlyRate Monthly interest rate (e.g., 0.005 for 0.5%)
 * @param months Number of months
 * @returns Final accumulated amount with interest
 */
function calculateSavingsWithInterest(
  monthlyDeposit: number,
  monthlyRate: number,
  months: number,
): number {
  if (monthlyRate === 0) return monthlyDeposit * months;
  // Geometric series: deposit * (((1 + r)^n - 1) / r)
  return (
    monthlyDeposit * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
  );
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
  const includeInvestmentInterest =
    searchParams.get("includeInvestmentInterest") !== "false"; // defaults to true

  const interestRateParam = parseFloat(
    searchParams.get("interestRate") ?? "",
  );
  const ANNUAL_INTEREST_RATE =
    Number.isFinite(interestRateParam) &&
    interestRateParam >= 0 &&
    interestRateParam <= 1
      ? interestRateParam
      : 0.06;
  const MONTHLY_INTEREST_RATE = ANNUAL_INTEREST_RATE / 12;

  const rates = await fetchRates();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 1. Current net worth
  const accounts = await NetWorthAccount.find({ status: "active" });
  let totalNetWorth = 0;
  let investmentAccountsBalance = 0;
  let emergencyFundCurrent = 0;
  for (const a of accounts) {
    const converted = convert(a.amount, a.currency, dc, rates);
    totalNetWorth += converted;
    if (a.liquidity === "Immediate" || a.liquidity === "Hours") {
      emergencyFundCurrent += converted;
    }
    // Track investment accounts for interest calculation
    if (a.purpose === "Investment") {
      investmentAccountsBalance += converted;
    }
  }

  // 2. Projected monthly income from active streams (filtered by type)
  const includeTypesParam = searchParams.get("includeTypes");
  const includeTypes = includeTypesParam
    ? includeTypesParam.split(",").filter(Boolean)
    : ["Salary", "Freelance", "Other"];

  const activeStreams = await IncomeStream.find({
    type: { $in: includeTypes },
    isActive: true,
  });
  let projectedMonthlyIncome = 0;
  for (const s of activeStreams) {
    // One-time streams don't contribute to monthly projections
    if ((s.recurrence ?? "recurring") === "one-time") continue;
    projectedMonthlyIncome += convert(s.defaultAmount, s.currency, dc, rates);
  }
  // for freelance stream calcuate the avarage for the last 12 months and use that as the projected monthly income
  const freelanceStreams = activeStreams.filter((s) => s.type === "Freelance");
  for (const s of freelanceStreams) {
    const twelveMonthsAgo = new Date(currentYear, currentMonth - 13, 1);
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const moneyEnteries = await IncomeEntry.find({
      streamId: s._id,
      date: { $gte: twelveMonthsAgo, $lt: monthStart },
    });
    let total = 0;
    let count = 0;
    for (const e of moneyEnteries) {
      total += convert(e.amount, e.currency, dc, rates);
      count++;
    }
    if (count > 0) {
      const avg = total / count;
      console.log(
        `Freelance stream ${s.name} average over last 12 months: ${avg}`,
      );
      projectedMonthlyIncome += avg;
    }
  }
  // 3. Recurring expense baseline (normalised to monthly)
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

  // Average non-recurring expenses (last 6 months)
  const sixMonthsAgo = new Date(currentYear, currentMonth - 7, 1);
  const monthStart = new Date(currentYear, currentMonth - 1, 1);
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

  const avgMonthlyExpenses = recurringMonthlyTotal + avgNonRecurringMonthly;
  const avgMonthlySavings = projectedMonthlyIncome - avgMonthlyExpenses;

  // 4. Build projections
  const projections = PROJECTION_HORIZONS.map((horizon) => {
    const months = HORIZON_MONTHS[horizon];
    const projectedSavings = avgMonthlySavings * months;

    let interestGrowth = 0;
    if (includeInvestmentInterest) {
      // Interest on existing investment accounts
      const investmentWithInterest = calculateCompoundInterest(
        investmentAccountsBalance,
        MONTHLY_INTEREST_RATE,
        months,
      );
      const interestOnExisting =
        investmentWithInterest - investmentAccountsBalance;

      // Interest on projected savings (assuming all savings are invested)
      const savingsWithInterest = calculateSavingsWithInterest(
        avgMonthlySavings,
        MONTHLY_INTEREST_RATE,
        months,
      );
      const interestOnSavings = savingsWithInterest - projectedSavings;

      interestGrowth = interestOnExisting + interestOnSavings;
    }

    return {
      horizon,
      months,
      projectedNetWorth: totalNetWorth + projectedSavings + interestGrowth,
      projectedSavings,
      monthlyContribution: avgMonthlySavings,
      interestEarned: includeInvestmentInterest ? interestGrowth : 0,
    };
  });

  // 5. Emergency fund projection
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

  const monthsBasedTarget = avgMonthlyExpenses * targetMonths;
  let emergencyTarget: number;
  if (targetType === "months") {
    emergencyTarget = monthsBasedTarget;
  } else if (targetType === "fixed") {
    emergencyTarget = fixedTarget;
  } else {
    emergencyTarget = Math.max(monthsBasedTarget, fixedTarget);
  }

  let emergencyFundFullDate: string | null = null;
  let monthsToEmergencyFundFull: number | null = null;
  if (emergencyFundCurrent < emergencyTarget && avgMonthlySavings > 0) {
    const remaining = emergencyTarget - emergencyFundCurrent;
    monthsToEmergencyFundFull = Math.ceil(remaining / avgMonthlySavings);
    const fullDate = new Date(now);
    fullDate.setMonth(fullDate.getMonth() + monthsToEmergencyFundFull);
    emergencyFundFullDate = fullDate.toISOString();
  } else if (emergencyFundCurrent >= emergencyTarget) {
    monthsToEmergencyFundFull = 0;
  }

  return NextResponse.json({
    projections,
    emergencyFundFullDate,
    monthsToEmergencyFundFull,
  });
}
