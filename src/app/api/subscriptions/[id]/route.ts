import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscription from "@/models/subscription";
import {
  deleteSubscriptionBudgetLink,
  syncSubscriptionToBudget,
} from "@/lib/subscriptions-budget-sync";
import { normalizeTags } from "@/lib/subscriptions-types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();

  const subscription = await Subscription.findByIdAndUpdate(
    id,
    {
      ...body,
      ...(Array.isArray(body.tags) ? { tags: normalizeTags(body.tags) } : {}),
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!subscription) {
    return NextResponse.json(
      { error: "Subscription not found" },
      { status: 404 },
    );
  }

  await syncSubscriptionToBudget(subscription);

  return NextResponse.json(subscription);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;

  const subscription = await Subscription.findById(id);
  if (!subscription) {
    return NextResponse.json(
      { error: "Subscription not found" },
      { status: 404 },
    );
  }

  await deleteSubscriptionBudgetLink(subscription);
  await subscription.deleteOne();

  return NextResponse.json({ ok: true });
}
