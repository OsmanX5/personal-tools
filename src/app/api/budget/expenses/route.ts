import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Expense from "@/models/expense";
import NetWorthAccount from "@/models/networth_account";
import { getOccurrencesInMonth, toDateString } from "@/lib/recurring-utils";
import type { RecurringFrequency } from "@/lib/budget-types";

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  SAR: 3.75,
  EUR: 0.92,
};

export async function GET(request: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const now = new Date();
  const m = month ? parseInt(month, 10) : now.getMonth() + 1;
  const y = year ? parseInt(year, 10) : now.getFullYear();

  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  // 1. Fetch real one-off expenses (not templates, not overrides/skips)
  const realExpenses = await Expense.find({
    date: { $gte: start, $lt: end },
    recurring: { $ne: true },
    recurringParentId: { $exists: false },
  }).sort({ date: -1 });

  // 2. Fetch recurring templates that could have occurrences in this month:
  //    - created before the end of the month
  //    - either no end date OR end date >= start of month
  const templates = await Expense.find({
    recurring: true,
    recurringParentId: { $exists: false },
    date: { $lt: end },
    $or: [
      { recurringEndDate: { $exists: false } },
      { recurringEndDate: null },
      { recurringEndDate: { $gte: start } },
    ],
  });

  // 3. Fetch overrides and skips for this month (docs with recurringParentId)
  const overridesAndSkips = await Expense.find({
    recurringParentId: { $exists: true },
    date: { $gte: start, $lt: end },
  });

  // Build lookup maps
  const overrideMap = new Map<string, (typeof overridesAndSkips)[0]>(); // key: templateId_YYYY-MM-DD
  for (const doc of overridesAndSkips) {
    if (doc.recurringParentId) {
      const key = `${doc.recurringParentId}_${toDateString(doc.date)}`;
      overrideMap.set(key, doc);
    }
  }

  // 4. Expand templates into virtual instances
  const virtualAndOverride: object[] = [];

  for (const template of templates) {
    const occurrences = getOccurrencesInMonth(
      template.date,
      template.recurringFrequency as RecurringFrequency,
      m,
      y,
      template.recurringEndDate ?? null,
    );

    for (const occDate of occurrences) {
      const occDateStr = toDateString(occDate);
      const key = `${template._id}_${occDateStr}`;
      const override = overrideMap.get(key);

      if (override) {
        // Skip docs: omit from results entirely
        if (override.skipped) continue;
        // Override doc: use override data but inject meta
        const overrideObj = override.toObject();
        virtualAndOverride.push({
          ...overrideObj,
          recurringMeta: {
            isVirtual: false,
            templateId: String(template._id),
            occurrenceDate: occDateStr,
          },
        });
      } else {
        // Virtual instance: synthesize from template
        const templateObj = template.toObject();
        virtualAndOverride.push({
          ...templateObj,
          _id: `virtual_${template._id}_${occDateStr}`,
          date: occDate,
          // Do NOT carry over withdrawAccountId — no auto-deduct for generated instances
          withdrawAccountId: undefined,
          recurringMeta: {
            isVirtual: true,
            templateId: String(template._id),
            occurrenceDate: occDateStr,
          },
        });
      }
    }
  }

  // 5. Combine real expenses + expanded recurring instances, sorted by date desc
  const combined = [
    ...realExpenses.map((e) => e.toObject()),
    ...virtualAndOverride,
  ].sort(
    (a, b) =>
      new Date((b as any).date).getTime() - new Date((a as any).date).getTime(),
  );

  return NextResponse.json(combined);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const expense = await Expense.create(body);

  // If a withdraw account was specified, subtract the expense from that account
  if (body.withdrawAccountId) {
    try {
      const account = await NetWorthAccount.findById(body.withdrawAccountId);
      if (account) {
        let deductAmount = body.amount;
        // Convert currency if they differ
        const expCurrency = body.currency ?? "USD";
        const acctCurrency = account.currency ?? "USD";
        if (expCurrency !== acctCurrency) {
          const rates = FALLBACK_RATES;
          const inUsd = deductAmount / (rates[expCurrency] || 1);
          deductAmount = inUsd * (rates[acctCurrency] || 1);
        }
        account.transactions.push({
          amount: -deductAmount,
          type: "Expense",
        } as any);
        account.amount -= deductAmount;
        await account.save();
      }
    } catch {
      // Expense was already created — log but don't fail the response
      console.error("Failed to withdraw from networth account");
    }
  }

  return NextResponse.json(expense, { status: 201 });
}
