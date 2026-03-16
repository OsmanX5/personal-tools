import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import WeightGoal from "@/models/weight_goal";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const goal = await WeightGoal.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  return NextResponse.json(goal);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const goal = await WeightGoal.findByIdAndDelete(id);

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
