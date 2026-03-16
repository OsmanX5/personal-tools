import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import HabitLog from "@/models/habit_log";

export async function GET(request: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const habitId = searchParams.get("habitId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (habitId) filter.habitId = habitId;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const logs = await HabitLog.find(filter).sort({ date: -1 });
  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  // Normalise date to midnight UTC
  if (body.date) {
    const d = new Date(body.date);
    body.date = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
    );
  }
  const log = await HabitLog.create(body);
  return NextResponse.json(log, { status: 201 });
}
