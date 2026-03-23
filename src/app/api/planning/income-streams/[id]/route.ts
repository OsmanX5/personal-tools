import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import IncomeStream from "@/models/income_stream";
import IncomeEntry from "@/models/income_entry";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const stream = await IncomeStream.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });
  if (!stream) {
    return NextResponse.json(
      { error: "Income stream not found" },
      { status: 404 },
    );
  }
  return NextResponse.json(stream);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await dbConnect();
  const { id } = await params;
  const stream = await IncomeStream.findByIdAndDelete(id);
  if (!stream) {
    return NextResponse.json(
      { error: "Income stream not found" },
      { status: 404 },
    );
  }
  // Cascade: delete all entries for this stream
  await IncomeEntry.deleteMany({ streamId: id });
  return NextResponse.json({ ok: true });
}
