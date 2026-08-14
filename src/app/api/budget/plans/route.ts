import { NextRequest, NextResponse } from "next/server";
import type { QueryFilter } from "mongoose";
import dbConnect from "@/lib/db";
import FuturePlan, { IFuturePlan } from "@/models/future_plan";

const PLAN_STATUSES = ["Active", "Completed", "Cancelled"] as const;
type PlanStatus = (typeof PLAN_STATUSES)[number];

function isPlanStatus(value: string): value is PlanStatus {
  return (PLAN_STATUSES as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  if (status !== null && !isPlanStatus(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${PLAN_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const filter: QueryFilter<IFuturePlan> = status ? { status } : {};
  const plans = await FuturePlan.find(filter).sort({ createdAt: -1 });
  return NextResponse.json(plans);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const plan = await FuturePlan.create(body);
  return NextResponse.json(plan, { status: 201 });
}
