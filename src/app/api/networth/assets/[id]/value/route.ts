import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Asset, { syncAssetValue } from "@/models/asset";

// POST /api/networth/assets/[id]/value
// Records a dated value snapshot and moves the asset to that value.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();

  const asset = await Asset.findById(id);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  if (body.value === undefined) {
    return NextResponse.json({ error: "value is required" }, { status: 400 });
  }

  const value = Number(body.value);
  if (Number.isNaN(value)) {
    return NextResponse.json(
      { error: "value must be a number" },
      { status: 400 },
    );
  }

  const date = body.date ? new Date(body.date) : new Date();
  asset.valueHistory.push({
    date: Number.isNaN(date.getTime()) ? new Date() : date,
    value,
    note: body.note,
  });
  syncAssetValue(asset);

  await asset.save();
  return NextResponse.json(asset, { status: 201 });
}
