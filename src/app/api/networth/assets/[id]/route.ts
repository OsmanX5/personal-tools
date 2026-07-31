import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Asset, { syncAssetValue } from "@/models/asset";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const asset = await Asset.findById(id);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
  return NextResponse.json(asset);
}

export async function PUT(
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

  // Editing the value directly still records a snapshot, so the history stays
  // a truthful record of what the asset was worth over time.
  const nextValue = body.value === undefined ? asset.value : Number(body.value);
  const valueChanged = nextValue !== asset.value;

  // History is append-only through this route — never overwritten wholesale.
  const updates = { ...body };
  delete updates.valueHistory;
  Object.assign(asset, updates);

  if (valueChanged) {
    asset.valueHistory.push({
      date: new Date(),
      value: nextValue,
      note: "Edited",
    });
    syncAssetValue(asset);
  }

  await asset.save();
  return NextResponse.json(asset);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const asset = await Asset.findByIdAndDelete(id);

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
