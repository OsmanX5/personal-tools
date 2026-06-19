import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscription from "@/models/subscription";
import { normalizeTags } from "@/lib/subscriptions-types";
import { syncSubscriptionToBudget } from "@/lib/subscriptions-budget-sync";

export async function GET() {
  await dbConnect();
  const subscriptions = await Subscription.find().sort({ createdAt: -1 });
  return NextResponse.json(subscriptions);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const subscription = await Subscription.create({
    ...body,
    tags: normalizeTags(body.tags ?? []),
  });

  await syncSubscriptionToBudget(subscription);

  return NextResponse.json(subscription, { status: 201 });
}
