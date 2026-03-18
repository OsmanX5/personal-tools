import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Expense from "@/models/expense";
import NetWorthAccount from "@/models/networth_account";

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

  const expenses = await Expense.find({
    date: { $gte: start, $lt: end },
  }).sort({ date: -1 });

  return NextResponse.json(expenses);
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
