import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Habit from "@/models/habit";
import HabitLog from "@/models/habit_log";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const habit = await Habit.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });
  if (!habit) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }
  return NextResponse.json(habit);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const habit = await Habit.findByIdAndDelete(id);
  if (!habit) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }
  // Cascade delete all logs for this habit
  await HabitLog.deleteMany({ habitId: id });
  return NextResponse.json({ ok: true });
}
