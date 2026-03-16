import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FinanceAccount from "@/models/finance_account";

// POST /api/finance/[id]/transactions
// Adds a transaction and updates the account amount accordingly
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();

  const account = await FinanceAccount.findById(id);
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // If "newAmount" is provided, calculate the transaction from the difference
  if (body.newAmount !== undefined) {
    const diff = body.newAmount - account.amount;
    const type =
      body.updateKind === "MarketChange"
        ? "MarketChange"
        : diff >= 0
          ? "Income"
          : "Expense";
    account.transactions.push({ amount: diff, type } as any);
    account.amount = body.newAmount;
  } else {
    // Direct transaction: add the transaction and update amount
    const { amount, type } = body;
    if (amount === undefined || !type) {
      return NextResponse.json(
        { error: "amount and type are required" },
        { status: 400 },
      );
    }
    account.transactions.push({ amount, type } as any);
    account.amount += amount;
  }

  await account.save();
  return NextResponse.json(account, { status: 201 });
}
