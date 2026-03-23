import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import IncomeEntry from "@/models/income_entry";

export async function GET(request: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const now = new Date();
  const m = month ? parseInt(month, 10) : now.getMonth() + 1;
  const y = year ? parseInt(year, 10) : now.getFullYear();

  const entries = await IncomeEntry.find({ month: m, year: y }).sort({
    createdAt: -1,
  });
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();

  // Upsert: one entry per stream per month
  const entry = await IncomeEntry.findOneAndUpdate(
    { streamId: body.streamId, month: body.month, year: body.year },
    body,
    { new: true, upsert: true, runValidators: true },
  );
  return NextResponse.json(entry, { status: 201 });
}
