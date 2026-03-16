import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CategoryBudget from "@/models/category_budget";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const budget = await CategoryBudget.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });
  if (!budget) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }
  return NextResponse.json(budget);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const budget = await CategoryBudget.findByIdAndDelete(id);
  if (!budget) {
    return NextResponse.json({ error: "Budget not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
