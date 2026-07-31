import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Asset, { syncAssetValue } from "@/models/asset";

// DELETE /api/networth/assets/[id]/value/[entryId]
// Removes a value snapshot. The asset's current value always tracks the most
// recent remaining snapshot.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  await dbConnect();
  const { id, entryId } = await params;

  const asset = await Asset.findById(id);
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const index = asset.valueHistory.findIndex(
    (entry) => String((entry as { _id?: unknown })._id) === entryId,
  );
  if (index === -1) {
    return NextResponse.json(
      { error: "Value entry not found" },
      { status: 404 },
    );
  }

  asset.valueHistory.splice(index, 1);
  syncAssetValue(asset);

  await asset.save();
  return NextResponse.json(asset);
}
