import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Asset from "@/models/asset";

export async function GET() {
  await dbConnect();
  const assets = await Asset.find().sort({ createdAt: -1 });
  return NextResponse.json(assets);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();

  // Seed the value history so a newly created asset already has a trend: the
  // acquisition itself, plus today's value when it differs from what was paid.
  const acquisitionDate = body.acquisitionDate
    ? new Date(body.acquisitionDate)
    : new Date();
  const acquisitionCost = Number(body.acquisitionCost ?? 0);
  const value = Number(body.value ?? 0);

  const valueHistory: { date: Date; value: number; note: string }[] = [];
  if (acquisitionCost > 0) {
    valueHistory.push({
      date: acquisitionDate,
      value: acquisitionCost,
      note: "Acquisition",
    });
  }
  if (valueHistory.length === 0 || acquisitionCost !== value) {
    valueHistory.push({
      date: new Date(),
      value,
      note: "Initial value",
    });
  }

  const asset = await Asset.create({ ...body, valueHistory });
  return NextResponse.json(asset, { status: 201 });
}
