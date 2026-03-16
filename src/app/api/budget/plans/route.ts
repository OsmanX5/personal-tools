import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FuturePlan from "@/models/future_plan";

export async function GET(request: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const filter = status ? { status } : {};
  const plans = await FuturePlan.find(filter).sort({ createdAt: -1 });
  return NextResponse.json(plans);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const plan = await FuturePlan.create(body);
  return NextResponse.json(plan, { status: 201 });
}
