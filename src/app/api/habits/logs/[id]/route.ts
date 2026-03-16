import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import HabitLog from "@/models/habit_log";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const log = await HabitLog.findByIdAndDelete(id);
  if (!log) {
    return NextResponse.json({ error: "Log not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
