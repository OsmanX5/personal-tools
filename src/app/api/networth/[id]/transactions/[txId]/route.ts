import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import NetWorthAccount from "@/models/networth_account";

// DELETE /api/networth/[id]/transactions/[txId]
// Removes the transaction and reverses its effect on the account balance
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; txId: string }> },
) {
  await dbConnect();
  const { id, txId } = await params;

  const account = await NetWorthAccount.findById(id);
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const tx = account.transactions.id(txId);
  if (!tx) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 },
    );
  }

  // Reverse the transaction's effect on the account balance
  account.amount -= tx.amount;
  tx.deleteOne();

  await account.save();
  return NextResponse.json(account);
}
