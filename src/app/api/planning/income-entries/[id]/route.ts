import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import IncomeEntry from "@/models/income_entry";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const entry = await IncomeEntry.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });
  if (!entry) {
    return NextResponse.json(
      { error: "Income entry not found" },
      { status: 404 },
    );
  }
  return NextResponse.json(entry);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const entry = await IncomeEntry.findByIdAndDelete(id);
  if (!entry) {
    return NextResponse.json(
      { error: "Income entry not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}
