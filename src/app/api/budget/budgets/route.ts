import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CategoryBudget from "@/models/category_budget";

export async function GET(request: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const now = new Date();
  const m = month ? parseInt(month, 10) : now.getMonth() + 1;
  const y = year ? parseInt(year, 10) : now.getFullYear();

  const budgets = await CategoryBudget.find({ month: m, year: y });
  return NextResponse.json(budgets);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const { category, month, year, ...rest } = body;

  // Upsert: create or update budget for this category+month+year
  const budget = await CategoryBudget.findOneAndUpdate(
    { category, month, year },
    { ...rest, category, month, year },
    { new: true, upsert: true, runValidators: true },
  );

  return NextResponse.json(budget, { status: 201 });
}
