import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import QuickLink from "@/models/quick_link";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const link = await QuickLink.findByIdAndDelete(id);

  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
