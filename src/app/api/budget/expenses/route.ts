import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Expense from "@/models/expense";

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
  return NextResponse.json(expense, { status: 201 });
}
