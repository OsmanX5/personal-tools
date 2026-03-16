import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import WeightGoal from "@/models/weight_goal";

export async function GET() {
  await dbConnect();
  const goals = await WeightGoal.find().sort({ createdAt: -1 });
  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const goal = await WeightGoal.create(body);
  return NextResponse.json(goal, { status: 201 });
}
