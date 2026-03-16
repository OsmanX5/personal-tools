import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Habit from "@/models/habit";

export async function GET() {
  await dbConnect();
  const habits = await Habit.find({ isActive: true }).sort({ createdAt: 1 });
  return NextResponse.json(habits);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const habit = await Habit.create(body);
  return NextResponse.json(habit, { status: 201 });
}
